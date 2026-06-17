/**
 * Stellar asset layer — XLM, USDC and ZMW display conversion.
 *
 * XLM  = native Stellar asset (network fees, wallet activity)
 * USDC = primary settlement stablecoin (remittances, vaults, family finance)
 * ZMW  = local payout display currency (estimated from USDC via FX rate)
 *
 * USDC on Stellar uses 7 decimals (stroops). This module normalises between
 * stroops and human-readable amounts.
 */
import { STELLAR } from "@/lib/stellar/client";

/** USDC on Stellar has 7 decimal places. */
export const USDC_DECIMALS = 7;
export const XLM_DECIMALS = 7;

/** Default USD/ZMW rate used for ZMW display estimates (demo + fallback). */
export const USD_ZMW_RATE = Number(process.env.NEXT_PUBLIC_USD_ZMW_RATE ?? "27.62");

/** Testnet Circle USDC issuer (override via env for mainnet). */
export const USDC_ISSUER =
  process.env.STELLAR_SETTLEMENT_ASSET_ISSUER ??
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQVOFLHQ7FQY2W5Q4EYE5Z"; // testnet Circle USDC

export const ASSETS = {
  /** Native Stellar lumens — used for transaction fees. */
  XLM: { code: "XLM", issuer: undefined, decimals: XLM_DECIMALS, role: "fees" as const },
  /** Primary settlement stablecoin for all remittances and vaults. */
  USDC: {
    code: STELLAR.assetCode || "USDC",
    issuer: USDC_ISSUER,
    decimals: USDC_DECIMALS,
    role: "settlement" as const,
  },
  /** Local display currency — not on-chain, derived from USDC. */
  ZMW: { code: "ZMW", issuer: undefined, decimals: 2, role: "display" as const },
} as const;

/** Convert a human USDC amount to stroops (7 decimals). */
export function toStroops(amount: number, decimals = USDC_DECIMALS): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

/** Convert stroops back to a human USDC amount. */
export function fromStroops(stroops: bigint | number, decimals = USDC_DECIMALS): number {
  return Number(stroops) / 10 ** decimals;
}

/** Estimate ZMW value from a USDC balance. */
export function usdcToZmw(usdc: number, rate = USD_ZMW_RATE): number {
  return +(usdc * rate).toFixed(2);
}

/** Estimate ZMW value from an XLM balance (via USD). */
export function xlmToZmw(xlm: number, xlmUsd = 0.115, rate = USD_ZMW_RATE): number {
  return +(xlm * xlmUsd * rate).toFixed(2);
}

/** Combined wallet summary for the UI. */
export interface WalletAssetSummary {
  xlm: number;
  usdc: number;
  estimatedZmw: number;
  usdZmwRate: number;
  trustlineEstablished: boolean;
  settlementAsset: string;
}

export function summarizeWalletAssets(
  xlm: number,
  usdc: number,
  trustlineEstablished = true
): WalletAssetSummary {
  return {
    xlm,
    usdc,
    estimatedZmw: usdcToZmw(usdc) + xlmToZmw(xlm),
    usdZmwRate: USD_ZMW_RATE,
    trustlineEstablished,
    settlementAsset: ASSETS.USDC.code,
  };
}

/** Format USDC for display with the settlement asset label. */
export function formatUsdc(amount: number): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ASSETS.USDC.code}`;
}

/** Format XLM for display. */
export function formatXlm(amount: number): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} XLM`;
}

/** Format estimated ZMW value. */
export function formatZmwEstimate(amount: number): string {
  return `≈ K${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
