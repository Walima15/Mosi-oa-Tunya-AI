/**
 * Rich in-memory demo dataset. Powers the UI when Supabase credentials are
 * not configured, so the platform is fully explorable out of the box.
 */
import type {
  Transaction,
  Beneficiary,
  Automation,
  SavingsGoal,
  InvestmentProduct,
  NotificationItem,
} from "./types";

export const demoUser = {
  id: "demo-user",
  full_name: "Chanda Mwila",
  email: "chanda@mosioatunya.ai",
  role: "diaspora" as const,
  residence_country: "United Kingdom",
  country: "Zambia",
  preferred_currency: "ZMW" as const,
  kyc_status: "verified" as const,
  avatar_url: null,
};

export const demoWallets = [
  { currency: "USD" as const, balance: 4280.55, type: "fiat" as const, label: "USD Wallet" },
  { currency: "ZMW" as const, balance: 86420.0, type: "fiat" as const, label: "Kwacha Wallet" },
  { currency: "USD" as const, balance: 1200.0, type: "stablecoin" as const, label: "USDC Stablecoin" },
];

export const totalBalanceUsd = 7920.42;

export const demoBeneficiaries: Beneficiary[] = [
  { id: "b1", owner_id: "demo-user", full_name: "Grace Mwila", relation: "parent", phone: "+260 97 1234567", country: "Zambia", currency: "ZMW", payment_rail: "airtel", rail_account: "0971234567", monthly_support: 5000, is_favorite: true },
  { id: "b2", owner_id: "demo-user", full_name: "Joseph Mwila", relation: "parent", phone: "+260 96 7654321", country: "Zambia", currency: "ZMW", payment_rail: "mtn", rail_account: "0967654321", monthly_support: 3000, is_favorite: true },
  { id: "b3", owner_id: "demo-user", full_name: "Natasha Mwila", relation: "child", phone: "+260 95 5556677", country: "Zambia", currency: "ZMW", payment_rail: "zamtel", rail_account: "0955556677", monthly_support: 2500, is_favorite: false },
  { id: "b4", owner_id: "demo-user", full_name: "David Banda", relation: "sibling", phone: "+260 97 8889900", country: "Zambia", currency: "ZMW", payment_rail: "airtel", rail_account: "0978889900", monthly_support: 0, is_favorite: false },
];

const now = Date.now();
const day = 86400000;

export const demoTransactions: Transaction[] = [
  { id: "t1", user_id: "demo-user", type: "transfer", status: "completed", beneficiary_id: "b1", send_currency: "USD", send_amount: 182.5, receive_currency: "ZMW", receive_amount: 5000, exchange_rate: 27.4, fee: 0.91, payment_rail: "airtel", stellar_tx_hash: "a1b2…f9", reference: "MOT-7F3A9C1D2E", description: "Monthly support · Mum", created_at: new Date(now - 1 * day).toISOString(), settled_at: new Date(now - 1 * day + 11000).toISOString() },
  { id: "t2", user_id: "demo-user", type: "school_fee", status: "completed", send_currency: "USD", send_amount: 511.0, receive_currency: "ZMW", receive_amount: 14000, exchange_rate: 27.4, fee: 2.55, payment_rail: "flutterwave", reference: "MOT-2B8E4A7C1F", description: "Rhodes Park · Term 2 fees", created_at: new Date(now - 3 * day).toISOString() },
  { id: "t3", user_id: "demo-user", type: "savings_contribution", status: "completed", send_currency: "USD", send_amount: 200, receive_currency: "USD", receive_amount: 200, exchange_rate: 1, fee: 0, reference: "MOT-9D1C5E2A8B", description: "House fund · auto-save 10%", created_at: new Date(now - 4 * day).toISOString() },
  { id: "t4", user_id: "demo-user", type: "bill", status: "processing", send_currency: "ZMW", send_amount: 850, receive_currency: "ZMW", receive_amount: 850, exchange_rate: 1, fee: 0, payment_rail: "mtn", reference: "MOT-4A6F8C3D1E", description: "ZESCO electricity", created_at: new Date(now - 0.2 * day).toISOString() },
  { id: "t5", user_id: "demo-user", type: "transfer", status: "completed", beneficiary_id: "b2", send_currency: "USD", send_amount: 109.5, receive_currency: "ZMW", receive_amount: 3000, exchange_rate: 27.4, fee: 0.55, payment_rail: "mtn", reference: "MOT-1E7B9A2C4D", description: "Support · Dad", created_at: new Date(now - 8 * day).toISOString() },
  { id: "t6", user_id: "demo-user", type: "conversion", status: "completed", send_currency: "USD", send_amount: 1000, receive_currency: "ZMW", receive_amount: 27600, exchange_rate: 27.6, fee: 0, reference: "MOT-6C2D8E1A9B", description: "Converted at target rate 27.6", created_at: new Date(now - 12 * day).toISOString() },
];

export const demoAutomations: Automation[] = [
  { id: "a1", user_id: "demo-user", name: "Monthly support · Mum", status: "active", trigger: { kind: "schedule", cron: "0 9 1 * *" }, action: { kind: "transfer", amount: 5000, currency: "ZMW" }, beneficiary_id: "b1", natural_language: "Send K5,000 to my mother every month", next_run_at: new Date(now + 9 * day).toISOString(), run_count: 7 },
  { id: "a2", user_id: "demo-user", name: "Save 10% of every transfer", status: "active", trigger: { kind: "condition", event: "transfer_sent" }, action: { kind: "save", percentage: 10 }, natural_language: "Save 10% of every transfer", next_run_at: null, run_count: 23 },
  { id: "a3", user_id: "demo-user", name: "Convert when rate ≥ 27.5", status: "active", trigger: { kind: "condition", metric: "USD/ZMW", operator: ">=", value: 27.5 }, action: { kind: "convert", amount: 1000, currency: "USD" }, natural_language: "Convert my dollars when the rate beats 27.5", next_run_at: null, run_count: 1 },
  { id: "a4", user_id: "demo-user", name: "School fees · Term 3", status: "paused", trigger: { kind: "schedule", cron: "0 8 1 9 *" }, action: { kind: "pay_bill", amount: 14000, currency: "ZMW" }, natural_language: "Pay my daughter's school fees next term", next_run_at: new Date(now + 60 * day).toISOString(), run_count: 0 },
];

export const demoGoals: SavingsGoal[] = [
  { id: "g1", user_id: "demo-user", name: "Build a house in Lusaka", emoji: "🏠", target_amount: 500000, current_amount: 184500, currency: "ZMW", target_date: "2030-12-01", monthly_contribution: 3500, status: "active" },
  { id: "g2", user_id: "demo-user", name: "Emergency fund", emoji: "🛟", target_amount: 30000, current_amount: 22400, currency: "ZMW", target_date: "2026-12-01", monthly_contribution: 1500, status: "active" },
  { id: "g3", user_id: "demo-user", name: "Natasha's university", emoji: "🎓", target_amount: 120000, current_amount: 41000, currency: "ZMW", target_date: "2028-09-01", monthly_contribution: 2000, status: "active" },
];

export const demoInvestments: (InvestmentProduct & { held?: number; value?: number })[] = [
  { id: "i1", name: "Zambia Govt Bond 2029", category: "bonds", description: "Sovereign bond, semi-annual coupon.", expected_roi: 14.5, risk: "conservative", min_amount: 1000, term_months: 36, currency: "ZMW", held: 25000, value: 26810 },
  { id: "i2", name: "AgriYield Maize Fund", category: "agriculture", description: "Pooled smallholder maize financing.", expected_roi: 19, risk: "growth", min_amount: 2000, term_months: 12, currency: "ZMW", held: 15000, value: 16420 },
  { id: "i3", name: "Lusaka REIT", category: "real_estate", description: "Commercial real-estate income trust.", expected_roi: 16.3, risk: "balanced", min_amount: 5000, term_months: 24, currency: "ZMW" },
  { id: "i4", name: "91-Day Treasury Bill", category: "t_bills", description: "Short-term government paper.", expected_roi: 11.2, risk: "conservative", min_amount: 500, term_months: 3, currency: "ZMW" },
  { id: "i5", name: "SME Growth Notes", category: "sme", description: "Diversified SME working-capital notes.", expected_roi: 22, risk: "aggressive", min_amount: 3000, term_months: 18, currency: "ZMW" },
];

export const demoNotifications: NotificationItem[] = [
  { id: "n1", user_id: "demo-user", title: "Transfer delivered", body: "K5,000 reached Grace Mwila via Airtel Money in 11s.", category: "transfer", read: false, action_url: "/transactions", created_at: new Date(now - 0.05 * day).toISOString() },
  { id: "n2", user_id: "demo-user", title: "Rate alert", body: "USD/ZMW hit 27.6 — Mosi converted $1,000 as instructed.", category: "ai", read: false, action_url: "/automations", created_at: new Date(now - 0.5 * day).toISOString() },
  { id: "n3", user_id: "demo-user", title: "New device signed in", body: "iPhone 16 Pro · London, UK. Was this you?", category: "security", read: true, action_url: "/settings/security", created_at: new Date(now - 2 * day).toISOString() },
];

// Monthly transfer + savings series for dashboard charts
export const transferSeries = [
  { month: "Jan", sent: 4200, saved: 420 },
  { month: "Feb", sent: 5100, saved: 510 },
  { month: "Mar", sent: 4800, saved: 480 },
  { month: "Apr", sent: 6200, saved: 620 },
  { month: "May", sent: 5400, saved: 540 },
  { month: "Jun", sent: 7100, saved: 710 },
  { month: "Jul", sent: 6600, saved: 660 },
  { month: "Aug", sent: 8200, saved: 820 },
];

export const allocationSeries = [
  { name: "Family support", value: 42, color: "#D4AF37" },
  { name: "Savings", value: 23, color: "#00D4FF" },
  { name: "Investments", value: 18, color: "#22C55E" },
  { name: "Bills & fees", value: 17, color: "#3F5D8F" },
];

export const rateSeries = [
  { t: "9am", rate: 27.1 },
  { t: "11am", rate: 27.25 },
  { t: "1pm", rate: 27.4 },
  { t: "3pm", rate: 27.35 },
  { t: "5pm", rate: 27.55 },
  { t: "now", rate: 27.62 },
];

export const exchangeRates = [
  { pair: "USD → ZMW", rate: 27.62, change: 0.42 },
  { pair: "USD → ZAR", rate: 18.2, change: -0.12 },
  { pair: "USD → KES", rate: 129.0, change: 0.08 },
  { pair: "ZAR → ZMW", rate: 1.51, change: 0.21 },
];
