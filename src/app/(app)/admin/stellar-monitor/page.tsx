import {
  Activity,
  AlertTriangle,
  Clock,
  CircleDollarSign,
  Wallet,
  Vault,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { stellarMonitorStats as s } from "@/lib/stellar-demo";

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card glass className="flex items-center gap-4">
      <div className="grid size-11 place-items-center rounded-xl bg-white/5 text-cyan-accent">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className={`text-xl font-bold ${tone}`}>{value}</p>
      </div>
    </Card>
  );
}

export default function StellarMonitorPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Stellar Monitor"
        description="Network-wide settlement, wallet and risk telemetry"
      >
        <StellarNetworkBadge />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label="Total Stellar transactions" value={s.totalTransactions.toLocaleString()} />
        <Stat icon={CircleDollarSign} label="Total volume" value={`$${(s.totalVolumeUsd / 1e6).toFixed(2)}M`} tone="text-gradient-gold" />
        <Stat icon={AlertTriangle} label="Failed transactions" value={s.failedTransactions.toLocaleString()} tone="text-danger" />
        <Stat icon={Clock} label="Pending settlements" value={s.pendingSettlements.toLocaleString()} tone="text-gold" />
        <Stat icon={Wallet} label="Wallets created" value={s.walletsCreated.toLocaleString()} />
        <Stat icon={Vault} label="Active vaults" value={s.vaultsActive.toLocaleString()} />
        <Stat icon={ShieldAlert} label="Risk flags" value={s.riskFlags.toLocaleString()} tone="text-warning" />
        <Stat icon={Activity} label="Network" value="Operational" tone="text-success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payout rails */}
        <Card glass>
          <h3 className="mb-4 text-sm font-semibold">Payout rail status (last-mile)</h3>
          <div className="space-y-2">
            {s.payoutRails.map((r) => (
              <div key={r.name} className="flex items-center justify-between border-b border-white/5 py-2 text-sm">
                <span>{r.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{r.latencyMs}ms</span>
                  <Badge variant={r.status === "operational" ? "success" : "warning"}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Wallet creation log */}
        <Card glass>
          <h3 className="mb-4 text-sm font-semibold">Recent wallet creations</h3>
          <div className="space-y-3">
            {s.recentWalletCreations.map((w) => (
              <div key={w.publicKey} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-muted">{w.at}</p>
                </div>
                <TxHashChip hash={w.publicKey} type="account" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card glass className="border-gold/20 bg-gold/[0.04]">
        <p className="text-sm text-muted">
          All settlement flows through Stellar before any mobile money payout. Risk flags trigger
          admin review and transaction limits before funds leave a user&apos;s Stellar wallet.
        </p>
      </Card>
    </div>
  );
}
