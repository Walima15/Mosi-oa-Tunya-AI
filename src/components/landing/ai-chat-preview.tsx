"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

const messages = [
  { role: "user", text: "Send K5,000 to my mother every month." },
  {
    role: "ai",
    text: "Done. I'll send K5,000 to Grace Mwila on the 1st of each month via Airtel Money. First transfer arrives in ~12s. Want me to save 10% too?",
  },
  { role: "user", text: "Yes, and alert me if the rate beats 27.5." },
];

export function AiChatPreview() {
  return (
    <div className="glass-strong relative mx-auto w-full max-w-md rounded-[28px] p-5 glow-gold">
      <div className="mb-4 flex items-center gap-3 border-b border-white/8 pb-4">
        <LogoMark className="h-9 w-9" />
        <div>
          <p className="text-sm font-semibold">Mosi Agent</p>
          <p className="flex items-center gap-1.5 text-[11px] text-success">
            <span className="size-1.5 rounded-full bg-success" /> Online · thinking
          </p>
        </div>
        <Sparkles className="ml-auto size-4 text-gold" />
      </div>

      <div className="space-y-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.5, duration: 0.5 }}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-gold-light to-gold px-4 py-2.5 text-sm text-midnight-900"
                  : "max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-2.5 text-sm text-foreground/90"
              }
            >
              {m.text}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.6, duration: 0.5 }}
          className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-2.5 text-xs text-success"
        >
          <Check className="size-4" /> Automation created · Rate alert at 27.5 set
        </motion.div>
      </div>
    </div>
  );
}
