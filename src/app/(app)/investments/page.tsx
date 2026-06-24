import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInvestments } from "@/lib/data/queries";
import { formatMoney } from "@/lib/utils";
import type { RiskProfile } from "@/lib/types";

const riskColors: Record<RiskProfile, "success" | "cyan" | "gold" | "danger"> = {
  conservative: "success",
  balanced: "cyan",
  growth: "gold",
  aggressive: "danger",
};

export default async function InvestmentsPage() {
  const products = await getInvestments();
  const portfolio = products.filter((i) => i.held);
  const totalValue = portfolio.reduce((s, i) => s + (i.value ?? 0), 0);
  const totalInvested = portfolio.reduce((s, i) => s + (i.held ?? 0), 0);
  const roi = totalInvested > 0 ? (((totalValue - totalInvested) / totalInvested) * 100).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Investment Hub" description="Grow your wealth across African opportunities" />

      {portfolio.length > 0 && (
        <Card glass className="glow-cyan p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted">Portfolio value</p><p className="mt-1 text-xl font-bold">{formatMoney(totalValue, "ZMW")}</p></div>
            <div><p className="text-xs text-muted">Total invested</p><p className="mt-1 text-xl font-bold">{formatMoney(totalInvested, "ZMW")}</p></div>
            <div><p className="text-xs text-muted">Return</p><p className="mt-1 text-xl font-bold text-success">+{roi}%</p></div>
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-semibold">No investment products available</p>
          <p className="mt-1 text-sm text-muted">Check back soon — products will appear here once published.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge variant={riskColors[p.risk]}>{p.risk}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <span>ROI: <strong className="text-success">{p.expected_roi}%</strong>/yr</span>
                  <span>Min: {formatMoney(p.min_amount, p.currency)}</span>
                  {p.term_months && <span>Term: {p.term_months}mo</span>}
                </div>
                {p.held && p.value ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Your holding</span>
                      <span>{formatMoney(p.value, p.currency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-success">
                      +{formatMoney(p.value - p.held, p.currency)} gain
                    </p>
                  </div>
                ) : (
                  <Button size="sm" className="mt-4" variant="secondary">Invest</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
