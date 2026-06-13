"use client";

import Link from "next/link";
import {
  Bot,
  Send,
  Repeat,
  Users,
  GraduationCap,
  Receipt,
  PiggyBank,
  TrendingUp,
  Building2,
  ShieldCheck,
  Fingerprint,
  Lock,
  Eye,
  ScanFace,
  Mic,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { BRAND, SUPPORTED_CURRENCIES } from "@/lib/brand";

const modules = [
  { icon: Bot, title: "AI Financial Agent", desc: "Plan, transfer, save and invest by simply chatting in natural language.", tone: "text-gold" },
  { icon: Send, title: "Cross-Border Remittance", desc: "Stablecoin-settled transfers across 6 currencies in seconds.", tone: "text-cyan-accent" },
  { icon: Repeat, title: "Smart Automations", desc: "If salary received, save 10%. If rate hits target, convert funds.", tone: "text-gold" },
  { icon: Users, title: "Family Support Center", desc: "Manage parents, children & dependents with monthly support plans.", tone: "text-cyan-accent" },
  { icon: GraduationCap, title: "School Fees Hub", desc: "Register schools, track fees and schedule term payments.", tone: "text-gold" },
  { icon: Receipt, title: "Bill Payments", desc: "Electricity, water, internet and TV — automated and on time.", tone: "text-cyan-accent" },
  { icon: PiggyBank, title: "Savings Goals", desc: "Build a house or an emergency fund with AI forecasting.", tone: "text-gold" },
  { icon: TrendingUp, title: "Investment Hub", desc: "Bonds, T-bills, agriculture & real estate with risk profiling.", tone: "text-cyan-accent" },
  { icon: Building2, title: "Business Payroll", desc: "Bulk salaries, currency conversion and reports for teams.", tone: "text-gold" },
];

const aiCapabilities = [
  { icon: BrainCircuit, label: "Context-aware memory" },
  { icon: Mic, label: "Voice input" },
  { icon: Lightbulb, label: "Suggested actions" },
  { icon: TrendingUp, label: "Financial insights" },
];

const security = [
  { icon: Fingerprint, title: "MFA & Biometrics", desc: "Face ID, fingerprint and TOTP on every sensitive action." },
  { icon: Lock, title: "End-to-end encryption", desc: "AES-256 at rest, TLS 1.3 in transit, tokenized secrets." },
  { icon: ScanFace, title: "KYC & AML", desc: "Identity verification and continuous transaction monitoring." },
  { icon: Eye, title: "Fraud & device watch", desc: "Anomaly detection, device management and session monitoring." },
];

export function ModulesSection() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <p className="text-center text-sm font-medium tracking-widest text-gold uppercase">
          One operating system
        </p>
        <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your money needs to flow
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted">
          Nine deeply integrated modules — orchestrated by one intelligent agent
          that understands your family, your goals and your money.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <Reveal key={m.title} delay={i % 3}>
            <Card className="group h-full hover:border-gold/30 hover:bg-white/[0.04]">
              <div className="mb-4 inline-flex rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                <m.icon className={`size-6 ${m.tone}`} />
              </div>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted">{m.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function AiSection() {
  return (
    <section id="ai" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-60" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-medium tracking-widest text-gold uppercase">
            Your personal financial manager
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Don&apos;t bank. Just talk.
          </h2>
          <p className="mt-4 text-muted">
            Mosi remembers your income, your transfers, your goals and your
            family. Ask anything — it reasons, recommends and acts.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Mosi, can I afford a K500,000 house in Lusaka in 5 years?",
              "How much did I send home this year?",
              "Convert my dollars when the rate beats 27.5.",
            ].map((q) => (
              <div
                key={q}
                className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
              >
                <Bot className="size-4 shrink-0 text-gold" />
                <span className="text-foreground/85">{q}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {aiCapabilities.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-2 text-xs text-foreground/80 ring-1 ring-white/10"
              >
                <c.icon className="size-3.5 text-cyan-accent" /> {c.label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={1}>
          <Card glass className="glow-cyan p-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-0 animate-[pulse-ring_2s_ease-out_infinite] rounded-full bg-cyan-accent/30" />
                <div className="relative grid size-12 place-items-center rounded-full bg-gradient-to-br from-cyan-accent to-[#0094ff] text-midnight-950">
                  <Mic className="size-5" />
                </div>
              </div>
              <div>
                <p className="font-semibold">Listening…</p>
                <p className="text-xs text-muted">Tap to speak to Mosi</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <p className="rounded-2xl rounded-bl-md bg-white/[0.05] px-4 py-3 text-foreground/90">
                Based on your K18,400 monthly income and K5,200 average transfers,
                saving K3,500/month reaches a K500,000 deposit in 4.7 years.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="primary">Create savings goal</Button>
                <Button size="sm" variant="secondary">See breakdown</Button>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", title: "Tell Mosi your goal", desc: "Type or speak naturally — no forms, no jargon." },
  { n: "02", title: "AI builds the plan", desc: "It schedules transfers, savings and automations for you." },
  { n: "03", title: "Money flows", desc: "Stablecoin-settled, delivered to mobile money or bank in seconds." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps. That&apos;s it.
        </h2>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i}>
            <Card className="relative h-full overflow-hidden">
              <span className="text-gradient-gold font-[family-name:var(--font-display)] text-5xl font-bold opacity-90">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    { v: "<12s", l: "Average settlement" },
    { v: "6", l: "Currencies supported" },
    { v: "0.5%", l: "From, on transfers" },
    { v: "24/7", l: "AI agent uptime" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <Card glass className="overflow-hidden">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-gradient-gold font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
                {s.v}
              </p>
              <p className="mt-1 text-xs text-muted">{s.l}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export function SecuritySection() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="flex items-center justify-center gap-2 text-success">
          <ShieldCheck className="size-5" />
          <p className="text-sm font-medium tracking-widest uppercase">
            Trust by design
          </p>
        </div>
        <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Built to protect every kwacha
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {security.map((s, i) => (
          <Reveal key={s.title} delay={i}>
            <Card className="h-full">
              <s.icon className="size-6 text-success" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Card glass className="relative overflow-hidden p-12 text-center glow-gold">
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
              The smoke that thunders, now in your pocket.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted">
              Join the diaspora moving money home the intelligent way.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Get started free <ArrowRight />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
              {SUPPORTED_CURRENCIES.map((c) => (
                <span key={c.code} className="inline-flex items-center gap-1">
                  <span>{c.flag}</span> {c.code}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-xs text-muted">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <Link href="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/security" className="hover:text-foreground">Security</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-muted/70 md:text-left">
        © {new Date().getFullYear()} {BRAND.name} — {BRAND.meaning}. For
        demonstration purposes. Not a licensed financial institution.
      </p>
    </footer>
  );
}
