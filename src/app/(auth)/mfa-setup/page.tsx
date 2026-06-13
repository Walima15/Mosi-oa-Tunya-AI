"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Smartphone, Copy, Check } from "lucide-react";

const SECRET = "MOSI XYZ7 4FQA 9KD2";

export default function MfaSetupPage() {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const update = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    setCode((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 5) {
      const el = document.getElementById(`mfa-${i + 1}`);
      el?.focus();
    }
  };

  const complete = code.every((c) => c !== "");

  return (
    <Card glass className="p-8">
      {done ? (
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold">Two-factor enabled</h2>
          <p className="mt-2 text-sm text-muted">Your account is now protected with an extra layer of security.</p>
          <Button className="mt-8 w-full" size="lg" onClick={() => (window.location.href = "/dashboard")}>
            Continue to dashboard
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Smartphone className="size-5 text-gold" />
            <Badge variant="gold">Recommended</Badge>
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold">Set up two-factor auth</h2>
          <p className="mt-2 text-sm text-muted">
            Scan the QR in your authenticator app (Google Authenticator, Authy), or enter the key manually.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
              {/* Decorative QR placeholder */}
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-[2px] ${(i * 7) % 3 === 0 ? "bg-foreground" : "bg-foreground/20"}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(SECRET.replace(/\s/g, "")); setCopied(true); }}
              className="flex flex-1 items-center justify-between rounded-2xl border border-border bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-gold/30"
            >
              <span className="font-mono text-sm tracking-wider">{SECRET}</span>
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-muted" />}
            </button>
          </div>

          <p className="mt-6 mb-2 text-xs font-medium text-muted">Enter the 6-digit code</p>
          <div className="flex gap-2">
            {code.map((c, i) => (
              <input
                key={i}
                id={`mfa-${i}`}
                inputMode="numeric"
                maxLength={1}
                value={c}
                onChange={(e) => update(i, e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white/[0.03] text-center text-lg font-semibold focus-visible:outline-none focus-visible:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/20"
              />
            ))}
          </div>

          <Button className="mt-8 w-full" size="lg" disabled={!complete} onClick={() => setDone(true)}>
            Verify & enable
          </Button>
          <button
            className="mt-3 w-full text-center text-xs text-muted hover:text-foreground"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Skip for now
          </button>
        </>
      )}
    </Card>
  );
}
