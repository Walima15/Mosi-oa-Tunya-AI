import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { demoGoals } from "@/lib/demo-data";
import { formatMoney } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function SavingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Savings Goals" description="Track progress towards what matters">
        <Button><Plus /> New goal</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {demoGoals.map((g) => {
          const pct = Math.round((g.current_amount / g.target_amount) * 100);
          const remaining = g.target_amount - g.current_amount;
          const monthsLeft = g.monthly_contribution > 0 ? Math.ceil(remaining / g.monthly_contribution) : null;
          return (
            <Card key={g.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{g.emoji} {g.name}</CardTitle>
                <Badge variant="success">{pct}%</Badge>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {formatMoney(g.current_amount, g.currency)}
                </p>
                <p className="text-xs text-muted">of {formatMoney(g.target_amount, g.currency)}</p>
                <Progress value={pct} className="mt-4" tone="success" />
                <div className="mt-auto pt-4 space-y-1 text-xs text-muted">
                  <p>Monthly: {formatMoney(g.monthly_contribution, g.currency)}</p>
                  {monthsLeft && <p>~{monthsLeft} months to go</p>}
                  {g.target_date && <p>Target: {g.target_date}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
