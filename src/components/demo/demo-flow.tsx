"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { SettlementTimeline } from "@/components/stellar/settlement-timeline";
import { StellarReceiptCard, type ReceiptLike } from "@/components/stellar/stellar-receipt";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { ContractIdChip } from "@/components/stellar/contract-id-chip";
import { ContractEventLog } from "@/components/stellar/contract-event-log";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { generateMonthlyFamilyPlan } from "@/lib/services/family-finance";
import type { ContractEvent } from "@/lib/stellar/soroban";
import { formatMoney } from "@/lib/utils";

const PROMPT = "Take care of my family's finances this month.";
const plan = generateMonthlyFamilyPlan(7500, "ZMW");

type Phase = "intro" | "asked" | "planned" | "executing" | "done";

export function DemoFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [receipts, setReceipts] = useState<ReceiptLike[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);
  const [contractTxHash, setContractTxHash] = useState<string | null>(null);
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);

  function ask() {
    setPhase("asked");
    setTimeout(() => setPhase("planned"), 1100);
  }

  async function confirm() {
    setPhase("executing");
    try {
      const res = await fetch("/api/split-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: plan.total,
          currency: plan.currency,
          items: plan.allocations.map((a) => ({
            label: a.label,
            amount: a.amount,
            memo: a.memo,
            destination_type: a.destinationType,
          })),
        }),
      });
      const data = await res.json();
      setReceipts(data.receipts ?? []);
      setContractId(data.contractId ?? null);
      setContractTxHash(data.contractTxHash ?? null);
      setContractEvents(data.contractEvents ?? []);
    } catch {
      /* demo continues regardless */
    }
    setTimeout(() => setPhase("done"), 1800);
  }

  function reset() {
    setPhase("intro");
    setReceipts([]);
    setContractId(null);
    setContractTxHash(null);
    setContractEvents([]);
  }

  return (
    <div className="space-y-6">
      {/* Why Stellar banner */}
      <Card glass className="overflow-hidden border-cyan-accent/20 p-0">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-cyan-accent/10 via-transparent to-gold/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="cyan" className="mb-2"><Sparkles className="size-3" /> Judge demo</Badge>
            <h2 className="text-xl font-bold">One instruction. USDC settled on Stellar via Soroban.</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              XLM pays network fees · USDC settles value · Soroban Split Payment Contract fans
              one remittance across family, vaults and savings — mobile money is only the last mile.
            </p>
          </div>
          <div className="flex gap-2">
            {phase === "intro" ? (
              <Button onClick={ask}><Play /> Play demo</Button>
            ) : (
              <Button variant="secondary" onClick={reset}><RotateCcw /> Replay</Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Conversation */}
        <div className="space-y-4 lg:col-span-3">
          <Card glass className="min-h-[420px]">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <Logo />
              <StellarNetworkBadge />
            </div>

            <div className="space-y-4">
              {/* User message */}
              <AnimatePresence>
                {phase !== "intro" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-2">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gold/15 px-4 py-2.5 text-sm">
                      {PROMPT}
                    </div>
                    <Avatar name="Amara O" size={32} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mosi typing */}
              {phase === "asked" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin text-gold" /> Mosi is building a plan…
                </motion.div>
              )}

              {/* Plan / action card */}
              <AnimatePresence>
                {(phase === "planned" || phase === "executing" || phase === "done") && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.04] px-4 py-3 text-sm">
                      Here&apos;s your family finance plan for this month. I&apos;ll settle everything over
                      Stellar — family support lands in mobile money, savings flow into your Stellar Goal Vaults.
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-cyan-accent/30 bg-white/[0.03]">
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="size-4 text-gold" /> {plan.title}
                        </span>
                        <Badge variant="warning" className="text-[10px]"><ShieldCheck className="size-3" /> Confirm</Badge>
                      </div>
                      <div className="space-y-2 px-4 py-3">
                        {plan.allocations.map((a, i) => (
                          <motion.div
                            key={a.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{a.label}</p>
                              <span className="font-mono text-[10px] text-gold">{a.memo}</span>
                            </div>
                            <span className="font-semibold">{formatMoney(a.amount, plan.currency)}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="border-t border-border px-4 py-3">
                        {phase === "planned" && (
                          <Button size="sm" className="w-full" onClick={confirm}>
                            Confirm & execute on Stellar
                          </Button>
                        )}
                        {phase === "executing" && (
                          <Button size="sm" className="w-full" disabled>
                            <Loader2 className="size-4 animate-spin" /> Executing Soroban split on Stellar…
                          </Button>
                        )}
                        {phase === "done" && (
                          <div className="flex items-center justify-center gap-2 text-sm font-medium text-success">
                            <CheckCircle2 className="size-4" /> USDC settled · Soroban contract executed
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Soroban contract proof */}
          {phase === "done" && contractId && (
            <Card glass>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <SmartContractBadge status="simulated" />
                <AssetBadge code="USDC" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Split Payment Contract</span>
                  <ContractIdChip contractId={contractId} />
                </div>
                {contractTxHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Contract tx</span>
                    <TxHashChip hash={contractTxHash} type="tx" />
                  </div>
                )}
              </div>
              {contractEvents.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Soroban events</p>
                  <ContractEventLog events={contractEvents.map((e, i) => ({ ...e, id: `ev-${i}` }))} limit={4} />
                </div>
              )}
            </Card>
          )}

          {/* Receipts */}
          {phase === "done" && receipts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {receipts.map((r) => (
                <StellarReceiptCard key={r.reference} receipt={r} />
              ))}
            </div>
          )}
        </div>

        {/* Live settlement + outcomes */}
        <div className="space-y-4 lg:col-span-2">
          <Card glass>
            <h3 className="mb-4 text-sm font-semibold">Stellar settlement</h3>
            <SettlementTimeline active={phase === "done" ? 4 : phase === "executing" ? 3 : 1} />
          </Card>

          <Card glass>
            <h3 className="mb-3 text-sm font-semibold">After execution</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Family Wallet allocated", value: phase === "done" ? "K7,500" : "—" },
                { label: "House vault deposit", value: phase === "done" ? "+K1,000" : "—" },
                { label: "Split legs settled", value: phase === "done" ? "4 / 4" : "—" },
                { label: "Stellar receipts", value: phase === "done" ? String(receipts.length || 4) : "—" },
                { label: "Mobile money payout", value: phase === "done" ? "Queued (last-mile)" : "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/5 py-1.5">
                  <span className="text-muted">{row.label}</span>
                  <span className={phase === "done" ? "font-semibold text-success" : "text-muted"}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card glass className="border-gold/20 bg-gold/[0.04]">
            <p className="text-sm font-medium text-gold">Without Stellar + Soroban, this product loses its core.</p>
            <p className="mt-1 text-xs text-muted">
              XLM for fees, USDC for settlement, Soroban contracts for programmable family finance.
              Remove any layer and the autonomous family finance agent cannot exist.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
