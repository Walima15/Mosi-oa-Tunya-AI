import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Repeat,
  TrendingUp,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TransferChart, AllocationChart, RateChart } from "@/components/dashboard/charts";
import {
  demoUser,
  demoWallets,
  totalBalanceUsd,
  demoTransactions,
  demoAutomations,
  demoGoals,
  exchangeRates,
  demoNotifications,
} from "@/lib/demo-data";
import { formatMoney, formatCompact, formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const activeAutomations = demoAutomations.filter((a) => a.status === "active").length;
  const topGoal = demoGoals[0];
  const goalPct = Math.round((topGoal.current_amount / topGoal.target_amount) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Greeting */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
          Good morning, {demoUser.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s your financial pulse for today.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glow-gold">
          <p className="text-xs font-medium text-muted">Total balance</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-gradient-gold">
            ${totalBalanceUsd.toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoWallets.map((w) => (
              <Badge key={`${w.currency}-${w.type}`} variant="muted">
                {w.currency} {formatCompact(w.balance, w.currency)}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Sent home this month</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
            {formatMoney(7100, "ZMW")}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-success">
            <ArrowUpRight className="size-3.5" /> +12% vs last month
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Savings progress</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
            {goalPct}%
          </p>
          <Progress value={goalPct} className="mt-3" tone="success" />
          <p className="mt-2 text-xs text-muted">{topGoal.name}</p>
        </Card>

        <Card>
          <p className="text-xs font-medium text-muted">Active automations</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
            {activeAutomations}
          </p>
          <p className="mt-2 text-xs text-muted">Running on autopilot</p>
        </Card>
      </div>

      {/* AI insight banner */}
      <Card glass className="relative overflow-hidden border-gold/20 glow-gold">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
              <Bot className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Mosi insight</p>
              <p className="mt-1 text-sm text-muted">
                USD/ZMW is at <span className="text-cyan-accent font-medium">27.62</span> — above your
                27.5 target. You have $1,000 ready to convert. Shall I proceed?
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

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransferChart />
        </div>
        <AllocationChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RateChart />

        {/* Exchange rates */}
        <Card>
          <CardHeader>
            <CardTitle>Live rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exchangeRates.map((r) => (
              <div key={r.pair} className="flex items-center justify-between text-sm">
                <span className="text-muted">{r.pair}</span>
                <span className="font-medium">{r.rate}</span>
                <span className={r.change >= 0 ? "text-success" : "text-danger"}>
                  {r.change >= 0 ? "+" : ""}{r.change}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/transfer" className="text-xs text-gold hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoTransactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-white/[0.04]">
                  <Send className="size-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-[11px] text-muted">{formatRelativeTime(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatMoney(tx.receive_amount, tx.receive_currency)}</p>
                  <Badge variant={tx.status === "completed" ? "success" : "warning"} className="text-[10px]">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: automations + goals + notifications */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-cyan-accent" /> Automations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAutomations.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.name}</p>
                  <Badge variant={a.status === "active" ? "success" : "muted"}>{a.status}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted">{a.natural_language}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-success" /> Savings goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoGoals.map((g) => {
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
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoNotifications.map((n) => (
              <div key={n.id} className="flex gap-3">
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan-accent" />}
                <div className={n.read ? "ml-5" : ""}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-[11px] text-muted">{n.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
