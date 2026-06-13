"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActionCard as ActionCardData } from "@/lib/ai/tools";
import type { SettlementResult, SettlementStatus } from "@/lib/services/settlement";

const STATUS_FLOW: { key: SettlementStatus; label: string }[] = [
  { key: "pending", label: "Created" },
  { key: "confirmed", label: "Debited" },
  { key: "processing", label: "Stellar" },
  { key: "paid_out", label: "Delivered" },
];

/**
 * Renders a financial action proposed by Mosi as a confirmable preview.
 * Financial actions require explicit confirmation before the execution
 * endpoint is called — the AI never moves money on its own.
 */
export function ActionCard({ card }: { card: ActionCardData }) {
  const [state, setState] = useState<"idle" | "executing" | "done" | "error">("idle");
  const [result, setResult] = useState<SettlementResult | null>(null);

  async function confirm() {
    if (!card.executeEndpoint) {
      setState("done");
      return;
    }
    setState("executing");
    try {
      const res = await fetch(card.executeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card.payload ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "failed");
      if (data?.steps) setResult(data as SettlementResult);
      setState(data?.status === "failed" ? "error" : "done");
    } catch {
      setState("error");
    }
  }

  const accent =
    card.intent === "transfer" || card.intent === "savings"
      ? "border-gold/30"
      : "border-cyan-accent/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-2 max-w-[85%] overflow-hidden rounded-2xl border bg-white/[0.03] backdrop-blur",
        accent
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-gold" />
          <span className="text-sm font-semibold">{card.title}</span>
        </div>
        {card.requiresConfirmation ? (
          <Badge variant="warning" className="text-[10px]">
            <ShieldCheck className="size-3" /> Confirm
          </Badge>
        ) : (
          <Badge variant="cyan" className="text-[10px]">
            Estimate
          </Badge>
        )}
      </div>

      <div className="px-4 py-3">
        <p className="mb-3 text-xs text-muted">{card.summary}</p>
        <dl className="space-y-2">
          {card.fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted">{f.label}</dt>
              <dd className={cn("text-right", f.emphasis ? "font-semibold text-foreground" : "text-foreground/80")}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Settlement tracker */}
      {result && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const reached =
                result.steps.some((st) => st.status === s.key) || result.status === "paid_out";
              const isLast = i === STATUS_FLOW.length - 1;
              return (
                <div key={s.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-[10px]",
                        reached ? "bg-success/20 text-success" : "bg-white/5 text-muted"
                      )}
                    >
                      {reached ? <CheckCircle2 className="size-3.5" /> : i + 1}
                    </div>
                    <span className="text-[9px] text-muted">{s.label}</span>
                  </div>
                  {!isLast && (
                    <div className={cn("mx-1 h-px flex-1", reached ? "bg-success/40" : "bg-white/10")} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Ref {result.reference} · Stellar tx{" "}
            <span className="text-cyan-accent">{result.stellarTxHash.slice(0, 12)}…</span>
            {result.simulated && " · demo"}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        {state === "idle" && (
          <Button size="sm" onClick={confirm} className="flex-1">
            {card.confirmLabel} <ArrowRight />
          </Button>
        )}
        {state === "executing" && (
          <Button size="sm" disabled className="flex-1">
            <Loader2 className="size-4 animate-spin" /> Settling…
          </Button>
        )}
        {state === "done" && (
          <div className="flex w-full items-center justify-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" /> Confirmed & {result ? "delivered" : "saved"}
          </div>
        )}
        {state === "error" && (
          <div className="flex w-full items-center justify-center gap-2 text-sm font-medium text-danger">
            <XCircle className="size-4" /> Something went wrong — try again
          </div>
        )}
      </div>
    </motion.div>
  );
}
