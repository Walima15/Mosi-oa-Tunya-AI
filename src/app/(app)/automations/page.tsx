import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import { TxHashChip } from "@/components/stellar/tx-hash-chip";
import { demoStellarAutomations, demoAutomationLogs } from "@/lib/stellar-demo";
import { formatRelativeTime, formatMoney } from "@/lib/utils";
import { Plus, Repeat, Pause, Play } from "lucide-react";

export default function AutomationsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Stellar Automations"
        description="Programmable money rules that execute over Stellar"
      >
        <Button><Plus /> New automation</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {demoStellarAutomations.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.04]">
                  <Repeat className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <Badge variant={a.status === "active" ? "success" : "muted"}>{a.status}</Badge>
                    <Badge variant="cyan">Stellar</Badge>
                  </div>
                  <p className="mt-1 text-sm italic text-muted">&ldquo;{a.natural_language}&rdquo;</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>Runs: {a.run_count}</span>
                    {a.next_run_at && <span>Next: {formatRelativeTime(a.next_run_at)}</span>}
                    <span>Trigger: {a.trigger.kind}</span>
                    {a.action.memo_tag && (
                      <span className="font-mono text-gold">{a.action.memo_tag}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {a.status === "active" ? (
                    <Button size="sm" variant="ghost"><Pause className="size-4" /> Pause</Button>
                  ) : (
                    <Button size="sm" variant="ghost"><Play className="size-4" /> Resume</Button>
                  )}
                  <Button size="sm" variant="secondary">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Execution logs */}
        <div className="space-y-4">
          <Card glass>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Automation logs</h3>
              <StellarNetworkBadge />
            </div>
            <div className="space-y-3">
              {demoAutomationLogs.map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <Badge variant={log.status === "success" ? "success" : "danger"}>{log.status}</Badge>
                    {log.amount != null && (
                      <span className="text-sm font-semibold">{formatMoney(log.amount, "ZMW")}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{log.detail}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-muted">{formatRelativeTime(log.created_at)}</span>
                    {log.stellar_tx_hash && <TxHashChip hash={log.stellar_tx_hash} type="tx" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
