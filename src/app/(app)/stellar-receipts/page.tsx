import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StellarReceiptCard, type ReceiptLike } from "@/components/stellar/stellar-receipt";
import { StellarNetworkBadge } from "@/components/stellar/network-badge";
import {
  demoSplitPayments,
  demoStellarWallet,
  demoAutomationLogs,
} from "@/lib/stellar-demo";

function buildReceipts(): ReceiptLike[] {
  const out: ReceiptLike[] = [];
  const src = demoStellarWallet.public_key;

  for (const sp of demoSplitPayments) {
    sp.items.forEach((it, i) => {
      out.push({
        reference: `${sp.id.toUpperCase()}-${i + 1}`,
        status: "success",
        hash: it.stellar_tx_hash ?? "",
        operationType: "split_payment",
        asset: "USDC",
        sourceAccount: src,
        destinationAccount: it.stellar_destination ?? "",
        amount: `${it.amount.toFixed(2)} ${it.currency}`,
        feeStroops: 100,
        memo: it.memo ?? undefined,
        timestamp: sp.created_at,
        simulated: true,
      });
    });
  }

  demoAutomationLogs.forEach((log) => {
    out.push({
      reference: log.id.toUpperCase(),
      status: log.status === "success" ? "success" : "failed",
      hash: log.stellar_tx_hash ?? "",
      operationType: "payment",
      asset: "USDC",
      sourceAccount: src,
      destinationAccount: demoStellarWallet.public_key,
      amount: `${(log.amount ?? 0).toFixed(2)} ZMW`,
      feeStroops: 100,
      memo: "AUTOMATION",
      timestamp: log.created_at,
      simulated: true,
    });
  });

  return out.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export default function StellarReceiptsPage() {
  const receipts = buildReceipts();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Stellar Receipts"
        description="On-chain proof for every money movement — hash, asset, memo, fee and explorer link"
      />

      <Card glass className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gradient-gold">{receipts.length}</p>
          <p className="text-xs text-muted">Stellar transaction receipts</p>
        </div>
        <StellarNetworkBadge />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {receipts.map((r) => (
          <StellarReceiptCard key={r.reference} receipt={r} />
        ))}
      </div>
    </div>
  );
}
