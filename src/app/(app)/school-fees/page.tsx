import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { GraduationCap, Calendar } from "lucide-react";

const fees = [
  { school: "Rhodes Park School", student: "Natasha Mwila", term: "Term 3", amount: 14000, due: "2026-09-01", paid: false },
  { school: "Rhodes Park School", student: "Natasha Mwila", term: "Term 2", amount: 14000, due: "2026-05-01", paid: true },
  { school: "University of Zambia", student: "David Banda", term: "Semester 1", amount: 8500, due: "2026-08-15", paid: false },
];

export default function SchoolFeesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="School Fees Hub" description="Track and schedule education payments">
        <Button variant="secondary">Register school</Button>
      </PageHeader>

      <div className="space-y-4">
        {fees.map((f, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold">
                <GraduationCap className="size-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{f.school}</p>
                <p className="text-sm text-muted">{f.student} · {f.term}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Calendar className="size-3" /> Due {f.due}</p>
              </div>
              <div className="text-right">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold">{formatMoney(f.amount, "ZMW")}</p>
                <Badge variant={f.paid ? "success" : "warning"} className="mt-2">{f.paid ? "Paid" : "Upcoming"}</Badge>
              </div>
              {!f.paid && <Button size="sm">Schedule payment</Button>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
