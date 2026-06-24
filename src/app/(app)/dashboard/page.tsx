import Link from "next/link";
import { ArrowUpRight, Bot, Repeat, TrendingUp, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TransferChart, AllocationChart, RateChart } from "@/components/dashboard/charts";
import { getProfile } from "@/lib/data/user";
import {
  getWallets,
  getTransactions,
  getSavingsGoals,
  getAutomations,
  getNotifications,
  getExchangeRates,
  totalBalanceUsd,
  toUsd,
  ratePairs,
} from "@/lib/data/queries";
import { formatMoney, formatCompact, formatRelativeTime } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthlySeries(txs: Transaction[]) {
  const buckets = new Map<string, { month: string; sent: number; saved: number }>();
  for (const tx of txs) {
    const d = new Date(tx.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = MONTHS[d.getMonth()];
    const b = buckets.get(key) ?? { month: label, sent: 0, saved: 0 };
    if (tx.type === "savings_contribution") b.saved += Number(tx.send_amount);
    else b.sent += Number(tx.receive_amount);
    buckets.set(key, b);
  }
  return Array.from(buckets.values()).slice(-8);
}

function allocation(txs: Transaction[], rates: { base: string; quote: string; rate: number }[]) {
  const groups: Record<string, number> = { "Family support": 0, Savings: 0, Investments: 0, "Bills & fees": 0 };
  for (const tx of txs) {
    const usd = toUsd(Number(tx.send_amount), tx.send_currency, rates as never);
    if (tx.type === "transfer") groups["Family support"] += usd;
    else if (tx.type === "savings_contribution") groups["Savings"] += usd;
    else if (tx.type === "investment") groups["Investments"] += usd;
    else if (tx.type === "bill" || tx.type === "school_fee") groups["Bills & fees"] += usd;
  }
  const total = Object.values(groups).reduce((s, v) => s + v, 0);
  const colors: Record<string, string> = {
    "Family support": "#D4AF37",
    Savings: "#00D4FF",
    Investments: "#22C55E",
    "Bills & fees": "#3F5D8F",
  };
  if (total === 0) return [];
  return Object.entries(groups)
    .filter(([, v]) => v > 0)
    .map(([name, v]) => ({ name, value: Math.round((v / total) * 100), color: colors[name] }));
}

export default async function DashboardPage() {
  const [profile, wallets, txs, goals, automations, notifications, rates] = await Promise.all([
    getProfile(),
    getWallets(),
    getTransactions(100),
    getSavingsGoals(),
    getAutomations(),
    getNotifications(5),
    getExchangeRates(),
  ]);

  const firstName = (profile?.full_name ?? "there").split(" ")[0];
  const totalUsd = totalBalanceUsd(wallets, rates);
  const activeAutomations = automations.filter((a) => a.status === "active").length;
  const topGoal = goals[0];
  const goalPct = topGoal ? Math.round((topGoal.current_amount / topGoal.target_amount) * 100) : 0;

  const now = new Date();
  const sentThisMonth = txs
    .filter(
      (t) =>
        t.type === "transfer" &&
        t.receive_currency === "ZMW" &&
        new Date(t.created_at).getMonth() === now.getMonth() &&
        new Date(t.created_at).getFullYear() === now.getFullYear()
    )
    .reduce((s, t) => s + Number(t.receive_amount), 0);

  const series = monthlySeries(txs);
  const allocationData = allocation(txs, rates);
  const pairs = ratePairs(rates);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s your financial pulse for today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glow-gold">
          <p className="text-xs font-medium text-muted">Total balance</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-gradient-gold">
            ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wallets.length === 0 ? (
              <span className="text-xs text-muted">No wallets yet</span>
            ) : (
              wallets.map((w) => (
                <Badge key={w.id} variant="muted">
                  {w.currency} {formatCompact(Number(w.balance), w.currency)}
                </Badge>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Sent home this month</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
            {formatMoney(sentThisMonth, "ZMW")}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted">
            <ArrowUpRight className="size-3.5" /> Across {txs.filter((t) => t.type === "transfer").length} transfers
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Savings progress</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">{goalPct}%</p>
          <Progress value={goalPct} className="mt-3" tone="success" />
          <p className="mt-2 text-xs text-muted">{topGoal ? topGoal.name : "No goals yet"}</p>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Active automations</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">{activeAutomations}</p>
          <p className="mt-2 text-xs text-muted">Running on autopilot</p>
        </Card>
      </div>

      <Card glass className="relative overflow-hidden border-gold/20 glow-gold">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
              <Bot className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Mosi insight</p>
              <p className="mt-1 text-sm text-muted">
                {pairs.find((p) => p.pair === "USD → ZMW")
                  ? `USD/ZMW is at ${pairs.find((p) => p.pair === "USD → ZMW")!.rate}. Ask Mosi when it's the best time to convert.`
                  : "Ask Mosi anything about sending money home, saving, or investing."}
              </p>
            </div>
          </div>
          <Link href="/ai">
            <Badge variant="gold" className="cursor-pointer px-4 py-2 text-sm">
              Talk to Mosi
            </Badge>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransferChart data={series} />
        </div>
        <AllocationChart data={allocationData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RateChart data={[]} />

        <Card>
          <CardHeader>
            <CardTitle>Live rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pairs.length === 0 ? (
              <p className="text-sm text-muted">No rates available.</p>
            ) : (
              pairs.map((r) => (
                <div key={r.pair} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{r.pair}</span>
                  <span className="font-medium">{r.rate}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/transfer" className="text-xs text-gold hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {txs.length === 0 ? (
              <p className="text-sm text-muted">No transactions yet.</p>
            ) : (
              txs.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-white/[0.04]">
                    <Send className="size-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-[11px] text-muted">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatMoney(Number(tx.receive_amount), tx.receive_currency)}</p>
                    <Badge variant={tx.status === "completed" ? "success" : "warning"} className="text-[10px]">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-cyan-accent" /> Automations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {automations.length === 0 ? (
              <p className="text-sm text-muted">No automations yet.</p>
            ) : (
              automations.slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-xl bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{a.name}</p>
                    <Badge variant={a.status === "active" ? "success" : "muted"}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{a.natural_language}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-success" /> Savings goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted">No savings goals yet.</p>
            ) : (
              goals.map((g) => {
                const pct = Math.round((g.current_amount / g.target_amount) * 100);
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{g.emoji} {g.name}</span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-2" tone="success" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-3">
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan-accent" />}
                  <div className={n.read ? "ml-5" : ""}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-[11px] text-muted">{n.body}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
