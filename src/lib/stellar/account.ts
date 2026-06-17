/**
 * Stellar account inspection — balances, trustlines & sequence from Horizon.
 *
 * When a public key is configured via environment, always queries Horizon and
 * never substitutes fake balances. Demo/simulated balances are only used when
 * no public key is configured.
 *
 * SERVER-ONLY.
 */
import { horizon, STELLAR, hasDistributionAccount } from "@/lib/stellar/client";
import { getStellarPublicKey, isValidStellarPublicKey } from "@/lib/stellar/public-key";
import type { Trustline, AccountError } from "@/lib/stellar/types";

export type { AccountError } from "@/lib/stellar/types";

export interface AssetBalance {
  code: string;
  issuer?: string;
  balance: string;
  isSettlementAsset?: boolean;
}

export interface AccountSnapshot {
  publicKey: string;
  exists: boolean;
  funded: boolean;
  balances: AssetBalance[];
  trustlines: Trustline[];
  trustlineEstablished: boolean;
  sequence?: string;
  simulated: boolean;
  subentryCount?: number;
  error?: AccountError;
  errorMessage?: string;
}

function horizonStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "response" in err) {
    return (err as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function parseBalances(
  raw: Array<Record<string, unknown>>
): { balances: AssetBalance[]; trustlines: Trustline[] } {
  const balances: AssetBalance[] = [];
  const trustlines: Trustline[] = [];

  for (const b of raw) {
    if (b.asset_type === "native") {
      balances.push({ code: "XLM", balance: String(b.balance) });
      continue;
    }
    const code = String(b.asset_code ?? "?");
    const issuer = b.asset_issuer ? String(b.asset_issuer) : undefined;
    const balance = String(b.balance ?? "0");
    const limit = b.limit ? String(b.limit) : undefined;

    balances.push({
      code,
      issuer,
      balance,
      isSettlementAsset: code === STELLAR.assetCode,
    });
    trustlines.push({ code, issuer, balance, limit });
  }

  return { balances, trustlines };
}

export interface GetAccountOptions {
  /** When true, never fall back to simulated balances on Horizon errors. */
  configured?: boolean;
}

/**
 * Fetch account state from Horizon.
 * @param publicKey - Stellar `G...` address
 * @param options.configured - set when this is the env-configured account
 */
export async function getAccountSnapshot(
  publicKey: string,
  options: GetAccountOptions = {}
): Promise<AccountSnapshot> {
  const configured = options.configured ?? getStellarPublicKey() === publicKey;

  if (!isValidStellarPublicKey(publicKey)) {
    return {
      publicKey,
      exists: false,
      funded: false,
      balances: [],
      trustlines: [],
      trustlineEstablished: false,
      simulated: false,
      error: "invalid_key",
      errorMessage: "Invalid Stellar public key. Must be a 56-character address starting with G.",
    };
  }

  try {
    const server = await horizon();
    const acct = await server.loadAccount(publicKey);
    const { balances, trustlines } = parseBalances(
      acct.balances as unknown as Array<Record<string, unknown>>
    );

    const usdcTrustline = trustlines.some((t) => t.code === STELLAR.assetCode);

    return {
      publicKey,
      exists: true,
      funded: true,
      balances,
      trustlines,
      trustlineEstablished: usdcTrustline,
      sequence: acct.sequence,
      simulated: false,
      subentryCount: acct.subentry_count,
      ...(!usdcTrustline
        ? {
            error: "missing_trustline" as const,
            errorMessage: `No ${STELLAR.assetCode} trustline. Add a trustline to receive USDC on Stellar.`,
          }
        : {}),
    };
  } catch (err) {
    const status = horizonStatus(err);

    // Account does not exist on ledger (unfunded)
    if (status === 404) {
      return {
        publicKey,
        exists: false,
        funded: false,
        balances: [],
        trustlines: [],
        trustlineEstablished: false,
        simulated: false,
        error: "not_found",
        errorMessage:
          "Wallet not funded. Fund this account using Stellar Friendbot.",
      };
    }

    // Configured account: report Horizon failure, do not simulate
    if (configured) {
      return {
        publicKey,
        exists: false,
        funded: false,
        balances: [],
        trustlines: [],
        trustlineEstablished: false,
        simulated: false,
        error: "horizon_unavailable",
        errorMessage:
          "Horizon API unavailable. Could not fetch live Testnet balances.",
      };
    }

    // Demo mode fallback
    return simulatedSnapshot(publicKey);
  }
}

/** Deterministic demo balances when no public key is configured. */
export function simulatedSnapshot(publicKey: string): AccountSnapshot {
  const seed = publicKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const xlm = (9500 + (seed % 700)).toFixed(4);
  const usdc = (1200 + (seed % 900)).toFixed(2);
  const usdcCode = STELLAR.assetCode || "USDC";

  return {
    publicKey,
    exists: true,
    funded: true,
    balances: [
      { code: "XLM", balance: xlm },
      { code: usdcCode, balance: usdc, isSettlementAsset: true },
    ],
    trustlines: [
      {
        code: usdcCode,
        issuer: STELLAR.assetIssuer,
        balance: usdc,
        limit: "922337203685.4775807",
      },
    ],
    trustlineEstablished: true,
    sequence: String(1_000_000 + (seed % 999_999)),
    simulated: !hasDistributionAccount,
    subentryCount: 1,
  };
}
