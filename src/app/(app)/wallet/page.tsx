import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StellarWalletPanel } from "@/components/stellar/wallet-panel";
import { loadWalletView } from "@/lib/stellar/wallet-view";
import { getWallets, getExchangeRates, totalBalanceUsd, walletLabel } from "@/lib/data/queries";
import { formatMoney } from "@/lib/utils";

export default async function WalletPage() {
  const [stellarWallet, wallets, rates] = await Promise.all([
    loadWalletView(),
    getWallets(),
    getExchangeRates(),
  ]);
  const totalUsd = totalBalanceUsd(wallets, rates);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Wallet"
        description={
          stellarWallet.configured
            ? "Your Stellar Testnet account · live balances from Horizon"
            : "Your Stellar account and multi-currency balances"
        }
      >
        <Button variant="secondary"><Plus /> Add currency</Button>
      </PageHeader>

      <StellarWalletPanel initial={stellarWallet} />

      <Card glass className="glow-gold p-8 text-center">
        <p className="text-sm text-muted">Total balance (off-ramp value)</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-gradient-gold">
          ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="mt-2 text-xs text-muted">
          Settled over Stellar USDC · paid out via mobile money as the last mile
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted">Currency pockets</h2>
        {wallets.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">No currency wallets yet.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {wallets.map((w) => (
              <Card key={w.id} className="group hover:border-gold/30 transition-colors">
                <CardHeader>
                  <CardTitle>{walletLabel(w)}</CardTitle>
                  <Badge variant={w.type === "stablecoin" ? "cyan" : "gold"}>{w.type}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                    {formatMoney(Number(w.balance), w.currency)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1"><ArrowUpRight className="size-3.5" /> Send</Button>
                    <Button size="sm" variant="ghost" className="flex-1"><ArrowDownLeft className="size-3.5" /> Receive</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
