import Link from "next/link";
import { FileCode, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { ContractIdChip } from "@/components/stellar/contract-id-chip";
import { ContractEventLog } from "@/components/stellar/contract-event-log";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import {
  demoSorobanContracts,
  demoContractEvents,
  totalSorobanUsdc,
} from "@/lib/stellar-demo";
import { formatRelativeTime } from "@/lib/utils";

const NET = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public" ? "public" : "testnet";

export default function SmartContractsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Smart Contracts"
        description="Soroban programmable finance — XLM for fees, USDC for settlement"
      >
        <StellarNetworkBadge />
      </PageHeader>

      {/* Summary */}
      <Card glass className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted">Total USDC controlled by Soroban contracts</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-bold text-gradient-gold">
            {totalSorobanUsdc.toLocaleString()} <AssetBadge code="USDC" />
          </p>
          <p className="mt-1 text-xs text-muted">
            {demoSorobanContracts.length} deployed contracts · programmable family finance on Stellar
          </p>
        </div>
        <SmartContractBadge label="Soroban · Testnet" status="simulated" />
      </Card>

      {/* Asset stack callout */}
      <Card glass className="border-purple-400/20 bg-purple-500/[0.04]">
        <p className="text-sm">
          <span className="font-semibold text-purple-300">Mosi uses three Stellar-native layers:</span>{" "}
          <AssetBadge code="XLM" /> for network fees ·{" "}
          <AssetBadge code="USDC" /> for stable cross-border settlement ·{" "}
          <SmartContractBadge label="Soroban" status="active" /> for programmable vaults, splits & automations
        </p>
      </Card>

      {/* Contract cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {demoSorobanContracts.map((c) => (
          <Card key={c.kind} glass className="overflow-hidden p-0">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-purple-500/15 text-purple-300">
                  <FileCode className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{c.description}</p>
                </div>
              </div>
              <Badge variant={c.status === "active" ? "success" : "muted"}>{c.status}</Badge>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Contract ID</span>
                <ContractIdChip contractId={c.contractId} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">USDC balance</span>
                <span className="font-semibold">
                  {c.usdcBalance > 0 ? `${c.usdcBalance.toLocaleString()} USDC` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Last execution</span>
                <span>{formatRelativeTime(c.lastExecution)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Last tx</span>
                <TxHashChip hash={c.lastTxHash} type="tx" />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-muted">Methods</p>
                <div className="flex flex-wrap gap-1">
                  {c.methods.map((m) => (
                    <span
                      key={m}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {m}()
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={`https://stellar.expert/explorer/${NET}/contract/${c.contractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-accent hover:underline"
              >
                View on Stellar Expert <ExternalLink className="size-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>

      {/* Event log */}
      <Card glass>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent contract events</h3>
          <SmartContractBadge status="simulated" />
        </div>
        <ContractEventLog events={demoContractEvents} limit={8} />
      </Card>

      <Card glass className="text-center">
        <p className="text-sm text-muted">
          Contracts live in{" "}
          <Link href="#" className="text-cyan-accent hover:underline">/contracts</Link> (Rust/Soroban).
          Deploy with{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">stellar contract deploy</code>{" "}
          and set the contract IDs in your environment.
        </p>
      </Card>
    </div>
  );
}
