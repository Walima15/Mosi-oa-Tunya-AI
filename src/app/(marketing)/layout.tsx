import { MarketingNav } from "@/components/landing/marketing-nav";
import { MarketingFooter } from "@/components/landing/sections";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <MarketingNav />
      <main className="pt-32">{children}</main>
      <MarketingFooter />
    </div>
  );
}
