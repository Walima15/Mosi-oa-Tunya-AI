import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWallet } from "@/lib/stellar/wallet";
import { fundWithFriendbot } from "@/lib/stellar/friendbot";
import { getAccountSnapshot } from "@/lib/stellar/account";
import { getStellarPublicKey } from "@/lib/stellar/public-key";
import { loadWalletApiPayload } from "@/lib/stellar/wallet-view";
import { explorerAccountUrl } from "@/lib/stellar/explorer";

export const runtime = "nodejs";

const schema = z.object({
  network: z.enum(["testnet", "public"]).default("testnet"),
  fund: z.boolean().default(true),
});

/**
 * Fund an account via Friendbot, or create a new keypair when none is configured.
 * Secret keys are never returned — only the public key and live balances.
 */
export async function POST(req: NextRequest) {
  try {
    const { fund } = schema.parse(await req.json().catch(() => ({})));
    const configured = getStellarPublicKey();

    // Use the existing Testnet account from environment
    if (configured) {
      const friendbot = fund ? await fundWithFriendbot(configured) : null;
      const snapshot = await getAccountSnapshot(configured, { configured: true });
      const payload = await loadWalletApiPayload();

      return NextResponse.json({
        status: "success",
        publicKey: configured,
        network: payload.networkStatus.network,
        explorerUrl: explorerAccountUrl(configured),
        funded: snapshot.funded,
        friendbotMessage: friendbot?.message,
        balances: snapshot.balances,
        trustlines: snapshot.trustlines,
        sequence: snapshot.sequence,
        trustlineEstablished: snapshot.trustlineEstablished,
        simulated: snapshot.simulated,
        configured: true,
        error: snapshot.error,
        errorMessage: snapshot.errorMessage,
        networkStatus: payload.networkStatus,
        wallet: payload.wallet,
      });
    }

    // Demo flow: generate a new keypair (no env public key)
    const wallet = await createWallet("testnet");
    const friendbot = fund ? await fundWithFriendbot(wallet.publicKey) : null;
    const snapshot = await getAccountSnapshot(wallet.publicKey, { configured: false });

    return NextResponse.json({
      status: "success",
      publicKey: wallet.publicKey,
      network: wallet.network,
      explorerUrl: explorerAccountUrl(wallet.publicKey),
      funded: friendbot?.funded ?? snapshot.funded,
      friendbotMessage: friendbot?.message,
      balances: snapshot.balances,
      trustlines: snapshot.trustlines,
      sequence: snapshot.sequence,
      trustlineEstablished: snapshot.trustlineEstablished,
      simulated: snapshot.simulated,
      configured: false,
      networkStatus: (await loadWalletApiPayload()).networkStatus,
    });
  } catch (err) {
    console.error("[/api/stellar/wallet POST]", err);
    return NextResponse.json({ error: "Could not update Stellar wallet." }, { status: 500 });
  }
}

/** Live wallet + network status from Horizon (configured account or demo). */
export async function GET() {
  try {
    const payload = await loadWalletApiPayload();
    return NextResponse.json({
      status: "success",
      ...payload,
      online: payload.networkStatus.online,
      latestLedger: payload.networkStatus.latestLedger,
      mode: payload.networkStatus.mode,
    });
  } catch (err) {
    console.error("[/api/stellar/wallet GET]", err);
    return NextResponse.json(
      { error: "Horizon API unavailable.", online: false },
      { status: 503 }
    );
  }
}
