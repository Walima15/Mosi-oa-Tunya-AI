import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { AssetBadge } from "@/components/stellar/asset-badge";
import { SmartContractBadge } from "@/components/stellar/smart-contract-badge";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { GoalVault } from "@/lib/types";

export function VaultCard({
  vault,
  className,
  onClick,
}: {
  vault: GoalVault;
  className?: string;
  onClick?: () => void;
}) {
  const pct = Math.min(100, Math.round((vault.current_amount / vault.target_amount) * 100));
  const remaining = Math.max(0, vault.target_amount - vault.current_amount);
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-gold/30 hover:bg-white/[0.05]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 text-xl">
            {vault.emoji}
          </div>
          <div>
            <p className="text-sm font-semibold">{vault.name}</p>
            <p className="text-xs capitalize text-muted">{vault.vault_type.replace("_", " ")} vault</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <AssetBadge code="USDC" />
          <SmartContractBadge label="Goal Vault" status="simulated" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="text-lg font-semibold">{formatMoney(vault.current_amount, vault.currency)}</span>
          <span className="text-xs text-muted">of {formatMoney(vault.target_amount, vault.currency)}</span>
        </div>
        <Progress value={pct} className="mt-2" tone="gold" />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-medium text-gold">{pct}% funded</span>
          <span className="flex items-center gap-1 text-muted">
            <TrendingUp className="size-3" /> {formatMoney(remaining, vault.currency)} to go
          </span>
        </div>
      </div>

      {vault.stellar_public_key && (
        <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted">Soroban vault account</span>
            <TxHashChip hash={vault.stellar_public_key} type="account" />
          </div>
          <p className="text-[10px] text-muted">USDC locked on-chain · progress tracked by contract</p>
        </div>
      )}
    </div>
  );
}
