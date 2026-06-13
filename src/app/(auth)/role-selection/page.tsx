"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, HandCoins, Building2, ArrowRight } from "lucide-react";

const roles = [
  {
    id: "diaspora",
    icon: User,
    title: "Diaspora sender",
    desc: "Send money home, support family, save and invest with Mosi.",
    next: "/onboarding",
  },
  {
    id: "recipient",
    icon: HandCoins,
    title: "Recipient",
    desc: "Receive funds, verify your identity and track payments.",
    next: "/onboarding",
  },
  {
    id: "business",
    icon: Building2,
    title: "Business",
    desc: "Run payroll, bulk payments and reports for your team.",
    next: "/business",
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("diaspora");
  const active = roles.find((r) => r.id === selected)!;

  return (
    <Card glass className="p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">How will you use Mosi?</h2>
      <p className="mt-2 text-sm text-muted">Pick the option that fits you best. You can change this later.</p>

      <div className="mt-6 space-y-3">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelected(r.id)}
            className={cn(
              "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
              selected === r.id
                ? "border-gold/50 bg-gold/10"
                : "border-border hover:border-white/20"
            )}
          >
            <div
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-white/10",
                selected === r.id ? "bg-gold/15 text-gold" : "bg-white/[0.04] text-muted"
              )}
            >
              <r.icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-muted">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <Button className="mt-8 w-full" size="lg" onClick={() => router.push(active.next)}>
        Continue <ArrowRight />
      </Button>
    </Card>
  );
}
