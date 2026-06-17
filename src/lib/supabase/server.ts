import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

/** Server-side Supabase client wired to Next.js cookies (App Router). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

/** Privileged client for trusted server jobs (settlement, webhooks, cron). */
export function createServiceClient() {
  const key = env.supabaseServiceKey;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not set"
    );
  }
  return createServerClient(env.supabaseUrl!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
