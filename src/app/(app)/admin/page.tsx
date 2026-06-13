import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoTransactions } from "@/lib/demo-data";
import { formatMoney } from "@/lib/utils";
import { Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";

const kycQueue = [
  { name: "Amaka Okonkwo", status: "pending", submitted: "2h ago" },
  { name: "Tendai Moyo", status: "pending", submitted: "5h ago" },
  { name: "Fatima Hassan", status: "verified", submitted: "1d ago" },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Admin Portal" description="Compliance, KYC review and system monitoring">
        <Badge variant="gold">Administrator</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total users", value: "12,847", icon: Users },
          { label: "Pending KYC", value: "23", icon: Shield },
          { label: "Risk flags", value: "4", icon: AlertTriangle },
          { label: "Settled today", value: "K2.4M", icon: CheckCircle },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <s.icon className="size-5 text-gold" />
              <div>
                <p className="text-xs text-muted">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>KYC Review Queue</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {kycQueue.map((k) => (
              <div key={k.name} className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted">Submitted {k.submitted}</p>
                </div>
                <Badge variant={k.status === "verified" ? "success" : "warning"}>{k.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {demoTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{tx.reference}</p>
                  <p className="text-xs text-muted">{tx.description}</p>
                </div>
                <div className="text-right">
                  <p>{formatMoney(tx.receive_amount, tx.receive_currency)}</p>
                  <Badge variant={tx.status === "completed" ? "success" : "warning"} className="text-[10px]">{tx.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
