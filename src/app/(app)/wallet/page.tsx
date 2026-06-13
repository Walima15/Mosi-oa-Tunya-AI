import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoWallets, totalBalanceUsd } from "@/lib/demo-data";
import { formatMoney } from "@/lib/utils";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Wallet" description="Your multi-currency balances">
        <Button variant="secondary"><Plus /> Add currency</Button>
      </PageHeader>

      <Card glass className="glow-gold p-8 text-center">
        <p className="text-sm text-muted">Total balance</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-gradient-gold">
          ${totalBalanceUsd.toLocaleString()}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {demoWallets.map((w) => (
          <Card key={`${w.currency}-${w.type}`} className="group hover:border-gold/30 transition-colors">
            <CardHeader>
              <CardTitle>{w.label}</CardTitle>
              <Badge variant={w.type === "stablecoin" ? "cyan" : "gold"}>{w.type}</Badge>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {formatMoney(w.balance, w.currency)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1"><ArrowUpRight className="size-3.5" /> Send</Button>
                <Button size="sm" variant="ghost" className="flex-1"><ArrowDownLeft className="size-3.5" /> Receive</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
