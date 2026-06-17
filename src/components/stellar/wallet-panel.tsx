"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  ShieldCheck,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { cn } from "@/lib/utils";
import { USD_ZMW_RATE } from "@/lib/config";
import type { StellarWalletView } from "@/lib/stellar/types";
import type { Trustline } from "@/lib/stellar/types";

interface WalletApiResponse {
  wallet?: StellarWalletView;
  networkStatus?: {
    online: boolean;
    latestLedger?: number;
    mode: string;
    configuredPublicKey?: string | null;
  };
  online?: boolean;
  latestLedger?: number;
  mode?: string;
}

export function StellarWalletPanel({ initial }: { initial: StellarWalletView }) {
  const [wallet, setWallet] = useState(initial);
  const [online, setOnline] = useState<boolean | null>(null);
  const [latestLedger, setLatestLedger] = useState<number | undefined>();
  const [mode, setMode] = useState<string>("simulated");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "fund" | "create">(null);
  const [msg, setMsg] = useState<string | null>(null);

  const applyApiResponse = useCallback((data: WalletApiResponse) => {
    if (data.wallet) setWallet(data.wallet);
    setOnline(data.networkStatus?.online ?? data.online ?? false);
    setLatestLedger(data.networkStatus?.latestLedger ?? data.latestLedger);
    setMode(data.networkStatus?.mode ?? data.mode ?? "simulated");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stellar/wallet");
      const data = await res.json();
      if (res.ok) applyApiResponse(data);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [applyApiResponse]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const explorer = wallet.explorerUrl;

  async function action(kind: "fund" | "create") {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch("/api/stellar/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund: true }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.wallet) setWallet(data.wallet);
        else if (data.publicKey) {
          setWallet((w) => ({
            ...w,
            public_key: data.publicKey,
            xlm_balance: Number(
              data.balances?.find((b: { code: string }) => b.code === "XLM")?.balance ?? 0
            ),
            usdc_balance: Number(
              data.balances?.find((b: { code: string }) => b.code === "USDC")?.balance ?? 0
            ),
            trustline_established: data.trustlineEstablished,
            funded: data.funded,
            simulated: data.simulated,
            error: data.error,
            errorMessage: data.errorMessage,
            sequence: data.sequence,
            trustlines: data.trustlines ?? w.trustlines,
          }));
        }
        setMsg(data.friendbotMessage ?? data.errorMessage ?? "Updated.");
        await refresh();
      } else {
        setMsg(data.error ?? "Request failed.");
      }
    } catch {
      setMsg("Network unavailable — could not reach Horizon.");
    } finally {
      setBusy(null);
    }
  }

  const showUnfunded =
    wallet.error === "not_found" ||
    (!wallet.funded && wallet.configured && !wallet.simulated);

  const showHorizonError = wallet.error === "horizon_unavailable";
  const showMissingTrustline = wallet.error === "missing_trustline" && wallet.funded;

  return (
    <Card glass className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-cyan-accent/10 to-transparent px-6 py-4">
        <div className="flex items-center gap-2">
          <Coins className="size-5 text-cyan-accent" />
          <div>
            <p className="text-sm font-semibold">Stellar Wallet</p>
            <p className="text-xs text-muted">
              {wallet.configured ? "Your Testnet account · live Horizon" : "Demo account · simulated"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin text-muted" />}
          <StellarNetworkBadge />
          <SmartContractBadge status={wallet.simulated ? "simulated" : "active"} />
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Alerts */}
        {showUnfunded && (
          <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Wallet not funded</p>
              <p className="mt-0.5 text-xs opacity-90">
                Wallet not funded. Fund this account using Stellar Friendbot.
              </p>
            </div>
          </div>
        )}

        {showHorizonError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{wallet.errorMessage}</p>
          </div>
        )}

        {showMissingTrustline && (
          <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{wallet.errorMessage}</p>
          </div>
        )}

        {/* Public address */}
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Stellar public address</p>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="flex-1 truncate font-mono text-sm text-foreground/90">{wallet.public_key}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(wallet.public_key);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="Copy address"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
            <a
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="View on Stellar Expert"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <motion.div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">XLM · network fees</span>
              <AssetBadge code="XLM" />
            </div>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
              {wallet.xlm_balance.toLocaleString(undefined, { maximumFractionDigits: 7 })}
            </p>
          </motion.div>
          <motion.div className="rounded-xl border border-[#2775CA]/30 bg-[#2775CA]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">USDC · settlement</span>
              <AssetBadge code="USDC" />
            </div>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
              {wallet.usdc_balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 7,
              })}
            </p>
            <p className="mt-1 text-[10px] text-muted">Primary remittance asset</p>
          </motion.div>
          <motion.div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Est. ZMW value</span>
              <AssetBadge code="ZMW" />
            </div>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-gold">
              K{(
                wallet.usdc_balance * USD_ZMW_RATE +
                wallet.xlm_balance * 0.115 * USD_ZMW_RATE
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-[10px] text-muted">@ {USD_ZMW_RATE} ZMW/USD · display only</p>
          </motion.div>
        </div>

        {/* Sequence & trustlines */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
              wallet.trustline_established
                ? "border-success/30 bg-success/10 text-success"
                : "border-gold/30 bg-gold/10 text-gold"
            )}
          >
            <ShieldCheck className="size-3" />
            USDC trustline {wallet.trustline_established ? "established" : "missing"}
          </span>
          {wallet.sequence && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-muted">
              Seq #{wallet.sequence}
            </span>
          )}
          {latestLedger && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted">
              Ledger #{latestLedger.toLocaleString()}
            </span>
          )}
          <span
            className={cn(
              "rounded-full border px-2.5 py-1",
              online ? "border-success/30 bg-success/10 text-success" : "border-gold/30 bg-gold/10 text-gold"
            )}
          >
            Horizon {online ? "online" : "offline"} · {mode}
          </span>
          {!wallet.simulated && (
            <span className="rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-2.5 py-1 text-cyan-accent">
              Live Testnet
            </span>
          )}
        </div>

        {wallet.trustlines.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Trustlines</p>
            <div className="space-y-1">
              {wallet.trustlines.map((t: Trustline) => (
                <div
                  key={`${t.code}-${t.issuer ?? "native"}`}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
                >
                  <span className="font-medium">
                    {t.code}
                    {t.issuer && (
                      <span className="ml-1 font-mono text-muted">
                        {t.issuer.slice(0, 4)}…{t.issuer.slice(-4)}
                      </span>
                    )}
                  </span>
                  <span>{Number(t.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {msg && <p className="text-xs text-cyan-accent">{msg}</p>}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => action("fund")} disabled={busy !== null}>
            {busy === "fund" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Fund via Friendbot
          </Button>
          {!wallet.configured && (
            <Button size="sm" variant="ghost" onClick={() => action("create")} disabled={busy !== null}>
              {busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Coins className="size-4" />}
              Generate new keypair
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
            Refresh balances
          </Button>
          <a href={explorer} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost">
              <ExternalLink className="size-4" /> Stellar Expert
            </Button>
          </a>
          <Link href="/smart-contracts">
            <Button size="sm" variant="ghost">
              Soroban contracts
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
