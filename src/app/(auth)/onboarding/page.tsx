"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SUPPORTED_CURRENCIES } from "@/lib/brand";
import { cn } from "@/lib/utils";

const steps = ["Profile", "Location", "Currency", "Done"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("");
  const [residence, setResidence] = useState("");
  const [currency, setCurrency] = useState("ZMW");

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));

  return (
    <Card glass className="p-8">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted">
          {steps.map((s, i) => (
            <span key={s} className={cn(i <= step && "text-gold font-medium")}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="mt-3" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Tell us about you</h2>
              <p className="mt-2 text-sm text-muted">Mosi uses this to personalise your experience.</p>
              <div className="mt-6 space-y-4">
                <div><Label>Full name</Label><Input placeholder="Chanda Mwila" defaultValue="Chanda Mwila" /></div>
                <div><Label>Phone</Label><Input placeholder="+44 7700 900000" /></div>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Where are you based?</h2>
              <p className="mt-2 text-sm text-muted">We support diaspora users worldwide sending home to Africa.</p>
              <div className="mt-6 space-y-4">
                <div><Label>Home country</Label><Input placeholder="Zambia" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                <div><Label>Country of residence</Label><Input placeholder="United Kingdom" value={residence} onChange={(e) => setResidence(e.target.value)} /></div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Preferred currency</h2>
              <p className="mt-2 text-sm text-muted">Amounts will display in this currency by default.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition-all",
                      currency === c.code
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-border hover:border-white/20"
                    )}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <p className="mt-1 text-sm font-medium">{c.code}</p>
                    <p className="text-xs text-muted">{c.name}</p>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
                <Check className="size-8" />
              </div>
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-xl font-bold">You&apos;re all set!</h2>
              <p className="mt-2 text-sm text-muted">Mosi is ready to help you move money home.</p>
              <Button className="mt-8 w-full" size="lg" onClick={() => window.location.href = "/ai"}>
                Meet Mosi <ArrowRight />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <Button className="mt-8 w-full" onClick={next}>
          Continue <ArrowRight />
        </Button>
      )}
    </Card>
  );
}
