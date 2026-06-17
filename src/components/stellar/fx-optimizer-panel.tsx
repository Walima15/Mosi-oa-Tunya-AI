"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Loader2, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { StellarReceiptCard, type ReceiptLike } from "@/components/stellar/stellar-receipt";
import type { FxAlert } from "@/lib/types";

interface Rec {
  recommendation: "convert_now" | "wait" | "set_alert";
  reason: string;
  currentRate: number;
  quote: { destAmount: string; improvementPct: number; path: { asset: string }[] };
}

export function FxOptimizerPanel({ alerts }: { alerts: FxAlert[] }) {
  const [amount, setAmount] = useState(1000);
  const [target, setTarget] = useState(30);
  const [autoConvert, setAutoConvert] = useState(true);
  const [rec, setRec] = useState<Rec | null>(null);
  const [busy, setBusy] = useState<null | "preview" | "convert">(null);
  const [receipt, setReceipt] = useState<ReceiptLike | null>(null);

  async function preview() {
    setBusy("preview");
    try {
      const res = await fetch("/api/fx-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_asset: "USD", send_amount: amount, dest_asset: "ZMW", target_rate: target, auto_convert: autoConvert }),
      });
      const data = await res.json();
      setRec(data.recommendation);
    } finally {
      setBusy(null);
    }
  }

  async function convert() {
    setBusy("convert");
    try {
      const res = await fetch("/api/fx-optimizer/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_asset: "USD", send_amount: amount, dest_asset: "ZMW" }),
      });
      const data = await res.json();
      setReceipt(data.receipt);
    } finally {
      setBusy(null);
    }
  }

  const path = rec?.quote.path ?? [{ asset: "USD" }, { asset: "USDC" }, { asset: "ZMW" }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card glass className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-cyan-accent" />
            <h3 className="text-sm font-semibold">Convert via Stellar path payment</h3>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted">Amount (USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-lg font-semibold outline-none focus:border-cyan-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Target USD/ZMW</label>
              <input
                type="number"
                step="0.1"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-lg font-semibold outline-none focus:border-cyan-accent/40"
              />
            </div>
          </div>

          {/* Path visual */}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            {path.map((hop, i) => (
              <div key={hop.asset + i} className="flex items-center gap-2">
                <AssetBadge code={hop.asset} />
                {i < path.length - 1 && <ArrowRight className="size-3 text-muted" />}
              </div>
            ))}
            <span className="ml-auto text-xs text-muted">Stellar order book</span>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoConvert} onChange={(e) => setAutoConvert(e.target.checked)} className="accent-cyan-accent" />
            Auto-convert when target is reached (with my permission)
          </label>

          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={preview} disabled={busy !== null}>
              {busy === "preview" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Get AI recommendation
            </Button>
            <Button onClick={convert} disabled={busy !== null}>
              {busy === "convert" ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
              Convert now
            </Button>
          </div>
        </Card>

        <Card glass className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-gold" />
            <h3 className="text-sm font-semibold">Mosi&apos;s recommendation</h3>
          </div>
          {rec ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
              <Badge variant={rec.recommendation === "convert_now" ? "success" : "cyan"}>
                {rec.recommendation.replace("_", " ")}
              </Badge>
              <p className="text-sm text-foreground/90">{rec.reason}</p>
              <div className="rounded-lg bg-white/[0.03] p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted">Best route delivers</span><span className="font-semibold">{rec.quote.destAmount} ZMW</span></div>
                <div className="flex justify-between"><span className="text-muted">Improvement</span><span className="text-success">+{rec.quote.improvementPct}%</span></div>
                <div className="flex justify-between"><span className="text-muted">Current rate</span><span>{rec.currentRate}</span></div>
              </div>
            </motion.div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Set an amount and target, then ask Mosi. It simulates the best Stellar path and tells
              you whether to convert now or wait.
            </p>
          )}
        </Card>
      </div>

      {receipt && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">Path payment receipt</h3>
          <StellarReceiptCard receipt={receipt} />
        </div>
      )}

      {/* Existing alerts */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">Active FX rules</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {alerts.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{a.base}/{a.quote} {a.direction} {a.target_rate}</p>
                <p className="text-xs text-muted">
                  {a.auto_convert ? `Auto-convert ${a.auto_convert_amount ?? ""} ${a.base}` : "Notify only"}
                </p>
              </div>
              <Badge variant={a.triggered ? "success" : "cyan"}>{a.triggered ? "Triggered" : "Watching"}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
