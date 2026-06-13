/** Runtime configuration + feature detection. */

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  stellarNetwork: process.env.STELLAR_NETWORK ?? "testnet",
  stellarHorizon:
    process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
};

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
