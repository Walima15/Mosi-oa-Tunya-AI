"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, env } from "@/lib/config";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Demo mode (no Supabase configured): proceed straight to role selection.
    if (!isSupabaseConfigured) {
      router.push("/role-selection");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: "diaspora" },
        emailRedirectTo: `${env.appUrl}/login`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // When email confirmation is enabled, no session is returned yet.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/role-selection");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <Card glass className="p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Confirm your email</h2>
        <p className="mt-3 text-sm text-muted">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your account, then sign in.
        </p>
        <Button className="mt-8 w-full" size="lg" onClick={() => router.push("/login")}>
          Go to sign in
        </Button>
      </Card>
    );
  }

  return (
    <Card glass className="p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Create your account</h2>
      <p className="mt-2 text-sm text-muted">Join the diaspora moving money home intelligently</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Chanda Mwila" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account…" : "Continue"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}
