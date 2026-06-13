"use client";

import { useState } from "react";
import { ArrowRight, Calculator } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { demoBeneficiaries } from "@/lib/demo-data";
import { formatMoney } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/brand";

export default function TransferPage() {
  const [amount, setAmount] = useState("5000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("ZMW");
  const [beneficiary, setBeneficiary] = useState(demoBeneficiaries[0].id);
  const rate = 27.62;
  const fee = +(Number(amount) * 0.005).toFixed(2);
  const receive = +((Number(amount) - fee) * rate).toFixed(2);
  const selected = demoBeneficiaries.find((b) => b.id === beneficiary)!;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Send Money" description="Cross-border remittance with stablecoin settlement" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Transfer details</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Beneficiary</Label>
              <div className="mt-2 space-y-2">
                {demoBeneficiaries.filter((b) => b.is_favorite).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBeneficiary(b.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${beneficiary === b.id ? "border-gold/50 bg-gold/10" : "border-border hover:border-white/20"}`}
                  >
                    <Avatar name={b.full_name} size={36} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{b.full_name}</p>
                      <p className="text-xs text-muted">{b.relation} · {b.payment_rail}</p>
                    </div>
                    {b.monthly_support > 0 && (
                      <Badge variant="muted">{formatMoney(b.monthly_support, b.currency)}/mo</Badge>
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
                  <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-2xl border border-border bg-white/[0.03] px-3 text-sm">
                    {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>They receive</Label>
                <div className="mt-2 flex gap-2">
                  <Input readOnly value={receive.toLocaleString()} />
                  <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-2xl border border-border bg-white/[0.03] px-3 text-sm">
                    {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Send {formatMoney(Number(amount), from)} <ArrowRight />
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="size-4 text-cyan-accent" /> Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Rate</span><span>1 {from} = {rate} {to}</span></div>
            <div className="flex justify-between"><span className="text-muted">Fee (0.5%)</span><span>{formatMoney(fee, from)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Recipient gets</span><span className="font-semibold text-gold">{formatMoney(receive, to)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{selected.full_name} via {selected.payment_rail}</span></div>
            <div className="flex justify-between"><span className="text-muted">ETA</span><Badge variant="success">~12 seconds</Badge></div>
            <div className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs text-muted">
              Settled via Stellar stablecoin for instant cross-border delivery.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
