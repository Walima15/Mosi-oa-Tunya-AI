import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ShieldCheck,
  Wallet,
  Zap,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How it works · Mosi-oa-Tunya AI",
  description: "From natural-language instruction to mobile-money delivery in seconds.",
};

const journey = [
  { icon: MessageSquare, title: "1 · Tell Mosi", desc: "Type or speak: \"Send K5,000 to Mum every month.\" No forms, no jargon — just intent." },
  { icon: ShieldCheck, title: "2 · Review & confirm", desc: "Mosi builds a transaction preview with fees, FX and ETA. Nothing moves until you confirm." },
  { icon: Wallet, title: "3 · Wallet debited", desc: "Your multi-currency wallet is debited and the transfer enters the settlement engine." },
  { icon: Zap, title: "4 · Stellar settlement", desc: "Value moves as anchored stablecoin over Stellar — near-instant, near-free, fully traceable." },
  { icon: Smartphone, title: "5 · Mobile money payout", desc: "Funds land in Airtel, MTN or Zamtel wallets — or a bank account — in seconds." },
];

const settlement = [
  { k: "pending", t: "Transfer created" },
  { k: "confirmed", t: "Sender wallet debited" },
  { k: "processing", t: "Stablecoin settled on Stellar" },
  { k: "paid_out", t: "Recipient credited via payout rail" },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-widest text-gold">How it works</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          From a sentence to settled, in seconds.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Mosi turns plain language into secure, automated money movement — settled on the blockchain
          and delivered to mobile money.
        </p>
      </Reveal>

      <div className="mt-14 space-y-4">
        {journey.map((s, i) => (
          <Reveal key={s.title} delay={i % 3}>
            <Card className="flex items-start gap-5">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                <s.icon className="size-6 text-cyan-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card glass className="mt-16 p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">The settlement engine</h2>
          <p className="mt-3 text-sm text-muted">
            Every transfer flows through an auditable state machine. You can watch it live in the app.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {settlement.map((s, i) => (
              <div key={s.k} className="flex items-center gap-3">
                <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
                  <p className="text-xs font-semibold text-gold">{s.k}</p>
                  <p className="text-[11px] text-muted">{s.t}</p>
                </div>
                {i < settlement.length - 1 && <ArrowRight className="hidden size-4 text-muted sm:block" />}
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <div className="mt-12 flex justify-center">
        <Link href="/signup">
          <Button size="lg">Start sending smarter <ArrowRight /></Button>
        </Link>
      </div>
    </div>
  );
}
