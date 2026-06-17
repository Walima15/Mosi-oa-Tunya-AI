import Link from "next/link";
import { HeartHandshake, Plus, ShieldAlert, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { ContractIdChip } from "@/components/stellar/contract-id-chip";
import { SettlementTimeline } from "@/components/stellar/settlement-timeline";
import { demoFamilyWallet, demoVaults, demoSorobanContracts } from "@/lib/stellar-demo";
import { formatMoney } from "@/lib/utils";

const RAIL_LABEL: Record<string, string> = {
  airtel: "Airtel Money",
  mtn: "MTN MoMo",
  zamtel: "Zamtel Kwacha",
  flutterwave: "Flutterwave",
  paychangu: "PayChangu",
};

export default function FamilyWalletPage() {
  const fw = demoFamilyWallet;
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Family Wallet"
        description="A shared Stellar financial structure for you and your dependents"
      >
        <Button><Plus /> Add family member</Button>
      </PageHeader>

      {/* Hero */}
      <Card glass className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-gold/10 via-transparent to-cyan-accent/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold">
              <HeartHandshake className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{fw.name}</h2>
              <p className="text-xs text-muted">{fw.members.length} members · base {fw.base_currency}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StellarNetworkBadge />
            <SmartContractBadge label="Family Wallet SC" status="simulated" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Monthly allocation (USDC)</p>
            <p className="mt-1 text-2xl font-bold text-gradient-gold">
              {formatMoney(fw.total_allocated, fw.base_currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Emergency reserve</p>
            <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <ShieldAlert className="size-4 text-cyan-accent" />
              {formatMoney(fw.emergency_reserve, fw.base_currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Soroban Family Wallet Contract</p>
            <div className="mt-2">
              <ContractIdChip
                contractId={
                  demoSorobanContracts.find((c) => c.kind === "family_wallet")?.contractId ??
                  fw.stellar_public_key ??
                  ""
                }
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Members */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-muted">Members & mapped Stellar destinations</h3>
          <div className="space-y-3">
            {fw.members.map((m) => (
              <Card key={m.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={m.full_name} />
                  <div>
                    <p className="font-medium">{m.full_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Badge variant="muted" className="capitalize">{m.relation}</Badge>
                      {m.emergency_support && <Badge variant="cyan">Emergency</Badge>}
                      {m.payout_rail && <span>{RAIL_LABEL[m.payout_rail] ?? m.payout_rail}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <p className="text-sm font-semibold">{formatMoney(m.monthly_support, fw.base_currency)}/mo</p>
                  {m.stellar_destination && <TxHashChip hash={m.stellar_destination} type="account" />}
                  {m.memo_tag && (
                    <span className="font-mono text-[10px] text-gold">{m.memo_tag}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Connected vaults */}
          <h3 className="pt-2 text-sm font-semibold text-muted">Connected Goal Vaults</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {demoVaults.map((v) => (
              <Link key={v.id} href="/goal-vaults" className="block">
                <Card className="hover:border-gold/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.emoji}</span>
                    <div>
                      <p className="text-sm font-medium leading-tight">{v.name}</p>
                      <p className="text-xs text-muted">{formatMoney(v.current_amount, v.currency)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Settlement flow */}
        <div className="space-y-4">
          <Card glass>
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="size-4 text-cyan-accent" />
              <h3 className="text-sm font-semibold">How money flows</h3>
            </div>
            <SettlementTimeline />
            <p className="mt-4 text-xs text-muted">
              Stellar is the settlement backbone. Mobile money is only the last-mile payout —
              the family wallet itself lives on Stellar.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
