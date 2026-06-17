import { PageHeader } from "@/components/layout/page-header";
import { DemoFlow } from "@/components/demo/demo-flow";

export const metadata = {
  title: "Demo · Mosi-oa-Tunya AI",
  description: "The Stellar-powered family finance demo for judges.",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Hackathon Demo"
        description="Africa's first autonomous family finance agent — powered by Stellar"
      />
      <DemoFlow />
    </div>
  );
}
