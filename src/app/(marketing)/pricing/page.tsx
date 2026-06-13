import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing · Mosi-oa-Tunya AI",
  description: "Transparent pricing. No hidden FX margins. Just 0.5% on transfers.",
};

const tiers = [
  {
    name: "Personal",
    price: "Free",
    sub: "0.5% per transfer",
    highlight: false,
    features: [
      "AI financial agent (Mosi)",
      "Cross-border transfers, 6 currencies",
      "Unlimited beneficiaries",
      "Savings goals & automations",
      "Mobile money payouts",
      "Bank-grade security & MFA",
    ],
    cta: "Get started",
  },
  {
    name: "Family+",
    price: "$4.99",
    sub: "per month · 0.35% per transfer",
    highlight: true,
    features: [
      "Everything in Personal",
      "Priority settlement",
      "Advanced AI forecasting & insights",
      "School-fees & bills automation",
      "Emergency support requests",
      "Investment hub access",
    ],
    cta: "Start free trial",
  },
  {
    name: "Business",
    price: "Custom",
    sub: "volume pricing",
    highlight: false,
    features: [
      "Bulk payroll & disbursements",
      "Multi-currency treasury",
      "Team roles & approvals",
      "Reports & reconciliation",
      "API access",
      "Dedicated compliance support",
    ],
    cta: "Talk to sales",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <Reveal>
        <p className="text-center text-sm font-medium uppercase tracking-widest text-gold">Pricing</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-center font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          Honest pricing. No hidden FX margins.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-muted">
          Most providers hide their real cost inside the exchange rate. We don&apos;t. You always
          see the mid-market rate and a flat, transparent fee.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i}>
            <Card
              glass={t.highlight}
              className={t.highlight ? "relative h-full glow-gold border-gold/30" : "relative h-full"}
            >
              {t.highlight && (
                <Badge variant="gold" className="absolute right-6 top-6">
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold">{t.price}</p>
              <p className="mt-1 text-xs text-muted">{t.sub}</p>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button className="w-full" variant={t.highlight ? "primary" : "secondary"}>
                  {t.cta} <ArrowRight />
                </Button>
              </Link>
            </Card>
          </Reveal>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted/70">
        Pricing shown for demonstration. Final fees vary by corridor and payout rail.
      </p>
    </div>
  );
}
