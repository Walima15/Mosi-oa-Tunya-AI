"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { cn } from "@/lib/utils";

export interface ReceiptLike {
  reference: string;
  status: "success" | "pending" | "failed";
  hash: string;
  operationType: string;
  asset: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string;
  feeStroops: number;
  memo?: string;
  timestamp: string;
  simulated?: boolean;
}

const STATUS = {
  success: { icon: CheckCircle2, cls: "text-success", label: "Success" },
  pending: { icon: Clock, cls: "text-gold", label: "Pending" },
  failed: { icon: XCircle, cls: "text-danger", label: "Failed" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground/90">{children}</span>
    </div>
  );
}

export function StellarReceiptCard({
  receipt,
  className,
}: {
  receipt: ReceiptLike;
  className?: string;
}) {
  const s = STATUS[receipt.status] ?? STATUS.pending;
  const Icon = s.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-dashed border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-5", s.cls)} />
          <div>
            <p className="text-sm font-semibold">Stellar Receipt</p>
            <p className="font-mono text-[11px] text-muted">{receipt.reference}</p>
          </div>
        </div>
        <StellarNetworkBadge />
      </div>

      <div className="divide-y divide-white/5 px-5">
        <Row label="Status">
          <span className={s.cls}>{s.label}</span>
          {receipt.simulated && <span className="ml-1 text-[10px] text-muted">· demo</span>}
        </Row>
        <Row label="Operation">{receipt.operationType.replace(/_/g, " ")}</Row>
        <Row label="Amount">{receipt.amount}</Row>
        <Row label="Asset">
          <span className="inline-flex gap-1">
            {receipt.asset.split("→").map((a) => (
              <AssetBadge key={a.trim()} code={a.trim()} />
            ))}
          </span>
        </Row>
        <Row label="Network fee">{(receipt.feeStroops / 1e7).toFixed(7)} XLM</Row>
        {receipt.memo && (
          <Row label="Memo">
            <span className="font-mono text-[11px] text-gold">{receipt.memo}</span>
          </Row>
        )}
        <Row label="From">
          <TxHashChip hash={receipt.sourceAccount} type="account" />
        </Row>
        <Row label="To">
          <TxHashChip hash={receipt.destinationAccount} type="account" />
        </Row>
        <Row label="Tx hash">
          <TxHashChip hash={receipt.hash} type="tx" />
        </Row>
        <Row label="Time">{new Date(receipt.timestamp).toLocaleString()}</Row>
      </div>
    </motion.div>
  );
}
