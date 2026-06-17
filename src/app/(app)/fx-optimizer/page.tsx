import { PageHeader } from "@/components/layout/page-header";
import { FxOptimizerPanel } from "@/components/stellar/fx-optimizer-panel";
import { demoFxAlerts } from "@/lib/stellar-demo";

export default function FxOptimizerPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="AI FX Optimizer"
        description="Convert across borders at the best rate using Stellar path payments"
      />
      <FxOptimizerPanel alerts={demoFxAlerts} />
    </div>
  );
}
