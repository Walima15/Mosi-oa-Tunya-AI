"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiChatPreview } from "./ai-chat-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* aurora + flowing water backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-aurora" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-[60%] opacity-40">
        <div className="animate-flow h-full w-full bg-[linear-gradient(110deg,transparent,rgba(0,212,255,0.12),transparent,rgba(212,175,55,0.1),transparent)] bg-[length:200%_100%]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-gold"
          >
            <Sparkles className="size-3.5" />
            ChatGPT for African Finance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Make money move
            <br />
            across Africa as freely as
            <br />
            <span className="text-gradient-gold">water over the Falls.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-muted"
          >
            Mosi-oa-Tunya AI is your personal cross-border financial agent. Just
            say what you want — &ldquo;Send K3,000 home every month&rdquo; — and the
            AI schedules, automates and settles it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/signup">
              <Button size="lg">
                Open your account <ArrowRight />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Explore the demo
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" /> Bank-grade security
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-4 text-cyan-accent" /> Stablecoin settlement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-gold" /> 6 currencies, 5 rails
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="animate-float">
            <AiChatPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
