/**
 * Friendbot — fund a Stellar testnet account with test XLM.
 *
 * Used for the demo so judges can see a real, funded testnet account when the
 * network is reachable. Falls back gracefully to a simulated result so the
 * demo never blocks on network availability.
 *
 * SERVER-ONLY.
 */
import { STELLAR } from "@/lib/stellar/client";

export interface FriendbotResult {
  funded: boolean;
  hash?: string;
  simulated: boolean;
  message: string;
}

const FRIENDBOT_URL = "https://friendbot.stellar.org";

/** Request testnet funds for a public key (no-op on public network). */
export async function fundWithFriendbot(publicKey: string): Promise<FriendbotResult> {
  if (STELLAR.network === "public") {
    return { funded: false, simulated: false, message: "Friendbot is testnet-only." };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      // Already funded or rate-limited — treat as simulated success for demo.
      return {
        funded: true,
        simulated: true,
        message: "Account already funded or Friendbot busy — using simulated balance.",
      };
    }
    const data = await res.json();
    return {
      funded: true,
      hash: data?.hash,
      simulated: false,
      message: "Funded with 10,000 test XLM via Friendbot.",
    };
  } catch {
    return {
      funded: true,
      simulated: true,
      message: "Friendbot unreachable — using simulated testnet balance.",
    };
  }
}
