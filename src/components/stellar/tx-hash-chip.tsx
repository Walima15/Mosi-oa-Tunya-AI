"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NET = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public" ? "public" : "testnet";

function short(v: string, lead = 6, tail = 6) {
  if (!v) return "";
  return v.length <= lead + tail + 1 ? v : `${v.slice(0, lead)}…${v.slice(-tail)}`;
}

export function TxHashChip({
  hash,
  type = "tx",
  className,
}: {
  hash: string;
  type?: "tx" | "account";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `https://stellar.expert/explorer/${NET}/${type}/${hash}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-cyan-accent",
        className
      )}
    >
      {short(hash)}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(hash);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-muted transition-colors hover:text-foreground"
        aria-label="Copy hash"
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
