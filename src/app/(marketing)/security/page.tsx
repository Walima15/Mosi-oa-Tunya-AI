import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import {
  Fingerprint,
  Lock,
  ScanFace,
  Eye,
  ServerCog,
  FileCheck2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security · Mosi-oa-Tunya AI",
  description: "Bank-grade security, KYC/AML compliance and a full audit trail.",
};

const pillars = [
  { icon: Fingerprint, title: "MFA & biometrics", desc: "TOTP, Face ID and fingerprint required on sensitive actions." },
  { icon: Lock, title: "Encryption everywhere", desc: "AES-256 at rest, TLS 1.3 in transit. Secrets live server-side only." },
  { icon: ScanFace, title: "KYC verification", desc: "Document + selfie verification with admin review workflow." },
  { icon: Eye, title: "AML monitoring", desc: "Continuous transaction screening with automated risk flags." },
  { icon: ServerCog, title: "Row-level security", desc: "Postgres RLS scopes every row to its owner. Admins gain access via policy." },
  { icon: FileCheck2, title: "Full audit trail", desc: "Every money movement and admin action is written to immutable audit logs." },
  { icon: KeyRound, title: "Key management", desc: "Stellar distribution secrets are never exposed to the client and are KMS-encrypted." },
  { icon: ShieldCheck, title: "Confirmation flow", desc: "The AI proposes, you dispose — no transaction executes without explicit confirmation." },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <Reveal>
        <div className="flex items-center gap-2 text-success">
          <ShieldCheck className="size-5" />
          <p className="text-sm font-medium uppercase tracking-widest">Trust by design</p>
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          Built to protect every kwacha.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Security and compliance are not features bolted on at the end — they are the foundation of
          a financial operating system trusted with family livelihoods.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i % 2}>
            <Card className="h-full">
              <p.icon className="size-6 text-success" />
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card glass className="mt-16 p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Compliance posture</h2>
          <p className="mt-4 text-sm text-muted">
            Mosi-oa-Tunya AI is architected for regulated operation: KYC tiers, transaction limits,
            suspicious-activity detection, sanctions screening hooks, an admin review queue and a
            tamper-evident audit log. Risk flags surface to compliance officers in real time, and
            every user carries a verifiable KYC status that gates higher-value flows.
          </p>
        </Card>
      </Reveal>
    </div>
  );
}
