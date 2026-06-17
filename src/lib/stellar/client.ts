/**
 * Stellar client — network configuration & shared primitives.
 *
 * This is the single source of truth for how Mosi-oa-Tunya AI talks to the
 * Stellar network. Everything Stellar-related (wallets, payments, vaults,
 * path payments, receipts) builds on top of this module.
 *
 * SERVER-ONLY. Never import this from a client component — it touches
 * distribution secrets and the Horizon server.
 */
import { env } from "@/lib/config";
import { getStellarPublicKey, hasConfiguredStellarAccount } from "@/lib/stellar/public-key";

export { getStellarPublicKey, hasConfiguredStellarAccount, isValidStellarPublicKey } from "@/lib/stellar/public-key";

export type StellarNetwork = "testnet" | "public";

/** Testnet Circle USDC issuer — primary settlement asset for remittances & vaults. */
const DEFAULT_USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQVOFLHQ7FQY2W5Q4EYE5Z";

export const STELLAR = {
  network: (env.stellarNetwork === "public" ? "public" : "testnet") as StellarNetwork,
  horizonUrl: env.stellarHorizon,
  /** Primary settlement stablecoin — USDC on Stellar (not XLM). */
  assetCode: process.env.STELLAR_SETTLEMENT_ASSET_CODE ?? "USDC",
  assetIssuer: process.env.STELLAR_SETTLEMENT_ASSET_ISSUER || DEFAULT_USDC_ISSUER,
} as const;

/** True when a funded distribution account is configured for real submission. */
export const hasDistributionAccount = Boolean(process.env.STELLAR_DISTRIBUTION_SECRET);

/** Network passphrase for the active network. */
export async function networkPassphrase(): Promise<string> {
  const { Networks } = await import("@stellar/stellar-sdk");
  return STELLAR.network === "public" ? Networks.PUBLIC : Networks.TESTNET;
}

/** A connected Horizon server instance. */
export async function horizon() {
  const { Horizon } = await import("@stellar/stellar-sdk");
  return new Horizon.Server(STELLAR.horizonUrl);
}

/** Build the USDC settlement asset (classic Stellar asset). XLM is fees-only. */
export async function settlementAsset() {
  const { Asset } = await import("@stellar/stellar-sdk");
  return new Asset(STELLAR.assetCode, STELLAR.assetIssuer);
}

export interface NetworkStatus {
  network: StellarNetwork;
  horizonUrl: string;
  online: boolean;
  latestLedger?: number;
  baseFeeStroops: number;
  settlementAsset: string;
  mode: "live" | "simulated";
  configuredPublicKey: string | null;
  accountLinked: boolean;
}

/** Probe Horizon for network status and whether a configured account is linked. */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const configuredPublicKey = getStellarPublicKey();
  const base = {
    network: STELLAR.network,
    horizonUrl: STELLAR.horizonUrl,
    baseFeeStroops: 100,
    settlementAsset: STELLAR.assetCode,
    configuredPublicKey,
    accountLinked: hasConfiguredStellarAccount(),
    mode:
      hasConfiguredStellarAccount() || hasDistributionAccount
        ? ("live" as const)
        : ("simulated" as const),
  };
  try {
    const server = await horizon();
    const ledgers = await server.ledgers().order("desc").limit(1).call();
    return {
      ...base,
      online: true,
      latestLedger: ledgers.records[0]?.sequence,
    };
  } catch {
    return { ...base, online: false };
  }
}
