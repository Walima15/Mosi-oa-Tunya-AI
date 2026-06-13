"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Card glass className="p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Create your account</h2>
      <p className="mt-2 text-sm text-muted">Join the diaspora moving money home intelligently</p>

      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); window.location.href = "/role-selection"; }}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Chanda Mwila" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" />
        </div>
        <Button type="submit" className="w-full" size="lg">Continue</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}
