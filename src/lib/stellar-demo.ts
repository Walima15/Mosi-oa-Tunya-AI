/**
 * Stellar demo dataset — powers every Stellar-native screen in demo mode.
 * Addresses are real-format Stellar public keys; hashes are real-format
 * 64-char hex so receipts and explorer chips look authentic to judges.
 */
import type {
  StellarWallet,
  FamilyWallet,
  GoalVault,
  SplitPayment,
  FxAlert,
  StellarAutomation,
  AutomationLog,
} from "./types";

export const DEMO_STELLAR_NETWORK = "testnet" as const;

// Real-format Stellar public keys (G... 56 chars)
const ADDR = {
  user: "GBQK4F2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K6L7M",
  family: "GCFAMILY7QK4F2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3HX",
  mother: "GDMOTHER2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K6LP",
  father: "GAFATHER5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K6L7M8NQ",
  child: "GBCHILD4F2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K7R",
  houseVault: "GCHOUSE2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K6L8S",
  eduVault: "GDEDUC7QK4F2VZH5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J9T",
  emergVault: "GAEMERG5G3J7Q5M2N6R8T9W3X4Y5Z6A7B8C9D0E1F2G3H4J5K6L7M8N0U",
} as const;

export const demoStellarWallet: StellarWallet = {
  id: "sw1",
  user_id: "demo-user",
  public_key: ADDR.user,
  network: "testnet",
  trustline_established: true,
  xlm_balance: 9842.5,
  usdc_balance: 1480.42,
  funded: true,
};

export const demoFamilyWallet: FamilyWallet = {
  id: "fw1",
  user_id: "demo-user",
  name: "Mwila Family",
  stellar_public_key: ADDR.family,
  base_currency: "ZMW",
  total_allocated: 11500,
  emergency_reserve: 5000,
  members: [
    { id: "fm1", family_wallet_id: "fw1", full_name: "Grace Mwila", relation: "parent", stellar_destination: ADDR.mother, payout_rail: "airtel", payout_account: "0971234567", monthly_support: 5000, emergency_support: true, memo_tag: "FAMILY_SUPPORT_MOTHER" },
    { id: "fm2", family_wallet_id: "fw1", full_name: "Joseph Mwila", relation: "parent", stellar_destination: ADDR.father, payout_rail: "mtn", payout_account: "0967654321", monthly_support: 3000, emergency_support: false, memo_tag: "FAMILY_SUPPORT_FATHER" },
    { id: "fm3", family_wallet_id: "fw1", full_name: "Natasha Mwila", relation: "child", stellar_destination: ADDR.child, payout_rail: "zamtel", payout_account: "0955556677", monthly_support: 2500, emergency_support: false, memo_tag: "SCHOOL_FEES" },
  ],
};

export const demoVaults: GoalVault[] = [
  { id: "v1", user_id: "demo-user", name: "Build a house in Lusaka", vault_type: "house", emoji: "🏠", stellar_public_key: ADDR.houseVault, target_amount: 500000, current_amount: 184500, currency: "ZMW", target_date: "2030-12-01", memo_tag: "HOUSE_FUND_DEPOSIT", status: "active" },
  { id: "v2", user_id: "demo-user", name: "Natasha's University", vault_type: "education", emoji: "🎓", stellar_public_key: ADDR.eduVault, target_amount: 120000, current_amount: 41000, currency: "ZMW", target_date: "2028-09-01", memo_tag: "EDUCATION_FUND_DEPOSIT", status: "active" },
  { id: "v3", user_id: "demo-user", name: "Family Emergency Fund", vault_type: "emergency", emoji: "🛟", stellar_public_key: ADDR.emergVault, target_amount: 30000, current_amount: 22400, currency: "ZMW", target_date: "2026-12-01", memo_tag: "EMERGENCY_RESERVE", status: "active" },
];

const hash = (s: string) =>
  Array.from({ length: 64 }, (_, i) => "0123456789abcdef"[(s.charCodeAt(i % s.length) + i * 7) % 16]).join("");

export const demoSplitPayments: SplitPayment[] = [
  {
    id: "sp1",
    user_id: "demo-user",
    total_amount: 300,
    currency: "USD",
    memo: "FAMILY_SUPPORT",
    status: "completed",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [
      { id: "spi1", label: "Grace Mwila (Mum)", destination_type: "member", stellar_destination: ADDR.mother, percentage: 60, amount: 180, currency: "USD", memo: "FAMILY_SUPPORT_MOTHER", stellar_tx_hash: hash("mother300"), status: "completed" },
      { id: "spi2", label: "School fees vault", destination_type: "vault", stellar_destination: ADDR.eduVault, percentage: 20, amount: 60, currency: "USD", memo: "SCHOOL_FEES", stellar_tx_hash: hash("school300"), status: "completed" },
      { id: "spi3", label: "Emergency vault", destination_type: "vault", stellar_destination: ADDR.emergVault, percentage: 10, amount: 30, currency: "USD", memo: "EMERGENCY_RESERVE", stellar_tx_hash: hash("emerg300"), status: "completed" },
      { id: "spi4", label: "House fund vault", destination_type: "vault", stellar_destination: ADDR.houseVault, percentage: 10, amount: 30, currency: "USD", memo: "HOUSE_FUND_DEPOSIT", stellar_tx_hash: hash("house300"), status: "completed" },
    ],
  },
];

export const demoFxAlerts: FxAlert[] = [
  { id: "fx1", user_id: "demo-user", base: "USD", quote: "ZMW", target_rate: 30.0, direction: "above", auto_convert: true, auto_convert_amount: 1000, triggered: false, status: "active" },
  { id: "fx2", user_id: "demo-user", base: "USD", quote: "ZMW", target_rate: 27.5, direction: "above", auto_convert: false, auto_convert_amount: null, triggered: true, status: "triggered" },
];

export const demoStellarAutomations: StellarAutomation[] = [
  { id: "sa1", user_id: "demo-user", name: "Monthly support · Mum", natural_language: "Send K5,000 to my mother every month", trigger: { kind: "schedule", cron: "0 9 1 * *" }, action: { kind: "transfer", amount: 5000, currency: "ZMW", memo_tag: "FAMILY_SUPPORT_MOTHER" }, status: "active", next_run_at: new Date(Date.now() + 9 * 86400000).toISOString(), run_count: 7 },
  { id: "sa2", user_id: "demo-user", name: "Save 10% into House Vault", natural_language: "Save 10% of every transfer into my house fund", trigger: { kind: "condition", event: "transfer_sent" }, action: { kind: "save", percentage: 10, currency: "ZMW", memo_tag: "HOUSE_FUND_DEPOSIT" }, status: "active", next_run_at: null, run_count: 23 },
  { id: "sa3", user_id: "demo-user", name: "Convert USD → ZMW at 30", natural_language: "Convert my dollars when USD/ZMW reaches 30", trigger: { kind: "condition", metric: "USD/ZMW", operator: ">=", value: 30 }, action: { kind: "convert", amount: 1000, currency: "USD", memo_tag: "FX_CONVERSION" }, status: "active", next_run_at: null, run_count: 0 },
  { id: "sa4", user_id: "demo-user", name: "Keep emergency vault ≥ K5,000", natural_language: "Keep my emergency vault above K5,000", trigger: { kind: "condition", metric: "emergency_vault", operator: "<", value: 5000 }, action: { kind: "save", amount: 1000, currency: "ZMW", memo_tag: "EMERGENCY_RESERVE" }, status: "paused", next_run_at: null, run_count: 2 },
];

export const demoAutomationLogs: AutomationLog[] = [
  { id: "al1", automation_id: "sa1", status: "success", detail: "Sent K5,000 to Grace Mwila via Airtel", stellar_tx_hash: hash("auto1run7"), amount: 5000, created_at: new Date(Date.now() - 9 * 86400000).toISOString() },
  { id: "al2", automation_id: "sa2", status: "success", detail: "Saved K710 (10% of K7,100) into House Vault", stellar_tx_hash: hash("auto2save"), amount: 710, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "al3", automation_id: "sa2", status: "success", detail: "Saved K540 (10% of K5,400) into House Vault", stellar_tx_hash: hash("auto2save2"), amount: 540, created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
];

/** Admin Stellar Monitor aggregate stats (demo). */
export const stellarMonitorStats = {
  totalTransactions: 18432,
  failedTransactions: 27,
  pendingSettlements: 9,
  totalVolumeUsd: 2_410_500,
  walletsCreated: 12847,
  vaultsActive: 5421,
  riskFlags: 4,
  payoutRails: [
    { name: "Airtel Money", status: "operational", latencyMs: 1100 },
    { name: "MTN MoMo", status: "operational", latencyMs: 1450 },
    { name: "Zamtel Kwacha", status: "operational", latencyMs: 1800 },
    { name: "Flutterwave", status: "operational", latencyMs: 900 },
    { name: "PayChangu", status: "degraded", latencyMs: 4200 },
  ],
  recentWalletCreations: [
    { name: "Amaka Okonkwo", publicKey: ADDR.user, at: "2m ago" },
    { name: "Tendai Moyo", publicKey: ADDR.father, at: "14m ago" },
    { name: "Fatima Hassan", publicKey: ADDR.mother, at: "38m ago" },
  ],
};

export const MEMO_TAGS = [
  "FAMILY_SUPPORT_MOTHER",
  "FAMILY_SUPPORT_FATHER",
  "FAMILY_SUPPORT",
  "SCHOOL_FEES_TERM_1",
  "SCHOOL_FEES",
  "HOUSE_FUND_DEPOSIT",
  "EDUCATION_FUND_DEPOSIT",
  "EMERGENCY_SUPPORT",
  "EMERGENCY_RESERVE",
  "SAVINGS_DEPOSIT",
  "PAYROLL_BATCH",
  "FX_CONVERSION",
] as const;

/* ── Soroban contract registry (demo) ─────────────────────────── */

function contractId(kind: string) {
  const h = (s: string) =>
    Array.from({ length: 55 }, (_, i) => "0123456789ABCDEF"[(s.charCodeAt(i % s.length) + i * 7) % 16]).join("");
  return "C" + h("soroban:" + kind);
}

export interface DemoSorobanContract {
  kind: "family_wallet" | "goal_vault" | "split_payment" | "automation";
  name: string;
  description: string;
  contractId: string;
  status: "active" | "paused" | "closed";
  usdcBalance: number;
  lastExecution: string;
  lastTxHash: string;
  methods: string[];
  simulated: boolean;
}

export interface DemoContractEvent {
  id: string;
  contractKind: DemoSorobanContract["kind"];
  contractId: string;
  eventName: string;
  data: string;
  txHash: string;
  timestamp: string;
  simulated: boolean;
}

export const demoSorobanContracts: DemoSorobanContract[] = [
  {
    kind: "family_wallet",
    name: "Family Wallet Contract",
    description: "Manage family allocations using Stellar USDC",
    contractId: contractId("family_wallet"),
    status: "active",
    usdcBalance: 15_000,
    lastExecution: new Date(Date.now() - 3_600_000).toISOString(),
    lastTxHash: hash("fw-exec"),
    methods: ["create_family_wallet", "add_family_member", "allocate_support", "release_support_payment", "emergency_release", "get_family_balance"],
    simulated: true,
  },
  {
    kind: "goal_vault",
    name: "Goal Vault Contract",
    description: "Lock and track USDC savings goals on-chain",
    contractId: contractId("goal_vault"),
    status: "active",
    usdcBalance: 247_850,
    lastExecution: new Date(Date.now() - 7_200_000).toISOString(),
    lastTxHash: hash("gv-deposit"),
    methods: ["create_goal_vault", "deposit_to_vault", "withdraw_from_vault", "get_vault_progress", "close_vault"],
    simulated: true,
  },
  {
    kind: "split_payment",
    name: "Split Payment Contract",
    description: "Split one USDC payment into multiple Stellar destinations",
    contractId: contractId("split_payment"),
    status: "active",
    usdcBalance: 0,
    lastExecution: new Date(Date.now() - 1_800_000).toISOString(),
    lastTxHash: hash("sp-split"),
    methods: ["create_split_rule", "execute_split_payment", "update_split_percentages", "get_split_history"],
    simulated: true,
  },
  {
    kind: "automation",
    name: "Automation Contract",
    description: "Store and execute programmable finance rules",
    contractId: contractId("automation"),
    status: "active",
    usdcBalance: 0,
    lastExecution: new Date(Date.now() - 86_400_000).toISOString(),
    lastTxHash: hash("auto-run"),
    methods: ["create_rule", "pause_rule", "resume_rule", "execute_rule", "get_rule_status"],
    simulated: true,
  },
];

export const demoContractEvents: DemoContractEvent[] = [
  { id: "ce1", contractKind: "split_payment", contractId: contractId("split_payment"), eventName: "split_executed", data: "300 USDC → 4 legs", txHash: hash("sp-split"), timestamp: new Date(Date.now() - 1_800_000).toISOString(), simulated: true },
  { id: "ce2", contractKind: "family_wallet", contractId: contractId("family_wallet"), eventName: "support_released", data: "500 USDC → Grace Mwila", txHash: hash("fw-release"), timestamp: new Date(Date.now() - 3_600_000).toISOString(), simulated: true },
  { id: "ce3", contractKind: "goal_vault", contractId: contractId("goal_vault"), eventName: "deposit", data: "1,000 USDC → House Fund", txHash: hash("gv-deposit"), timestamp: new Date(Date.now() - 7_200_000).toISOString(), simulated: true },
  { id: "ce4", contractKind: "automation", contractId: contractId("automation"), eventName: "rule_executed", data: "710 USDC → House Vault (10%)", txHash: hash("auto-run"), timestamp: new Date(Date.now() - 86_400_000).toISOString(), simulated: true },
  { id: "ce5", contractKind: "family_wallet", contractId: contractId("family_wallet"), eventName: "support_allocated", data: "2,000 USDC reserve funded", txHash: hash("fw-alloc"), timestamp: new Date(Date.now() - 172_800_000).toISOString(), simulated: true },
  { id: "ce6", contractKind: "goal_vault", contractId: contractId("goal_vault"), eventName: "deposit", data: "540 USDC → Education Fund", txHash: hash("gv-edu"), timestamp: new Date(Date.now() - 259_200_000).toISOString(), simulated: true },
];

/** Total USDC controlled across all Soroban contracts (demo). */
export const totalSorobanUsdc = demoSorobanContracts.reduce((s, c) => s + c.usdcBalance, 0);
