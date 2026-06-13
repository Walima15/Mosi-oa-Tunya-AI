import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Droplets, Globe2, HeartHandshake, Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "About · Mosi-oa-Tunya AI",
  description: "The story and mission behind Africa's AI-powered financial agent.",
};

const values = [
  { icon: Droplets, title: "Flow", desc: "Money should move as freely as water over the Falls — instant, borderless, effortless." },
  { icon: HeartHandshake, title: "Family first", desc: "Every transfer carries a story. We build for the parent waiting, the student enrolling, the home being built." },
  { icon: Globe2, title: "Pan-African", desc: "Designed for the diaspora and the continent — six currencies, five rails, one intelligent agent." },
  { icon: Rocket, title: "AI-native", desc: "Not a bank with a chatbot bolted on. A financial operating system that thinks." },
];

const stats = [
  { v: "$95B+", l: "Annual remittances to Africa" },
  { v: "30M+", l: "Africans in the diaspora" },
  { v: "8.9%", l: "Avg. cost of sending today" },
  { v: "0.5%", l: "Our transparent fee" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-widest text-gold">Our mission</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          Making money move across Africa as freely as water over Victoria Falls.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-muted">
          Mosi-oa-Tunya — &ldquo;The Smoke That Thunders&rdquo; — is the indigenous name for
          Victoria Falls. We borrowed it because that is exactly how cross-border finance should
          feel for Africans: powerful, natural and unstoppable. Today, sending money home is slow,
          expensive and confusing. We are rebuilding it as a single conversation with an AI that
          understands your family, your goals and your obligations.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i}>
            <Card className="text-center">
              <p className="text-gradient-gold font-[family-name:var(--font-display)] text-3xl font-bold">{s.v}</p>
              <p className="mt-1 text-xs text-muted">{s.l}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i % 2}>
            <Card className="h-full">
              <v.icon className="size-6 text-cyan-accent" />
              <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted">{v.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card glass className="mt-16 p-8 glow-gold">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Why now</h2>
          <p className="mt-4 text-muted">
            Stablecoin rails on Stellar settle value in seconds for fractions of a cent. Mobile money
            reaches over 600 million accounts across Africa. And large language models can finally
            understand intent, context and memory. For the first time, a true AI financial operating
            system for the continent is possible. Mosi-oa-Tunya AI is building it.
          </p>
        </Card>
      </Reveal>
    </div>
  );
}
