import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { demoBeneficiaries } from "@/lib/demo-data";
import { formatMoney } from "@/lib/utils";
import { Plus, Phone } from "lucide-react";

export default function FamilyPage() {
  const totalSupport = demoBeneficiaries.reduce((s, b) => s + b.monthly_support, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Family Support Center" description="Manage your loved ones back home">
        <Button><Plus /> Add beneficiary</Button>
      </PageHeader>

      <Card glass className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
          <div><p className="text-xs text-muted">Beneficiaries</p><p className="mt-1 text-2xl font-bold">{demoBeneficiaries.length}</p></div>
          <div><p className="text-xs text-muted">Monthly support</p><p className="mt-1 text-2xl font-bold text-gold">{formatMoney(totalSupport, "ZMW")}</p></div>
          <div><p className="text-xs text-muted">Sent this year</p><p className="mt-1 text-2xl font-bold">{formatMoney(68400, "ZMW")}</p></div>
          <div><p className="text-xs text-muted">Active plans</p><p className="mt-1 text-2xl font-bold">3</p></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {demoBeneficiaries.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex gap-4 pt-6">
              <Avatar name={b.full_name} size={48} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{b.full_name}</p>
                    <p className="text-xs text-muted capitalize">{b.relation} · {b.country}</p>
                  </div>
                  {b.is_favorite && <Badge variant="gold">Favourite</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Phone className="size-3" /> {b.phone}</span>
                  <Badge variant="muted">{b.payment_rail}</Badge>
                </div>
                {b.monthly_support > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs"><span className="text-muted">Monthly plan</span><span className="font-medium">{formatMoney(b.monthly_support, b.currency)}</span></div>
                    <Progress value={75} className="mt-2" />
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="primary" className="flex-1">Send now</Button>
                  <Button size="sm" variant="secondary">Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
