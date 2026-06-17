import type { StellarNetwork, StellarWallet } from "@/lib/types";

export type AccountError =
  | "not_configured"
  | "invalid_key"
  | "not_found"
  | "horizon_unavailable"
  | "missing_trustline";

export interface Trustline {
  code: string;
  issuer?: string;
  balance: string;
  limit?: string;
}

/** Wallet shape returned by `/api/stellar/wallet` and the wallet UI. */
export interface StellarWalletView extends StellarWallet {
  exists: boolean;
  simulated: boolean;
  configured: boolean;
  sequence?: string;
  trustlines: Trustline[];
  explorerUrl: string;
  error?: AccountError;
  errorMessage?: string;
}

export type { StellarNetwork };
