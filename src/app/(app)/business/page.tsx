import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/utils";
import { Plus, Users, FileText } from "lucide-react";

const employees = [
  { name: "Mutale Chanda", role: "Engineer", salary: 18500, rail: "airtel" },
  { name: "Bwalya Phiri", role: "Accountant", salary: 14200, rail: "mtn" },
  { name: "Thandiwe Ngoma", role: "Operations", salary: 12800, rail: "airtel" },
  { name: "Peter Lungu", role: "Sales Lead", salary: 16000, rail: "zamtel" },
  { name: "Grace Tembo", role: "Support", salary: 9800, rail: "mtn" },
];

export default function BusinessPage() {
  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Business Portal" description="Payroll, bulk payments and reports">
        <div className="flex gap-2">
          <Button variant="secondary"><FileText /> Reports</Button>
          <Button><Plus /> Add employee</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted">Employees</p><p className="mt-1 text-2xl font-bold">{employees.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted">Monthly payroll</p><p className="mt-1 text-2xl font-bold text-gold">{formatMoney(totalPayroll, "ZMW")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted">Last run</p><p className="mt-1 text-2xl font-bold">Jun 1</p><Badge variant="success" className="mt-2">Completed</Badge></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-4" /> Team</CardTitle>
          <Button size="sm">Run payroll</Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {employees.map((e) => (
              <div key={e.name} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <Avatar name={e.name} size={36} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted">{e.role}</p>
                </div>
                <Badge variant="muted">{e.rail}</Badge>
                <p className="font-semibold">{formatMoney(e.salary, "ZMW")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
