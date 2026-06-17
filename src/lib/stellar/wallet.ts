/**
 * Stellar wallet creation & secret-key management.
 *
 * Keypairs are generated with the real Stellar SDK — even in demo mode — so
 * every user gets a genuine Stellar address (G...). Secret keys (S...) are
 * AES-256-GCM encrypted before they ever touch the database and are NEVER
 * returned to the client.
 *
 * SERVER-ONLY.
 */
import crypto from "crypto";

export interface GeneratedWallet {
  publicKey: string;
  /** Encrypted secret — safe to persist. Decrypt only server-side at sign time. */
  encryptedSecret: string;
  network: "testnet" | "public";
}

const ALGO = "aes-256-gcm";

/** Derive a 32-byte key from the configured encryption secret. */
function encryptionKey(): Buffer {
  const raw =
    process.env.STELLAR_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "mosi-oa-tunya-demo-encryption-key-please-change";
  return crypto.createHash("sha256").update(raw).digest();
}

/** Encrypt a Stellar secret key. Format: ivHex:tagHex:cipherHex */
export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Decrypt a previously-encrypted Stellar secret key. */
export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** Generate a brand-new Stellar wallet (real keypair, encrypted secret). */
export async function createWallet(
  network: "testnet" | "public" = "testnet"
): Promise<GeneratedWallet> {
  const { Keypair } = await import("@stellar/stellar-sdk");
  const kp = Keypair.random();
  return {
    publicKey: kp.publicKey(),
    encryptedSecret: encryptSecret(kp.secret()),
    network,
  };
}

/**
 * Deterministically derive a display-only Stellar address from a seed string.
 * Used in demo mode to give family members / vaults stable, real-format
 * destination accounts without persisting secrets for each.
 */
export async function deriveDestination(seed: string): Promise<string> {
  const { Keypair } = await import("@stellar/stellar-sdk");
  const hash = crypto.createHash("sha256").update("mosi:" + seed).digest();
  return Keypair.fromRawEd25519Seed(hash).publicKey();
}
