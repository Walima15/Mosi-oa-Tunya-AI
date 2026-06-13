"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card glass className="p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Welcome back</h2>
      <p className="mt-2 text-sm text-muted">Sign in to your Mosi account</p>

      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); window.location.href = "/dashboard"; }}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-2 text-xs font-medium text-gold hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" size="lg">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-gold hover:underline">Create one</Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted/60">
        Demo mode — any credentials will enter the dashboard.
      </p>
    </Card>
  );
}
