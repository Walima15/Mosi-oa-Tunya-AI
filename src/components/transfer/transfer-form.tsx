"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, CheckCircle2, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/brand";
import type { Beneficiary, CurrencyCode } from "@/lib/types";

interface RateRow {
  base: CurrencyCode;
  quote: CurrencyCode;
  rate: number;
}

interface SettlementResult {
  reference: string;
  status: string;
  receiveAmount: number;
  fee: number;
  exchangeRate: number;
  simulated: boolean;
}

function lookupRate(rates: RateRow[], from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  const direct = rates.find((r) => r.base === from && r.quote === to);
  if (direct) return Number(direct.rate);
  const inverse = rates.find((r) => r.base === to && r.quote === from);
  if (inverse && Number(inverse.rate) > 0) return 1 / Number(inverse.rate);
  return 1;
}

export function TransferForm({
  beneficiaries,
  rates,
}: {
  beneficiaries: Beneficiary[];
  rates: RateRow[];
}) {
  const router = useRouter();
  const favorites = beneficiaries.filter((b) => b.is_favorite);
  const list = favorites.length > 0 ? favorites : beneficiaries;

  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>("ZMW");
  const [beneficiary, setBeneficiary] = useState(list[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SettlementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rate = lookupRate(rates, from, to);
  const fee = +(Number(amount) * 0.005).toFixed(2);
  const receive = +((Number(amount) - fee) * rate).toFixed(2);
  const selected = beneficiaries.find((b) => b.id === beneficiary);

  async function handleSend() {
    if (!selected) {
      setError("Add a beneficiary first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiary: selected.full_name,
          beneficiary_id: selected.id,
          account: selected.rail_account ?? undefined,
          amount: Number(amount),
          send_currency: from,
          receive_currency: to,
          payment_rail: selected.payment_rail ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Transfer failed.");
        return;
      }
      setResult(data as SettlementResult);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (beneficiaries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Users className="mx-auto size-10 text-muted" />
        <p className="mt-4 font-semibold">No beneficiaries yet</p>
        <p className="mt-1 text-sm text-muted">Add a recipient before sending money.</p>
        <Link href="/family">
          <Button className="mt-6">Go to Family</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>Transfer details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Beneficiary</Label>
            <div className="mt-2 space-y-2">
              {list.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBeneficiary(b.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${beneficiary === b.id ? "border-gold/50 bg-gold/10" : "border-border hover:border-white/20"}`}
                >
                  <Avatar name={b.full_name} size={36} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.full_name}</p>
                    <p className="text-xs text-muted">{b.relation} · {b.payment_rail ?? "no rail"}</p>
                  </div>
                  {Number(b.monthly_support) > 0 && (
                    <Badge variant="muted">{formatMoney(Number(b.monthly_support), b.currency)}/mo</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>You send</Label>
              <div className="mt-2 flex gap-2">
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <select value={from} onChange={(e) => setFrom(e.target.value as CurrencyCode)} className="rounded-2xl border border-border bg-white/[0.03] px-3 text-sm">
                  {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>They receive</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={receive.toLocaleString()} />
                <select value={to} onChange={(e) => setTo(e.target.value as CurrencyCode)} className="rounded-2xl border border-border bg-white/[0.03] px-3 text-sm">
                  {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
          )}

          {result && (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-success">
                <CheckCircle2 className="size-4" /> {result.reference} · {result.status}
              </p>
              <p className="mt-1 text-muted">
                {formatMoney(result.receiveAmount, to)} delivered to {selected?.full_name}
                {result.simulated ? " (simulated settlement)" : ""}.
              </p>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleSend} disabled={submitting}>
            {submitting ? "Sending…" : <>Send {formatMoney(Number(amount), from)} <ArrowRight /></>}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="size-4 text-cyan-accent" /> Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Rate</span><span>1 {from} = {rate.toFixed(2)} {to}</span></div>
          <div className="flex justify-between"><span className="text-muted">Fee (0.5%)</span><span>{formatMoney(fee, from)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Recipient gets</span><span className="font-semibold text-gold">{formatMoney(receive, to)}</span></div>
          {selected && (
            <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{selected.full_name} via {selected.payment_rail ?? "rail"}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted">ETA</span><Badge variant="success">~12 seconds</Badge></div>
          <div className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs text-muted">
            Settled via Stellar stablecoin for instant cross-border delivery.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
