import { PageHeader } from "@/components/layout/page-header";
import { TransferForm } from "@/components/transfer/transfer-form";
import { getBeneficiaries, getExchangeRates } from "@/lib/data/queries";

export default async function TransferPage() {
  const [beneficiaries, rates] = await Promise.all([getBeneficiaries(), getExchangeRates()]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Send Money" description="Cross-border remittance with stablecoin settlement" />
      <TransferForm beneficiaries={beneficiaries} rates={rates} />
    </div>
  );
}
