/**
 * Stellar receipts — a normalized, judge-friendly representation of any
 * Stellar operation (payment, vault deposit, split item, path payment).
 *
 * Receipts are the visual proof of Stellar usage: every money movement in the
 * product produces one, with a real-format tx hash and an explorer link.
 */
import { explorerTxUrl, explorerAccountUrl } from "@/lib/stellar/explorer";
import { STELLAR } from "@/lib/stellar/client";
import type { StellarPaymentResult } from "@/lib/stellar/payments";
import type { PathPaymentResult } from "@/lib/stellar/path-payment";
import type { InvokeResult } from "@/lib/stellar/soroban";
import { ASSETS } from "@/lib/stellar/assets";

export type ReceiptOperation =
  | "payment"
  | "vault_deposit"
  | "vault_withdraw"
  | "split_payment"
  | "path_payment"
  | "wallet_creation"
  | "contract_invoke";

export interface StellarReceipt {
  reference: string;
  status: "success" | "pending" | "failed";
  hash: string;
  operationType: ReceiptOperation;
  asset: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string;
  feeStroops: number;
  memo?: string;
  network: "testnet" | "public";
  timestamp: string;
  explorerUrl: string;
  sourceExplorerUrl: string;
  destinationExplorerUrl: string;
  simulated: boolean;
  /** Optional: child receipts for split payments. */
  items?: StellarReceipt[];
}

export function newReference(prefix = "MOT"): string {
  const chars = "0123456789ABCDEF";
  const id = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * 16)]).join("");
  return `${prefix}-${id}`;
}

/** Build a receipt from a completed Stellar payment result. */
export function receiptFromPayment(
  r: StellarPaymentResult,
  operationType: ReceiptOperation = "payment",
  reference = newReference()
): StellarReceipt {
  return {
    reference,
    status: r.success ? "success" : "failed",
    hash: r.hash,
    operationType,
    asset: r.asset,
    sourceAccount: r.source,
    destinationAccount: r.destination,
    amount: r.amount,
    feeStroops: r.feeStroops,
    memo: r.memo,
    network: r.network,
    timestamp: r.createdAt,
    explorerUrl: explorerTxUrl(r.hash),
    sourceExplorerUrl: explorerAccountUrl(r.source),
    destinationExplorerUrl: explorerAccountUrl(r.destination),
    simulated: r.simulated,
  };
}

/** Build a receipt from a path-payment (FX optimizer) result. */
export function receiptFromPathPayment(
  r: PathPaymentResult,
  source: string,
  destination: string,
  reference = newReference("FX")
): StellarReceipt {
  return {
    reference,
    status: r.success ? "success" : "failed",
    hash: r.hash,
    operationType: "path_payment",
    asset: `${r.sendAsset}→${r.destAsset}`,
    sourceAccount: source,
    destinationAccount: destination,
    amount: `${r.sendAmount} ${r.sendAsset} → ${r.destAmount} ${r.destAsset}`,
    feeStroops: 100,
    memo: "FX_CONVERSION",
    network: r.network,
    timestamp: r.createdAt,
    explorerUrl: explorerTxUrl(r.hash),
    sourceExplorerUrl: explorerAccountUrl(source),
    destinationExplorerUrl: explorerAccountUrl(destination),
    simulated: r.simulated,
  };
}

/** Build a receipt from a Soroban contract invocation (USDC movement). */
export function receiptFromContractInvoke(
  r: InvokeResult,
  operationType: ReceiptOperation = "contract_invoke",
  source: string,
  destination: string,
  amountUsdc: number,
  memo?: string,
  reference = newReference("SC")
): StellarReceipt {
  return {
    reference,
    status: r.success ? "success" : "failed",
    hash: r.txHash,
    operationType,
    asset: ASSETS.USDC.code,
    sourceAccount: source,
    destinationAccount: destination,
    amount: `${amountUsdc.toFixed(2)} ${ASSETS.USDC.code}`,
    feeStroops: 100,
    memo,
    network: STELLAR.network,
    timestamp: new Date().toISOString(),
    explorerUrl: explorerTxUrl(r.txHash),
    sourceExplorerUrl: explorerAccountUrl(source),
    destinationExplorerUrl: explorerAccountUrl(destination),
    simulated: r.simulated,
  };
}

/** Settlement asset label for UI badges. */
export const SETTLEMENT_ASSET = ASSETS.USDC.code;
