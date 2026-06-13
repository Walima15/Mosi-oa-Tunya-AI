import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoAutomations } from "@/lib/demo-data";
import { formatRelativeTime } from "@/lib/utils";
import { Plus, Repeat, Pause, Play } from "lucide-react";

export default function AutomationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Smart Automations" description="Set it once, let Mosi handle the rest">
        <Button><Plus /> New automation</Button>
      </PageHeader>

      <div className="space-y-4">
        {demoAutomations.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.04]">
                <Repeat className="size-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.name}</p>
                  <Badge variant={a.status === "active" ? "success" : "muted"}>{a.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted italic">&ldquo;{a.natural_language}&rdquo;</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                  <span>Runs: {a.run_count}</span>
                  {a.next_run_at && <span>Next: {formatRelativeTime(a.next_run_at)}</span>}
                  <span>Trigger: {a.trigger.kind}</span>
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
    </div>
  );
}
