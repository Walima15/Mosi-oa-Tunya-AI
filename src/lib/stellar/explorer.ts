/**
 * Stellar Expert explorer URL helpers. Safe to use anywhere (no secrets).
 */
import { STELLAR } from "@/lib/stellar/client";

const NET = STELLAR.network === "public" ? "public" : "testnet";

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/${NET}/tx/${hash}`;
}

export function explorerAccountUrl(publicKey: string): string {
  return `https://stellar.expert/explorer/${NET}/account/${publicKey}`;
}

export function explorerAssetUrl(code: string, issuer?: string): string {
  if (!issuer) return `https://stellar.expert/explorer/${NET}/asset/${code}`;
  return `https://stellar.expert/explorer/${NET}/asset/${code}-${issuer}`;
}

/** Shorten a Stellar public key / tx hash for display: GABC…WXYZ */
export function shortKey(value: string, lead = 4, tail = 4): string {
  if (!value) return "";
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
