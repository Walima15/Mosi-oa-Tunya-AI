/**
 * Stellar settlement layer.
 *
 * Cross-border value moves as a stablecoin (e.g. anchored USDC) over the
 * Stellar network for near-instant, low-cost settlement. Fiat in/out happens
 * at the edges via mobile-money & aggregator anchors (see payments.ts).
 *
 * Flow:
 *   sender fiat ──anchor deposit──▶ stablecoin ──Stellar payment──▶
 *   recipient anchor ──payout──▶ recipient mobile money / bank
 *
 * This module wraps @stellar/stellar-sdk and is safe to import server-side
 * only (it uses distribution secrets). When secrets are absent it operates in
 * "simulation" mode so the product is fully demoable.
 */
import { env } from "@/lib/config";

export interface StellarPaymentParams {
  destination: string; // recipient Stellar public key
  amount: string; // decimal string
  assetCode?: string;
  memo?: string;
}

export interface StellarResult {
  hash: string;
  ledger?: number;
  simulated: boolean;
}

const hasDistribution = Boolean(process.env.STELLAR_DISTRIBUTION_SECRET);

/** Create (or reference) a Stellar account/keypair for a user wallet. */
export async function provisionWallet(): Promise<{
  publicKey: string;
  simulated: boolean;
}> {
  if (!hasDistribution) {
    // Simulation: deterministic-looking fake key.
    return { publicKey: "G" + randomBase32(55), simulated: true };
  }
  const { Keypair } = await import("@stellar/stellar-sdk");
  const kp = Keypair.random();
  // NOTE: in production the secret is encrypted with a KMS before storage.
  return { publicKey: kp.publicKey(), simulated: false };
}

/** Send a stablecoin payment over Stellar (or simulate it). */
export async function sendPayment(
  params: StellarPaymentParams
): Promise<StellarResult> {
  if (!hasDistribution) {
    await new Promise((r) => setTimeout(r, 600));
    return { hash: randomHex(64), ledger: undefined, simulated: true };
  }

  const StellarSdk = await import("@stellar/stellar-sdk");
  const { Horizon, Keypair, TransactionBuilder, Operation, Asset, Memo, Networks, BASE_FEE } =
    StellarSdk;

  const server = new Horizon.Server(env.stellarHorizon);
  const source = Keypair.fromSecret(process.env.STELLAR_DISTRIBUTION_SECRET!);
  const account = await server.loadAccount(source.publicKey());

  const assetCode = params.assetCode ?? process.env.STELLAR_SETTLEMENT_ASSET_CODE ?? "USDC";
  const issuer = process.env.STELLAR_SETTLEMENT_ASSET_ISSUER;
  const asset = issuer ? new Asset(assetCode, issuer) : Asset.native();

  const networkPassphrase =
    env.stellarNetwork === "public" ? Networks.PUBLIC : Networks.TESTNET;

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: params.destination,
        asset,
        amount: params.amount,
      })
    )
    .addMemo(Memo.text((params.memo ?? "MOT").slice(0, 28)))
    .setTimeout(60)
    .build();

  tx.sign(source);
  const res = await server.submitTransaction(tx);
  return { hash: res.hash, ledger: res.ledger, simulated: false };
}

function randomHex(len: number) {
  const chars = "0123456789abcdef";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 16)]).join("");
}
function randomBase32(len: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 32)]).join("");
}
