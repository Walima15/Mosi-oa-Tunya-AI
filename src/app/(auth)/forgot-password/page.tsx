"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Card glass className="p-8">
      {sent ? (
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-cyan-accent/15 text-cyan-accent">
            <MailCheck className="size-7" />
          </div>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold">Check your inbox</h2>
          <p className="mt-2 text-sm text-muted">
            If an account exists for {email || "that address"}, we&apos;ve sent a secure reset link.
          </p>
          <Link href="/login" className="mt-8 block">
            <Button className="w-full" size="lg" variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Reset your password</h2>
          <p className="mt-2 text-sm text-muted">
            Enter your email and we&apos;ll send you a secure reset link.
          </p>
          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg">Send reset link</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-gold hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </Card>
  );
}
