"use client";

import { motion } from "framer-motion";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { DemoContractEvent } from "@/lib/stellar-demo";
import type { ContractEvent } from "@/lib/stellar/soroban";

type EventRow = DemoContractEvent | (ContractEvent & { id: string });

export function ContractEventLog({
  events,
  className,
  limit = 10,
}: {
  events: EventRow[];
  className?: string;
  limit?: number;
}) {
  const shown = events.slice(0, limit);
  return (
    <div className={cn("space-y-2", className)}>
      {shown.map((ev, i) => (
        <motion.div
          key={"id" in ev ? ev.id : i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SmartContractBadge
                label={ev.contractKind.replace(/_/g, " ")}
                status={ev.simulated ? "simulated" : "active"}
              />
              <span className="font-mono text-[11px] text-gold">{ev.eventName}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{ev.data}</p>
            <p className="mt-0.5 text-[10px] text-muted/70">{formatRelativeTime(ev.timestamp)}</p>
          </div>
          <TxHashChip hash={ev.txHash} type="tx" />
        </motion.div>
      ))}
    </div>
  );
}
