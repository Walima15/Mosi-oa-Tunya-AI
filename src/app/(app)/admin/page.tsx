import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { formatMoney } from "@/lib/utils";
import { Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";
import type { Transaction } from "@/lib/types";

async function loadAdminData() {
  if (!isSupabaseConfigured) {
    return { users: 0, pendingKyc: 0, riskFlags: 0, settledToday: 0, recent: [] as Transaction[] };
  }
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [usersRes, kycRes, riskRes, settledRes, recentRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("kyc_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("risk_flags").select("*", { count: "exact", head: true }).eq("resolved", false),
    supabase
      .from("transactions")
      .select("receive_amount")
      .eq("status", "completed")
      .gte("created_at", startOfDay.toISOString()),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const settledToday = ((settledRes.data as { receive_amount: number }[]) ?? []).reduce(
    (s, t) => s + Number(t.receive_amount),
    0
  );

  return {
    users: usersRes.count ?? 0,
    pendingKyc: kycRes.count ?? 0,
    riskFlags: riskRes.count ?? 0,
    settledToday,
    recent: (recentRes.data as Transaction[]) ?? [],
  };
}

export default async function AdminPage() {
  const { users, pendingKyc, riskFlags, settledToday, recent } = await loadAdminData();

  const stats = [
    { label: "Total users", value: users.toLocaleString(), icon: Users },
    { label: "Pending KYC", value: pendingKyc.toLocaleString(), icon: Shield },
    { label: "Risk flags", value: riskFlags.toLocaleString(), icon: AlertTriangle },
    { label: "Settled today", value: formatMoney(settledToday, "ZMW"), icon: CheckCircle },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Admin Portal" description="Compliance, KYC review and system monitoring">
        <Badge variant="gold">Administrator</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
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

      <Card>
        <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No transactions recorded yet.</p>
          ) : (
            recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{tx.reference}</p>
                  <p className="text-xs text-muted">{tx.description ?? tx.type}</p>
                </div>
                <div className="text-right">
                  <p>{formatMoney(Number(tx.receive_amount), tx.receive_currency)}</p>
                  <Badge variant={tx.status === "completed" ? "success" : "warning"} className="text-[10px]">{tx.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
