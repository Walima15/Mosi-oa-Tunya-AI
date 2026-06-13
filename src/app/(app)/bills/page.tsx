import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { Zap, Droplets, Wifi, Tv } from "lucide-react";

const bills = [
  { category: "electricity", icon: Zap, biller: "ZESCO", account: "1234567890", amount: 850, due: "2026-06-20", recurring: true },
  { category: "water", icon: Droplets, biller: "Lusaka Water", account: "LW-445566", amount: 320, due: "2026-06-25", recurring: true },
  { category: "internet", icon: Wifi, biller: "Liquid Telecom", account: "LT-998877", amount: 599, due: "2026-07-01", recurring: true },
  { category: "tv", icon: Tv, biller: "DStv Premium", account: "DS-112233", amount: 450, due: "2026-06-18", recurring: true },
];

export default function BillsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Bill Payments" description="Pay and automate your household bills">
        <Button variant="secondary">Add bill</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {bills.map((b) => (
          <Card key={b.account}>
            <CardContent className="flex gap-4 pt-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-cyan-accent/10 text-cyan-accent">
                <b.icon className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{b.biller}</p>
                  {b.recurring && <Badge variant="cyan">Auto</Badge>}
                </div>
                <p className="text-xs text-muted capitalize">{b.category} · Acct {b.account}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-bold">{formatMoney(b.amount, "ZMW")}</p>
                  <p className="text-xs text-muted">Due {b.due}</p>
                </div>
                <Button size="sm" className="mt-3 w-full" variant="secondary">Pay now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
