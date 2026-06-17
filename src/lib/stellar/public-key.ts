/**
 * Stellar public key resolution — safe for client and server.
 *
 * Only `G...` public keys are read from environment variables.
 * Secret keys (`S...`) must NEVER be referenced here.
 */

const STELLAR_PUBKEY_RE = /^G[A-Z2-7]{55}$/;

/** Placeholder values that should be treated as "not configured". */
const PLACEHOLDERS = new Set([
  "",
  "PASTE_YOUR_PUBLIC_KEY_HERE",
  "YOUR_PUBLIC_KEY_HERE",
  "G...",
]);

/** Validate a Stellar StrKey public key (starts with G, 56 chars). */
export function isValidStellarPublicKey(key: string): boolean {
  return STELLAR_PUBKEY_RE.test(key.trim());
}

/**
 * Return the configured Stellar public key, or `null` when unset/invalid.
 *
 * Reads `NEXT_PUBLIC_STELLAR_PUBLIC_KEY` (client-safe) and, on the server
 * only, falls back to `STELLAR_PUBLIC_KEY`.
 */
export function getStellarPublicKey(): string | null {
  const fromPublic =
    process.env.NEXT_PUBLIC_STELLAR_PUBLIC_KEY?.trim() ?? "";

  const fromServer =
    typeof window === "undefined"
      ? process.env.STELLAR_PUBLIC_KEY?.trim() ?? ""
      : "";

  const candidate = fromPublic || fromServer;

  if (!candidate || PLACEHOLDERS.has(candidate)) return null;
  if (!isValidStellarPublicKey(candidate)) return null;

  return candidate;
}

/** True when a real Stellar public key is configured in the environment. */
export function hasConfiguredStellarAccount(): boolean {
  return getStellarPublicKey() !== null;
}
