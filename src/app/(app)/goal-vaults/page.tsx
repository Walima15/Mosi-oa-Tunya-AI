import { Plus, Vault, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaultCard } from "@/components/stellar/vault-card";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { demoVaults } from "@/lib/stellar-demo";
import { formatMoney } from "@/lib/utils";

export default function GoalVaultsPage() {
  const totalSaved = demoVaults.reduce((s, v) => s + v.current_amount, 0);
  const totalTarget = demoVaults.reduce((s, v) => s + v.target_amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Goal Vaults"
        description="Soroban-backed USDC vaults for every savings goal"
      >
        <Button><Plus /> New vault</Button>
      </PageHeader>

      <Card glass className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Vault className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted">Total saved across {demoVaults.length} Stellar vaults</p>
            <p className="text-2xl font-bold text-gradient-gold">{formatMoney(totalSaved, "ZMW")}</p>
            <p className="text-xs text-muted">of {formatMoney(totalTarget, "ZMW")} target</p>
          </div>
        </div>
        <StellarNetworkBadge />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoVaults.map((v) => (
          <VaultCard key={v.id} vault={v} />
        ))}
        <Card className="flex min-h-[180px] flex-col items-center justify-center gap-3 border-dashed text-center">
          <div className="grid size-12 place-items-center rounded-full bg-white/5 text-cyan-accent">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Ask Mosi to create a vault</p>
            <p className="text-xs text-muted">&ldquo;Build a house in Lusaka in 5 years&rdquo;</p>
          </div>
          <Button size="sm" variant="secondary"><Plus /> Create vault</Button>
        </Card>
      </div>

      <Card glass>
        <p className="text-xs text-muted">
          Each vault is backed by the <strong className="text-foreground">Soroban Goal Vault Contract</strong>,
          which locks real <span className="font-mono text-[#5AA0EE]">USDC</span> on Stellar. Deposits invoke{" "}
          <span className="font-mono text-gold">deposit_to_vault()</span> with intent memos like{" "}
          <span className="font-mono text-gold">HOUSE_FUND_DEPOSIT</span> — traceable on-chain and in the contract event log.
        </p>
      </Card>
    </div>
  );
}
