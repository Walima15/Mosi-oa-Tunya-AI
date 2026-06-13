"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Mail, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";

const channels = [
  { icon: Mail, title: "Email", value: "hello@mosioatunya.ai" },
  { icon: MessageSquare, title: "Support", value: "Talk to Mosi 24/7 in-app" },
  { icon: MapPin, title: "Based in", value: "Lusaka · London · Nairobi" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-widest text-gold">Contact</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
          Let&apos;s talk.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Investor, partner, or future user — we&apos;d love to hear from you.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {channels.map((c, i) => (
            <Reveal key={c.title} delay={i}>
              <Card className="flex items-center gap-4">
                <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                  <c.icon className="size-5 text-cyan-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted">{c.title}</p>
                  <p className="text-sm font-medium">{c.value}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={1} className="lg:col-span-3">
          <Card glass className="p-8">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="size-12 text-success" />
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">Message sent</h2>
                <p className="mt-2 text-sm text-muted">Thanks — we&apos;ll be in touch shortly.</p>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more…"
                    className="flex w-full rounded-2xl border border-border bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted/70 transition-all focus-visible:outline-none focus-visible:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/20"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">Send message</Button>
              </form>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
