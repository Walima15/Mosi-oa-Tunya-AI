/**
 * Goal Vault engine — Soroban Goal Vault Contract + USDC settlement.
 *
 * Vaults are created and funded via the Soroban `goal_vault` contract, which
 * locks and tracks real USDC (Stellar Asset Contract token). XLM is used only
 * for network fees. Every deposit yields a Stellar-style receipt plus Soroban
 * contract events.
 *
 * SERVER-ONLY.
 */
import { GoalVault } from "@/lib/stellar/contracts";
import { receiptFromContractInvoke, type StellarReceipt } from "@/lib/stellar/receipts";
import { usdcSacAddress } from "@/lib/stellar/soroban";
import { createWallet } from "@/lib/stellar/wallet";
import { distributionPublicKey } from "@/lib/stellar/payments";
import { ASSETS } from "@/lib/stellar/assets";
import type { ContractEvent } from "@/lib/stellar/soroban";
import type { CurrencyCode, VaultType } from "@/lib/types";

export const VAULT_MEMO: Record<VaultType, string> = {
  house: "HOUSE_FUND_DEPOSIT",
  education: "EDUCATION_FUND_DEPOSIT",
  emergency: "EMERGENCY_RESERVE",
  retirement: "RETIREMENT_DEPOSIT",
  school_fees: "SCHOOL_FEES",
  general: "SAVINGS_DEPOSIT",
};

export interface VaultCreateRequest {
  userId: string;
  vaultName: string;
  vaultType: VaultType;
  targetAmount: number;
  currency: CurrencyCode;
}

export interface VaultCreateResult {
  stellarPublicKey: string;
  contractId: string;
  contractEvents: ContractEvent[];
  simulated: boolean;
  settlementAsset: string;
}

export interface VaultDepositRequest {
  userId: string;
  vaultName: string;
  vaultType: VaultType;
  vaultAccount?: string;
  amount: number;
  currency: CurrencyCode;
  sourceAccount?: string;
}

export interface VaultDepositResult {
  receipt: StellarReceipt;
  amount: number;
  currency: CurrencyCode;
  simulated: boolean;
  contractId: string;
  contractEvents: ContractEvent[];
  settlementAsset: string;
}

/** Create a Soroban Goal Vault contract instance for a savings goal. */
export async function createGoalVault(req: VaultCreateRequest): Promise<VaultCreateResult> {
  const wallet = await createWallet();
  const usdc = usdcSacAddress();
  const result = await GoalVault.create(
    wallet.publicKey,
    usdc,
    req.vaultName,
    req.vaultType,
    req.targetAmount
  );
  return {
    stellarPublicKey: wallet.publicKey,
    contractId: result.contractId,
    contractEvents: result.events,
    simulated: result.simulated,
    settlementAsset: ASSETS.USDC.code,
  };
}

/** Deposit USDC into a vault via the Soroban `deposit_to_vault` method. */
export async function depositToVault(req: VaultDepositRequest): Promise<VaultDepositResult> {
  const from = req.sourceAccount ?? (await distributionPublicKey());
  const destination = req.vaultAccount ?? GoalVault.contractId();
  const result = await GoalVault.deposit(from, req.amount);

  return {
    receipt: receiptFromContractInvoke(
      result,
      "vault_deposit",
      from,
      destination,
      req.amount,
      VAULT_MEMO[req.vaultType]
    ),
    amount: req.amount,
    currency: req.currency,
    simulated: result.simulated,
    contractId: result.contractId,
    contractEvents: result.events,
    settlementAsset: ASSETS.USDC.code,
  };
}

/** Forecast months-to-target given a monthly contribution. */
export function forecastVault(target: number, current: number, monthly: number) {
  const remaining = Math.max(0, target - current);
  const months = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const eta = months
    ? new Date(Date.now() + months * 30 * 86400000).toISOString().slice(0, 10)
    : null;
  return { remaining, months, eta, pct: Math.min(100, Math.round((current / target) * 100)) };
}
