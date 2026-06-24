/**
 * Server-side data-access layer. Every function reads the authenticated user's
 * own rows (RLS-scoped) from Supabase. Reference tables (rates, products) are
 * readable by any authenticated user. These power the real-time app UI.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import type {
  Wallet,
  Transaction,
  Beneficiary,
  SavingsGoal,
  Automation,
  InvestmentProduct,
  NotificationItem,
  CurrencyCode,
} from "@/lib/types";

type RateRow = { base: CurrencyCode; quote: CurrencyCode; rate: number };
export type HeldInvestment = InvestmentProduct & { held?: number; value?: number };

async function client() {
  return createClient();
}

export async function getWallets(): Promise<Wallet[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("wallets")
    .select("*")
    .order("is_primary", { ascending: false });
  return (data as Wallet[]) ?? [];
}

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Transaction[]) ?? [];
}

export async function getBeneficiaries(): Promise<Beneficiary[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("beneficiaries")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: true });
  return (data as Beneficiary[]) ?? [];
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as SavingsGoal[]) ?? [];
}

export async function getAutomations(): Promise<Automation[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("automations")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Automation[]) ?? [];
}

export async function getInvestmentProducts(): Promise<InvestmentProduct[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("investment_products")
    .select("*")
    .eq("active", true)
    .order("expected_roi", { ascending: false });
  return (data as InvestmentProduct[]) ?? [];
}

/** Products merged with the user's holdings (held principal + current value). */
export async function getInvestments(): Promise<HeldInvestment[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const [{ data: products }, { data: holdings }] = await Promise.all([
    supabase.from("investment_products").select("*").eq("active", true),
    supabase.from("investments").select("product_id, amount, current_value"),
  ]);

  const byProduct = new Map<string, { amount: number; value: number }>();
  for (const h of (holdings as { product_id: string; amount: number; current_value: number }[]) ?? []) {
    const prev = byProduct.get(h.product_id) ?? { amount: 0, value: 0 };
    byProduct.set(h.product_id, {
      amount: prev.amount + Number(h.amount),
      value: prev.value + Number(h.current_value),
    });
  }

  return ((products as InvestmentProduct[]) ?? []).map((p) => {
    const holding = byProduct.get(p.id);
    return holding ? { ...p, held: holding.amount, value: holding.value } : p;
  });
}

export async function getNotifications(limit = 10): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as NotificationItem[]) ?? [];
}

export async function getExchangeRates(): Promise<RateRow[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await client();
  const { data } = await supabase.from("exchange_rates").select("base, quote, rate");
  return (data as RateRow[]) ?? [];
}

/** Convert an amount in `from` currency to USD using the rate table. */
export function toUsd(amount: number, from: CurrencyCode, rates: RateRow[]): number {
  if (from === "USD") return amount;
  const direct = rates.find((r) => r.base === from && r.quote === "USD");
  if (direct) return amount * Number(direct.rate);
  const inverse = rates.find((r) => r.base === "USD" && r.quote === from);
  if (inverse && Number(inverse.rate) > 0) return amount / Number(inverse.rate);
  return amount; // no rate available — treat 1:1 rather than dropping the balance
}

/** Total of all wallet balances expressed in USD. */
export function totalBalanceUsd(wallets: Wallet[], rates: RateRow[]): number {
  return wallets.reduce((sum, w) => sum + toUsd(Number(w.balance), w.currency, rates), 0);
}

/** A human label for a wallet pocket. */
export function walletLabel(w: Wallet): string {
  if (w.type === "stablecoin") return `${w.currency} Stablecoin`;
  if (w.type === "savings") return `${w.currency} Savings`;
  if (w.currency === "ZMW") return "Kwacha Wallet";
  return `${w.currency} Wallet`;
}

/** Build a "current rate per pair" list for display from the rate table. */
export function ratePairs(rates: RateRow[]): { pair: string; rate: number }[] {
  return rates
    .filter((r) => r.base === "USD" || (r.base === "ZAR" && r.quote === "ZMW"))
    .map((r) => ({ pair: `${r.base} → ${r.quote}`, rate: Number(r.rate) }));
}
