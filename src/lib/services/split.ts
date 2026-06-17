/**
 * Stellar split-payment engine — powered by Soroban Split Payment Contract.
 *
 * Primary path: invoke the Soroban `execute_split_payment` contract method,
 * which moves real USDC to multiple destinations in one on-chain instruction.
 * Each leg also generates a Stellar-style receipt with tx hash and memo.
 *
 * Settlement asset: USDC on Stellar. XLM is used only for network fees.
 *
 * SERVER-ONLY.
 */
import { SplitPayment, type SplitLeg } from "@/lib/stellar/contracts";
import { newReference, type StellarReceipt } from "@/lib/stellar/receipts";
import { deriveDestination } from "@/lib/stellar/wallet";
import { ASSETS } from "@/lib/stellar/assets";
import type { CurrencyCode } from "@/lib/types";
import type { ContractEvent } from "@/lib/stellar/soroban";

export interface SplitInput {
  label: string;
  destinationType: "member" | "vault" | "bill" | "school";
  stellarDestination?: string;
  percentage?: number;
  amount?: number;
  memo?: string;
}

export interface SplitRequest {
  userId: string;
  total: number;
  currency: CurrencyCode;
  funder?: string;
  sourceAccount?: string;
  items: SplitInput[];
}

export interface SplitResult {
  reference: string;
  total: number;
  currency: CurrencyCode;
  status: "completed" | "failed";
  receipts: StellarReceipt[];
  contractEvents: ContractEvent[];
  contractId: string;
  contractTxHash: string;
  totalFeeStroops: number;
  simulated: boolean;
  settlementAsset: string;
}

/** Resolve each item's absolute amount from percentage or explicit amount. */
export function resolveSplitAmounts(total: number, items: SplitInput[]) {
  return items.map((it) => ({
    ...it,
    resolvedAmount:
      it.amount ?? +(((it.percentage ?? 0) / 100) * total).toFixed(2),
  }));
}

export async function executeSplit(req: SplitRequest): Promise<SplitResult> {
  const reference = newReference("SPLIT");
  const resolved = resolveSplitAmounts(req.total, req.items);
  const funder = req.funder ?? req.sourceAccount ?? "GMOSI_USER";

  // Build Soroban split legs (basis points must sum to 10_000)
  const legs: SplitLeg[] = await Promise.all(
    resolved.map(async (item) => ({
      label: item.label.slice(0, 28),
      destination: item.stellarDestination ?? (await deriveDestination(item.label)),
      bps: Math.round((item.percentage ?? (item.resolvedAmount / req.total) * 100) * 100),
    }))
  );

  // Normalise bps to exactly 10_000 (last leg absorbs rounding)
  const bpsSum = legs.reduce((s, l) => s + l.bps, 0);
  if (bpsSum !== 10_000 && legs.length > 0) {
    legs[legs.length - 1].bps += 10_000 - bpsSum;
  }

  // Execute via Soroban Split Payment Contract
  await SplitPayment.createRule(legs);
  const contractResult = await SplitPayment.execute(funder, req.total);

  // Build Stellar-style receipts from contract events (one per leg)
  const receipts: StellarReceipt[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const item = resolved[i];
    const destination = legs[i].destination;
    const event = contractResult.events[i];
    receipts.push({
      reference: `${reference}-${i + 1}`,
      status: "success",
      hash: event?.txHash ?? contractResult.txHash,
      operationType: "split_payment",
      asset: ASSETS.USDC.code,
      sourceAccount: funder,
      destinationAccount: destination,
      amount: `${item.resolvedAmount.toFixed(2)} ${ASSETS.USDC.code}`,
      feeStroops: 100,
      memo: item.memo ?? "FAMILY_SUPPORT",
      network: "testnet",
      timestamp: event?.timestamp ?? new Date().toISOString(),
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${event?.txHash ?? contractResult.txHash}`,
      sourceExplorerUrl: `https://stellar.expert/explorer/testnet/account/${funder}`,
      destinationExplorerUrl: `https://stellar.expert/explorer/testnet/account/${destination}`,
      simulated: contractResult.simulated,
    });
  }

  return {
    reference,
    total: req.total,
    currency: req.currency,
    status: contractResult.success ? "completed" : "failed",
    receipts,
    contractEvents: contractResult.events,
    contractId: contractResult.contractId,
    contractTxHash: contractResult.txHash,
    totalFeeStroops: 100 * resolved.length,
    simulated: contractResult.simulated,
    settlementAsset: ASSETS.USDC.code,
  };
}
