/**
 * Server-side auth + profile helpers. Used by server components and API routes
 * to resolve the currently authenticated user and their profile from Supabase.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import type { Profile } from "@/lib/types";

/** The authenticated auth.users id, or null when signed out / demo mode. */
export async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** The current user's profile row, or null. */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    // Profile row not created yet (e.g. trigger lag) — fall back to auth data.
    return {
      id: user.id,
      full_name:
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "Member",
      email: user.email ?? "",
      role: (user.user_metadata?.role as Profile["role"]) || "diaspora",
      preferred_currency: "ZMW",
      kyc_status: "unverified",
      mfa_enabled: false,
      biometric_enabled: false,
      onboarded: false,
      created_at: user.created_at ?? new Date().toISOString(),
    };
  }
  return data as Profile;
}
