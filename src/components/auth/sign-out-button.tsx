"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={signOut} disabled={loading}>
      <LogOut className="size-4" /> {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
