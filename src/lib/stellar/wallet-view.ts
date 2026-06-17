/**
 * Wallet view model — maps Horizon account data to UI-ready shape.
 *
 * SERVER-ONLY.
 */
import { getAccountSnapshot, type AccountSnapshot } from "@/lib/stellar/account";
import { getStellarPublicKey } from "@/lib/stellar/public-key";
import { getNetworkStatus, STELLAR } from "@/lib/stellar/client";
import { explorerAccountUrl } from "@/lib/stellar/explorer";
import { demoStellarWallet } from "@/lib/stellar-demo";
import type { StellarWalletView } from "@/lib/stellar/types";
import type { StellarNetwork } from "@/lib/types";

function balanceOf(balances: AccountSnapshot["balances"], code: string): number {
  const row = balances.find((b) => b.code === code);
  return row ? Number(row.balance) : 0;
}

function snapshotToView(snapshot: AccountSnapshot, configured: boolean): StellarWalletView {
  return {
    id: configured ? "configured" : "demo",
    user_id: "demo-user",
    public_key: snapshot.publicKey,
    network: STELLAR.network as StellarNetwork,
    trustline_established: snapshot.trustlineEstablished,
    xlm_balance: balanceOf(snapshot.balances, "XLM"),
    usdc_balance: balanceOf(snapshot.balances, "USDC"),
    funded: snapshot.funded,
    exists: snapshot.exists,
    simulated: snapshot.simulated,
    configured,
    sequence: snapshot.sequence,
    trustlines: snapshot.trustlines,
    explorerUrl: explorerAccountUrl(snapshot.publicKey),
    error: snapshot.error,
    errorMessage: snapshot.errorMessage,
  };
}

/** Load wallet for the configured account, or fall back to demo simulation. */
export async function loadWalletView(): Promise<StellarWalletView> {
  const publicKey = getStellarPublicKey();

  if (publicKey) {
    const snapshot = await getAccountSnapshot(publicKey, { configured: true });
    return snapshotToView(snapshot, true);
  }

  const snapshot = await getAccountSnapshot(demoStellarWallet.public_key, {
    configured: false,
  });
  return snapshotToView(snapshot, false);
}

/** Full wallet API payload (account + network status). */
export async function loadWalletApiPayload() {
  const [wallet, networkStatus] = await Promise.all([
    loadWalletView(),
    getNetworkStatus(),
  ]);

  return {
    wallet,
    networkStatus,
    configured: wallet.configured,
  };
}
