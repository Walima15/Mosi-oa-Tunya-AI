/**
 * Family finance planner.
 *
 * Turns a high-level instruction ("take care of my family's finances this
 * month") into a concrete, Stellar-ready allocation plan: who gets what, which
 * vaults receive deposits, and the intent memo for each leg. The plan is then
 * surfaced to the user as a confirmable ActionCard before any Stellar payment.
 */
import type { CurrencyCode } from "@/lib/types";

export interface PlanAllocation {
  label: string;
  destinationType: "member" | "vault" | "bill" | "school";
  amount: number;
  percentage?: number;
  memo: string;
  rail?: string;
}

export interface FamilyPlan {
  title: string;
  currency: CurrencyCode;
  total: number;
  allocations: PlanAllocation[];
  summary: string;
}

/**
 * Default monthly family plan used by the demo. In live mode the AI would
 * generate this from the user's actual family wallet + income context.
 */
export function generateMonthlyFamilyPlan(
  total = 7500,
  currency: CurrencyCode = "ZMW"
): FamilyPlan {
  const allocations: PlanAllocation[] = [
    { label: "Grace Mwila (Mum)", destinationType: "member", amount: 3000, memo: "FAMILY_SUPPORT_MOTHER", rail: "airtel" },
    { label: "Natasha — school fees vault", destinationType: "vault", amount: 2500, memo: "SCHOOL_FEES", },
    { label: "Family emergency vault", destinationType: "vault", amount: 1000, memo: "EMERGENCY_RESERVE" },
    { label: "House fund (10% auto-save)", destinationType: "vault", amount: 1000, percentage: 10, memo: "HOUSE_FUND_DEPOSIT" },
  ];
  return {
    title: "Monthly family finance plan",
    currency,
    total,
    allocations,
    summary:
      "Mosi will move value over Stellar into each destination — family support to mobile money as last-mile payout, and savings into Stellar goal vaults.",
  };
}

/** Lightweight intent detection for the demo agent. */
export function looksLikeFamilyPlan(message: string): boolean {
  return /take care of (my )?family|family.*(finance|money)|manage.*family|family.*plan/i.test(
    message
  );
}
