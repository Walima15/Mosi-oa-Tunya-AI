import { MarketingNav } from "@/components/landing/marketing-nav";
import { Hero } from "@/components/landing/hero";
import {
  ModulesSection,
  AiSection,
  HowItWorks,
  StatsSection,
  SecuritySection,
  CtaSection,
  MarketingFooter,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <main className="relative">
      <MarketingNav />
      <Hero />
      <StatsSection />
      <AiSection />
      <ModulesSection />
      <HowItWorks />
      <SecuritySection />
      <CtaSection />
      <MarketingFooter />
    </main>
  );
}
