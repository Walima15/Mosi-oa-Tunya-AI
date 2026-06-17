"use client";

import { motion } from "framer-motion";
import { Wallet, Coins, Network, Smartphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Wallet, title: "User wallet", detail: "Funds debited from your Stellar wallet" },
  { icon: Coins, title: "Stablecoin settlement", detail: "Value moves as USDC over Stellar" },
  { icon: Network, title: "Allocation", detail: "Routed to family / vaults / recipients" },
  { icon: Smartphone, title: "Last-mile payout", detail: "Mobile money delivery (Airtel/MTN/Zamtel)" },
];

/**
 * Vertical settlement timeline that makes the Stellar-first architecture
 * explicit: Stellar is the backbone, mobile money is only the last mile.
 */
export function SettlementTimeline({
  active = STEPS.length,
  className,
}: {
  active?: number;
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-5 pl-2", className)}>
      {STEPS.map((step, i) => {
        const reached = i < active;
        const Icon = step.icon;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[19px] top-10 h-[calc(100%-8px)] w-px",
                  reached ? "bg-cyan-accent/40" : "bg-white/10"
                )}
              />
            )}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "z-10 grid size-10 shrink-0 place-items-center rounded-full border",
                reached
                  ? isLast
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-cyan-accent/40 bg-cyan-accent/15 text-cyan-accent"
                  : "border-white/10 bg-white/5 text-muted"
              )}
            >
              {reached && isLast ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
            </motion.div>
            <div className="pb-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted">{step.detail}</p>
              {isLast && (
                <span className="mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">
                  Optional · only when cash-out is needed
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
