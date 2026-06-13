"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/config";

/** Browser Supabase client (uses anon key, respects RLS). */
export function createClient() {
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
