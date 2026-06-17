"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Split, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StellarReceiptCard, type ReceiptLike } from "@/components/stellar/stellar-receipt";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";

interface Leg {
  label: string;
  percentage: number;
  memo: string;
  destination_type: "member" | "vault" | "bill" | "school";
  color: string;
}

const DEFAULT_LEGS: Leg[] = [
  { label: "Grace Mwila (Mum)", percentage: 60, memo: "FAMILY_SUPPORT_MOTHER", destination_type: "member", color: "#D4AF37" },
  { label: "School fees vault", percentage: 20, memo: "SCHOOL_FEES", destination_type: "vault", color: "#00D4FF" },
  { label: "Emergency vault", percentage: 10, memo: "EMERGENCY_RESERVE", destination_type: "vault", color: "#22C55E" },
  { label: "House fund vault", percentage: 10, memo: "HOUSE_FUND_DEPOSIT", destination_type: "vault", color: "#A78BFA" },
];

export function SplitBuilder() {
  const [total, setTotal] = useState(300);
  const [legs] = useState<Leg[]>(DEFAULT_LEGS);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [receipts, setReceipts] = useState<ReceiptLike[]>([]);

  const sum = legs.reduce((s, l) => s + l.percentage, 0);

  async function execute() {
    setState("running");
    setReceipts([]);
    try {
      const res = await fetch("/api/split-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          currency: "USD",
          items: legs.map((l) => ({
            label: l.label,
            percentage: l.percentage,
            memo: l.memo,
            destination_type: l.destination_type,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setReceipts(data.receipts ?? []);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-6">
      <Card glass>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Split className="size-5 text-cyan-accent" />
            <h3 className="text-sm font-semibold">Build your split</h3>
          </div>
          <StellarNetworkBadge />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm text-muted">Total to send</label>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-muted">$</span>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(Math.max(0, Number(e.target.value)))}
              className="w-24 bg-transparent text-lg font-semibold outline-none"
            />
            <span className="text-xs text-muted">USD</span>
          </div>
        </div>

        {/* Animated allocation bar */}
        <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-white/5">
          {legs.map((l) => (
            <motion.div
              key={l.label}
              initial={{ width: 0 }}
              animate={{ width: `${l.percentage}%` }}
              transition={{ duration: 0.6 }}
              style={{ backgroundColor: l.color }}
              title={`${l.label} · ${l.percentage}%`}
            />
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {legs.map((l, i) => (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full" style={{ backgroundColor: l.color }} />
                <div>
                  <p className="text-sm font-medium">{l.label}</p>
                  <span className="font-mono text-[10px] text-gold">{l.memo}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${((l.percentage / 100) * total).toFixed(2)}</p>
                <p className="text-[11px] text-muted">{l.percentage}%</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className={sum === 100 ? "text-success" : "text-warning"}>Allocated {sum}%</span>
          <span className="text-muted">Settled as USDC over Stellar → mobile money payout</span>
        </div>

        <Button onClick={execute} disabled={state === "running"} className="mt-5 w-full">
          {state === "running" ? (
            <><Loader2 className="size-4 animate-spin" /> Splitting on Stellar…</>
          ) : (
            <>Send & split ${total.toFixed(2)} <ArrowRight /></>
          )}
        </Button>
        {state === "error" && (
          <p className="mt-2 text-center text-xs text-danger">Could not execute — try again.</p>
        )}
      </Card>

      {receipts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted">
            {receipts.length} Stellar transaction receipts
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {receipts.map((r) => (
              <StellarReceiptCard key={r.reference} receipt={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
