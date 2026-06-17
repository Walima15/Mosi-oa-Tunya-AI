"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NET = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public" ? "public" : "testnet";

function short(v: string, lead = 6, tail = 4) {
  if (!v) return "";
  return v.length <= lead + tail + 1 ? v : `${v.slice(0, lead)}…${v.slice(-tail)}`;
}

/** Display a Soroban contract ID (C...) with copy + explorer link. */
export function ContractIdChip({
  contractId,
  className,
}: {
  contractId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `https://stellar.expert/explorer/${NET}/contract/${contractId}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] text-purple-300",
        className
      )}
    >
      {short(contractId)}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(contractId);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-muted transition-colors hover:text-foreground"
        aria-label="Copy contract ID"
      >
        {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted transition-colors hover:text-foreground"
        aria-label="View on Stellar Expert"
      >
        <ExternalLink className="size-3" />
      </a>
    </span>
  );
}
