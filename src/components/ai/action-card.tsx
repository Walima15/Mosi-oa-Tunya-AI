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
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { ContractIdChip } from "@/components/stellar/contract-id-chip";
import { ContractEventLog } from "@/components/stellar/contract-event-log";
import { StellarReceiptCard, type ReceiptLike } from "@/components/stellar/stellar-receipt";
import type { ContractEvent } from "@/lib/stellar/soroban";

const STATUS_FLOW: { key: SettlementStatus; label: string }[] = [
  { key: "pending", label: "Created" },
  { key: "confirmed", label: "Debited" },
  { key: "processing", label: "Stellar" },
  { key: "paid_out", label: "Delivered" },
];

interface ExecResult {
  status?: string;
  steps?: unknown;
  receipts?: ReceiptLike[];
  receipt?: ReceiptLike | null;
  contractEvents?: ContractEvent[];
  contractId?: string;
  contractTxHash?: string;
  settlementAsset?: string;
  publicKey?: string;
  explorerUrl?: string;
  stellarPublicKey?: string;
}

/**
 * Renders a financial action proposed by Mosi as a confirmable preview.
 * Money never moves until the user confirms — the AI only proposes.
 */
export function ActionCard({ card }: { card: ActionCardData }) {
  const [state, setState] = useState<"idle" | "executing" | "done" | "error">("idle");
  const [settlement, setSettlement] = useState<SettlementResult | null>(null);
  const [result, setResult] = useState<ExecResult | null>(null);

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
      setResult(data as ExecResult);
      if (data?.steps) setSettlement(data as SettlementResult);
      setState(data?.status === "failed" ? "error" : "done");
    } catch {
      setState("error");
    }
  }

  const accent =
    card.intent === "split" || card.intent === "plan" || card.intent === "family"
      ? "border-cyan-accent/30"
      : card.intent === "transfer" || card.intent === "savings" || card.intent === "vault"
      ? "border-gold/30"
      : "border-cyan-accent/30";

  const receipts = result?.receipts ?? (result?.receipt ? [result.receipt] : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-2 max-w-[90%] overflow-hidden rounded-2xl border bg-white/[0.03] backdrop-blur",
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

      {/* Stellar chips */}
      {card.stellar && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
          <StellarNetworkBadge />
          {card.asset && <AssetBadge code={card.asset} />}
          {card.memo && (
            <span className="rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] text-gold">
              {card.memo}
            </span>
          )}
        </div>
      )}

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

      {/* Split / plan breakdown */}
      {card.items && card.items.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
            {card.items.length} Stellar destinations
          </p>
          <div className="space-y-2">
            {card.items.map((it, i) => (
              <motion.div
                key={it.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.label}</p>
                  <span className="font-mono text-[10px] text-gold">{it.memo}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {it.percentage ? `${it.percentage}%` : ""}{" "}
                    <span className="text-muted">
                      {it.amount.toLocaleString()}
                    </span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement tracker (transfers) */}
      {settlement && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const reached =
                settlement.steps.some((st) => st.status === s.key) || settlement.status === "paid_out";
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
            Ref {settlement.reference} · Stellar tx{" "}
            <span className="text-cyan-accent">{settlement.stellarTxHash.slice(0, 12)}…</span>
            {settlement.simulated && " · demo"}
          </p>
        </div>
      )}

      {/* New-wallet / vault success summary */}
      {state === "done" && (result?.publicKey || result?.stellarPublicKey) && (
        <div className="border-t border-border px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Stellar account</span>
            <TxHashChip hash={(result.publicKey ?? result.stellarPublicKey)!} type="account" />
          </div>
        </div>
      )}

      {/* Soroban contract execution proof */}
      {state === "done" && result?.contractId && (
        <div className="space-y-2 border-t border-border px-4 py-3 text-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SmartContractBadge status="simulated" />
            {result.settlementAsset && <AssetBadge code={result.settlementAsset} />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Soroban contract</span>
            <ContractIdChip contractId={result.contractId} />
          </div>
          {result.contractTxHash && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Contract tx</span>
              <TxHashChip hash={result.contractTxHash} type="tx" />
            </div>
          )}
        </div>
      )}

      {/* Contract event log */}
      {result?.contractEvents && result.contractEvents.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Soroban events</p>
          <ContractEventLog
            events={result.contractEvents.map((e, i) => ({
              id: `ev-${i}`,
              contractKind: e.contractKind,
              contractId: e.contractId,
              eventName: e.eventName,
              data: e.data,
              txHash: e.txHash,
              timestamp: e.timestamp,
              simulated: e.simulated,
            }))}
            limit={4}
          />
        </div>
      )}

      {/* Stellar receipts */}
      {receipts.length > 0 && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {receipts.slice(0, 4).map((r) => (
            <StellarReceiptCard key={r.reference} receipt={r} />
          ))}
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
            <Loader2 className="size-4 animate-spin" /> Settling on Stellar…
          </Button>
        )}
        {state === "done" && (
          <div className="flex w-full items-center justify-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" /> Confirmed & settled on Stellar
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
