/** Runtime configuration + feature detection. */

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  stellarNetwork: process.env.STELLAR_NETWORK ?? "testnet",
  stellarHorizon:
    process.env.STELLAR_HORIZON_URL ??
    process.env.HORIZON_URL ??
    "https://horizon-testnet.stellar.org",
  sorobanRpc:
    process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
};

/** Client-safe Stellar network label (for badges/UI). */
export const STELLAR_NETWORK_LABEL =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public"
    ? "Public"
    : "Testnet";

/** Client-safe settlement asset label. */
export const SETTLEMENT_ASSET_LABEL =
  process.env.NEXT_PUBLIC_SETTLEMENT_ASSET ?? "USDC";

/** Client-safe configured Stellar public key (G... only — never secrets). */
export const STELLAR_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STELLAR_PUBLIC_KEY?.trim() || null;

/** True when a user Stellar public key is set in the environment. */
export const hasStellarPublicKey = Boolean(
  STELLAR_PUBLIC_KEY &&
    STELLAR_PUBLIC_KEY !== "PASTE_YOUR_PUBLIC_KEY_HERE" &&
    /^G[A-Z2-7]{55}$/.test(STELLAR_PUBLIC_KEY)
);

/** Client-safe USD/ZMW rate for display estimates. */
export const USD_ZMW_RATE = Number(process.env.NEXT_PUBLIC_USD_ZMW_RATE ?? "27.62");

/** Soroban contract IDs (client-safe for display). */
export const SOROBAN_CONTRACTS = {
  familyWallet: process.env.NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID ?? "",
  goalVault: process.env.NEXT_PUBLIC_GOAL_VAULT_CONTRACT_ID ?? "",
  splitPayment: process.env.NEXT_PUBLIC_SPLIT_PAYMENT_CONTRACT_ID ?? "",
  automation: process.env.NEXT_PUBLIC_AUTOMATION_CONTRACT_ID ?? "",
} as const;

/** True when at least one Soroban contract ID is configured. */
export const isSorobanConfigured = Object.values(SOROBAN_CONTRACTS).some(Boolean);

/** True when Supabase env vars are present (real backend mode). */
export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey
);

/** True when an OpenAI key is present (live AI mode vs. scripted demo). */
export const isAiConfigured = Boolean(env.openaiKey);

/**
 * Demo mode — external integrations (Stellar, mobile money, FX) are simulated.
 * Explicitly opt out with NEXT_PUBLIC_DEMO_MODE=false. When Supabase isn't
 * configured we are always effectively in demo mode.
 */
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || !isSupabaseConfigured;
