import { PageHeader } from "@/components/layout/page-header";
import { SplitBuilder } from "@/components/stellar/split-builder";

export default function SplitPaymentsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Split Payments"
        description="One remittance, fanned across many Stellar destinations — each with its own intent memo and transaction hash"
      />
      <SplitBuilder />
    </div>
  );
}
