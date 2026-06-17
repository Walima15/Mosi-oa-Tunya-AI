/**
 * Mosi AI — Financial Tool Layer
 *
 * The agent never executes money movement directly. Instead each tool produces
 * a structured ActionCard that the UI renders as a transaction preview. The
 * user must explicitly confirm before the action is executed via the relevant
 * API route / Server Action.
 *
 * In production these tool schemas are bound to the LangChain agent as
 * structured/function tools so GPT-4o can call them with validated arguments.
 * In demo mode the same builders power the scripted experience.
 */
import { z } from "zod";
import type { CurrencyCode } from "@/lib/types";

export type ToolName =
  | "create_transfer"
  | "create_automation"
  | "set_rate_alert"
  | "create_savings_goal"
  | "summarize_spending"
  | "estimate_fee"
  | "explain_transaction"
  // Stellar-native tools
  | "create_stellar_wallet"
  | "create_family_wallet"
  | "create_goal_vault"
  | "create_split_payment"
  | "create_path_payment"
  | "create_stellar_automation"
  | "explain_stellar_transaction"
  | "summarize_family_finance"
  | "generate_financial_plan";

/** A single labelled line inside an action card preview. */
export interface ActionField {
  label: string;
  value: string;
  emphasis?: boolean;
}

/**
 * Structured card returned to the chat UI. Financial actions set
 * `requiresConfirmation` so the UI shows a confirmation modal / preview before
 * calling the execution endpoint.
 */
/** A destination row in a split-payment preview. */
export interface SplitPreviewItem {
  label: string;
  amount: number;
  percentage?: number;
  memo: string;
  destinationType?: "member" | "vault" | "bill" | "school";
}

export interface ActionCard {
  tool: ToolName;
  title: string;
  summary: string;
  fields: ActionField[];
  requiresConfirmation: boolean;
  confirmLabel: string;
  /** Endpoint the UI calls when the user confirms. */
  executeEndpoint?: string;
  /** Validated payload passed to the execution endpoint. */
  payload?: Record<string, unknown>;
  intent?:
    | "transfer"
    | "automation"
    | "alert"
    | "savings"
    | "insight"
    | "stellar_wallet"
    | "family"
    | "vault"
    | "split"
    | "path"
    | "plan";
  /** Stellar-native presentation hints (rendered as chips on the card). */
  stellar?: boolean;
  network?: string;
  memo?: string;
  asset?: string;
  /** Multi-destination breakdown (split payments / family plans). */
  items?: SplitPreviewItem[];
}

const currency = z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]);

/* ──────────────────────────────────────────────────────────────
   Tool argument schemas (the "function signatures" the LLM sees)
   ────────────────────────────────────────────────────────────── */

export const toolSchemas = {
  create_transfer: z.object({
    beneficiary: z.string().describe("Name of the person receiving the money"),
    amount: z.number().positive(),
    send_currency: currency.default("USD"),
    receive_currency: currency.default("ZMW"),
    payment_rail: z
      .enum(["airtel", "mtn", "zamtel", "flutterwave", "paychangu"])
      .optional(),
    note: z.string().optional(),
  }),
  create_automation: z.object({
    description: z.string().describe("Natural-language description of the rule"),
    trigger_kind: z.enum(["schedule", "condition"]),
    cron: z.string().optional().describe("Cron expression for scheduled rules"),
    event: z.string().optional().describe("Event name for conditional rules"),
    action_kind: z.enum(["transfer", "save", "convert", "pay_bill"]),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    currency: currency.optional(),
    beneficiary: z.string().optional(),
  }),
  set_rate_alert: z.object({
    base: currency.default("USD"),
    quote: currency.default("ZMW"),
    target_rate: z.number().positive(),
    direction: z.enum(["above", "below"]).default("above"),
    auto_convert_amount: z.number().optional(),
  }),
  create_savings_goal: z.object({
    name: z.string(),
    target_amount: z.number().positive(),
    currency: currency.default("ZMW"),
    monthly_contribution: z.number().optional(),
    target_date: z.string().optional(),
  }),
  summarize_spending: z.object({
    period: z.enum(["this_month", "this_year", "last_30_days"]).default("this_year"),
    category: z.string().optional(),
  }),
  estimate_fee: z.object({
    amount: z.number().positive(),
    send_currency: currency.default("USD"),
    receive_currency: currency.default("ZMW"),
  }),
  explain_transaction: z.object({
    reference: z.string().optional(),
    transaction_id: z.string().optional(),
  }),
} as const;

/** OpenAI/LangChain-compatible tool descriptors (for live mode binding). */
export const toolDefinitions = [
  {
    name: "create_transfer",
    description:
      "Prepare a cross-border money transfer to a beneficiary. Requires user confirmation before execution.",
  },
  {
    name: "create_automation",
    description:
      "Create a recurring or conditional automation (e.g. monthly support, save 10% of every transfer).",
  },
  {
    name: "set_rate_alert",
    description:
      "Set an exchange-rate alert that can auto-convert funds when a target rate is reached.",
  },
  {
    name: "create_savings_goal",
    description: "Create a savings goal with a target amount and optional monthly contribution.",
  },
  {
    name: "summarize_spending",
    description: "Summarise how much the user has sent / spent over a period.",
  },
  {
    name: "estimate_fee",
    description: "Estimate the fee and recipient amount for a transfer without sending it.",
  },
  {
    name: "explain_transaction",
    description: "Explain the details and status of a specific transaction.",
  },
] as const;

/* ──────────────────────────────────────────────────────────────
   Action-card builders — turn validated args into a UI preview
   ────────────────────────────────────────────────────────────── */

const symbol: Record<CurrencyCode, string> = {
  USD: "$",
  ZMW: "K",
  ZAR: "R",
  BWP: "P",
  KES: "KSh",
  TZS: "TSh",
};

const FALLBACK_USD: Record<CurrencyCode, number> = {
  USD: 1,
  ZMW: 27.62,
  ZAR: 18.2,
  BWP: 13.6,
  KES: 129.0,
  TZS: 2510.0,
};

function fmt(amount: number, c: CurrencyCode) {
  return `${symbol[c]}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function rate(from: CurrencyCode, to: CurrencyCode) {
  if (from === to) return 1;
  return +(FALLBACK_USD[to] / FALLBACK_USD[from]).toFixed(4);
}

export function buildTransferCard(
  args: z.infer<typeof toolSchemas.create_transfer>
): ActionCard {
  const r = rate(args.send_currency, args.receive_currency);
  const feePercent = 0.5;
  const fee = +(args.amount * (feePercent / 100)).toFixed(2);
  const receive = +((args.amount - fee) * r).toFixed(2);
  return {
    tool: "create_transfer",
    intent: "transfer",
    title: "Confirm transfer",
    summary: `Send money to ${args.beneficiary}`,
    requiresConfirmation: true,
    confirmLabel: `Send ${fmt(args.amount, args.send_currency)}`,
    executeEndpoint: "/api/transfer",
    payload: { ...args, fee, receive_amount: receive, exchange_rate: r },
    fields: [
      { label: "Beneficiary", value: args.beneficiary, emphasis: true },
      { label: "You send", value: fmt(args.amount, args.send_currency) },
      { label: "Exchange rate", value: `1 ${args.send_currency} = ${r} ${args.receive_currency}` },
      { label: "Fee (0.5%)", value: fmt(fee, args.send_currency) },
      { label: "They receive", value: fmt(receive, args.receive_currency), emphasis: true },
      { label: "Payout", value: (args.payment_rail ?? "airtel").toUpperCase() },
      { label: "ETA", value: "~12 seconds · Stellar settlement" },
    ],
  };
}

export function buildAutomationCard(
  args: z.infer<typeof toolSchemas.create_automation>
): ActionCard {
  const fields: ActionField[] = [
    { label: "Rule", value: args.description, emphasis: true },
    { label: "Trigger", value: args.trigger_kind === "schedule" ? `Schedule (${args.cron ?? "monthly"})` : `When ${args.event ?? "condition met"}` },
    { label: "Action", value: args.action_kind.replace("_", " ") },
  ];
  if (args.amount) fields.push({ label: "Amount", value: fmt(args.amount, args.currency ?? "ZMW") });
  if (args.percentage) fields.push({ label: "Percentage", value: `${args.percentage}%` });
  if (args.beneficiary) fields.push({ label: "Beneficiary", value: args.beneficiary });
  return {
    tool: "create_automation",
    intent: "automation",
    title: "Create automation",
    summary: "Mosi will run this automatically",
    requiresConfirmation: true,
    confirmLabel: "Activate automation",
    executeEndpoint: "/api/automations",
    payload: { ...args },
    fields,
  };
}

export function buildRateAlertCard(
  args: z.infer<typeof toolSchemas.set_rate_alert>
): ActionCard {
  const fields: ActionField[] = [
    { label: "Pair", value: `${args.base}/${args.quote}`, emphasis: true },
    { label: "Trigger when", value: `${args.direction} ${args.target_rate}` },
  ];
  if (args.auto_convert_amount)
    fields.push({ label: "Auto-convert", value: fmt(args.auto_convert_amount, args.base) });
  return {
    tool: "set_rate_alert",
    intent: "alert",
    title: "Set rate alert",
    summary: `Watch ${args.base}/${args.quote}`,
    requiresConfirmation: true,
    confirmLabel: "Set alert",
    executeEndpoint: "/api/automations",
    payload: { ...args },
    fields,
  };
}

export function buildSavingsGoalCard(
  args: z.infer<typeof toolSchemas.create_savings_goal>
): ActionCard {
  const fields: ActionField[] = [
    { label: "Goal", value: args.name, emphasis: true },
    { label: "Target", value: fmt(args.target_amount, args.currency), emphasis: true },
  ];
  if (args.monthly_contribution)
    fields.push({ label: "Monthly", value: fmt(args.monthly_contribution, args.currency) });
  if (args.target_date) fields.push({ label: "By", value: args.target_date });
  if (args.monthly_contribution) {
    const months = Math.ceil(args.target_amount / args.monthly_contribution);
    fields.push({ label: "Forecast", value: `~${months} months at this rate` });
  }
  return {
    tool: "create_savings_goal",
    intent: "savings",
    title: "Create savings goal",
    summary: "Track progress towards what matters",
    requiresConfirmation: true,
    confirmLabel: "Create goal",
    executeEndpoint: "/api/savings",
    payload: { ...args },
    fields,
  };
}

export function buildFeeEstimateCard(
  args: z.infer<typeof toolSchemas.estimate_fee>
): ActionCard {
  const r = rate(args.send_currency, args.receive_currency);
  const fee = +(args.amount * 0.005).toFixed(2);
  const receive = +((args.amount - fee) * r).toFixed(2);
  return {
    tool: "estimate_fee",
    intent: "insight",
    title: "Fee estimate",
    summary: "No hidden FX margin — just 0.5%",
    requiresConfirmation: false,
    confirmLabel: "Send this transfer",
    executeEndpoint: "/api/transfer",
    payload: { ...args, fee, receive_amount: receive, exchange_rate: r },
    fields: [
      { label: "You send", value: fmt(args.amount, args.send_currency) },
      { label: "Fee (0.5%)", value: fmt(fee, args.send_currency) },
      { label: "Rate", value: `1 ${args.send_currency} = ${r} ${args.receive_currency}` },
      { label: "They receive", value: fmt(receive, args.receive_currency), emphasis: true },
    ],
  };
}

export const toolBuilders = {
  create_transfer: buildTransferCard,
  create_automation: buildAutomationCard,
  set_rate_alert: buildRateAlertCard,
  create_savings_goal: buildSavingsGoalCard,
  estimate_fee: buildFeeEstimateCard,
} as const;

/* ══════════════════════════════════════════════════════════════
   STELLAR-NATIVE TOOLS
   Every money-moving Stellar tool returns a confirmable ActionCard.
   ══════════════════════════════════════════════════════════════ */

const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public" ? "Public" : "Testnet";
const ASSET = process.env.NEXT_PUBLIC_SETTLEMENT_ASSET ?? "USDC";

export const stellarToolSchemas = {
  create_stellar_wallet: z.object({
    network: z.enum(["testnet", "public"]).default("testnet"),
    fund: z.boolean().default(true),
  }),
  create_family_wallet: z.object({
    name: z.string().default("My Family"),
    base_currency: currency.default("ZMW"),
    members: z
      .array(
        z.object({
          full_name: z.string(),
          relation: z.enum(["parent", "child", "spouse", "sibling", "dependent", "other"]),
          monthly_support: z.number().optional(),
        })
      )
      .optional(),
  }),
  create_goal_vault: z.object({
    name: z.string(),
    vault_type: z.enum(["house", "education", "emergency", "retirement", "school_fees", "general"]).default("general"),
    target_amount: z.number().positive(),
    currency: currency.default("ZMW"),
    monthly_contribution: z.number().optional(),
    target_date: z.string().optional(),
  }),
  create_split_payment: z.object({
    total: z.number().positive(),
    currency: currency.default("USD"),
    items: z.array(
      z.object({
        label: z.string(),
        percentage: z.number().optional(),
        amount: z.number().optional(),
        memo: z.string().optional(),
        destination_type: z.enum(["member", "vault", "bill", "school"]).default("member"),
      })
    ),
  }),
  create_path_payment: z.object({
    send_asset: z.string().default("USD"),
    send_amount: z.number().positive(),
    dest_asset: z.string().default("ZMW"),
    target_rate: z.number().optional(),
  }),
  create_stellar_automation: z.object({
    description: z.string(),
    trigger_kind: z.enum(["schedule", "condition"]),
    action_kind: z.enum(["transfer", "save", "convert", "pay_bill"]),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    currency: currency.optional(),
    memo_tag: z.string().optional(),
  }),
  generate_financial_plan: z.object({
    total: z.number().positive().default(7500),
    currency: currency.default("ZMW"),
  }),
} as const;

export const stellarToolDefinitions = [
  { name: "create_stellar_wallet", description: "Create a real Stellar wallet (keypair) for the user and fund it on testnet." },
  { name: "create_family_wallet", description: "Create a Stellar-backed Family Wallet with members and allocations." },
  { name: "create_goal_vault", description: "Create a Stellar Goal Vault for a savings target (house, education, emergency…)." },
  { name: "create_split_payment", description: "Split one remittance across multiple Stellar destinations (family, vaults, bills)." },
  { name: "create_path_payment", description: "Convert currency using a Stellar path payment for the best FX route." },
  { name: "create_stellar_automation", description: "Create a Stellar-executed automation rule (recurring transfer, save %, convert at rate)." },
  { name: "explain_stellar_transaction", description: "Explain a Stellar transaction: hash, asset, memo, fee, status." },
  { name: "summarize_family_finance", description: "Summarise family support and savings over a period." },
  { name: "generate_financial_plan", description: "Generate a full monthly family finance plan with Stellar allocations." },
] as const;

const baseStellar = { stellar: true as const, network: NETWORK, asset: ASSET };

export function buildStellarWalletCard(
  args: z.infer<typeof stellarToolSchemas.create_stellar_wallet>
): ActionCard {
  return {
    ...baseStellar,
    tool: "create_stellar_wallet",
    intent: "stellar_wallet",
    title: "Create your Stellar wallet",
    summary: "A real Stellar account secured for you",
    requiresConfirmation: true,
    confirmLabel: "Create Stellar wallet",
    executeEndpoint: "/api/stellar/wallet",
    payload: { ...args },
    fields: [
      { label: "Network", value: NETWORK, emphasis: true },
      { label: "Assets", value: `XLM + ${ASSET}` },
      { label: "Trustline", value: `${ASSET} (auto)` },
      { label: "Funding", value: args.fund ? "Friendbot test XLM" : "Manual" },
      { label: "Secret key", value: "Encrypted server-side · never shared" },
    ],
  };
}

export function buildFamilyWalletCard(
  args: z.infer<typeof stellarToolSchemas.create_family_wallet>
): ActionCard {
  const members = args.members ?? [
    { full_name: "Grace Mwila", relation: "parent", monthly_support: 5000 },
    { full_name: "Joseph Mwila", relation: "parent", monthly_support: 3000 },
    { full_name: "Natasha Mwila", relation: "child", monthly_support: 2500 },
  ];
  const total = members.reduce((s, m) => s + (m.monthly_support ?? 0), 0);
  return {
    ...baseStellar,
    tool: "create_family_wallet",
    intent: "family",
    title: "Create Family Wallet",
    summary: `${args.name} · ${members.length} members on Stellar`,
    requiresConfirmation: true,
    confirmLabel: "Create Family Wallet",
    executeEndpoint: "/api/family-wallet",
    payload: { ...args, members },
    fields: [
      { label: "Family", value: args.name, emphasis: true },
      { label: "Members", value: String(members.length) },
      { label: "Monthly support", value: `${args.base_currency} ${total.toLocaleString()}`, emphasis: true },
      { label: "Each member", value: "Mapped Stellar destination + memo" },
    ],
    items: members.map((m) => ({
      label: `${m.full_name} (${m.relation})`,
      amount: m.monthly_support ?? 0,
      memo: `FAMILY_SUPPORT_${m.relation.toUpperCase()}`,
      destinationType: "member" as const,
    })),
  };
}

export function buildGoalVaultCard(
  args: z.infer<typeof stellarToolSchemas.create_goal_vault>
): ActionCard {
  const fields: ActionField[] = [
    { label: "Vault", value: args.name, emphasis: true },
    { label: "Type", value: args.vault_type.replace("_", " ") },
    { label: "Target", value: `${args.currency} ${args.target_amount.toLocaleString()}`, emphasis: true },
  ];
  if (args.monthly_contribution) {
    fields.push({ label: "Monthly", value: `${args.currency} ${args.monthly_contribution.toLocaleString()}` });
    const months = Math.ceil(args.target_amount / args.monthly_contribution);
    fields.push({ label: "Forecast", value: `~${months} months to target` });
  }
  if (args.target_date) fields.push({ label: "By", value: args.target_date });
  fields.push({ label: "Backed by", value: `Stellar vault account` });
  return {
    ...baseStellar,
    tool: "create_goal_vault",
    intent: "vault",
    title: "Create Stellar Goal Vault",
    summary: "A Stellar-backed vault for your goal",
    requiresConfirmation: true,
    confirmLabel: "Create vault",
    executeEndpoint: "/api/goal-vaults",
    payload: { ...args },
    memo: "VAULT_DEPOSIT",
    fields,
  };
}

export function buildSplitPaymentCard(
  args: z.infer<typeof stellarToolSchemas.create_split_payment>
): ActionCard {
  const items: SplitPreviewItem[] = args.items.map((it) => ({
    label: it.label,
    percentage: it.percentage,
    amount: it.amount ?? +(((it.percentage ?? 0) / 100) * args.total).toFixed(2),
    memo: it.memo ?? "FAMILY_SUPPORT",
    destinationType: it.destination_type,
  }));
  return {
    ...baseStellar,
    tool: "create_split_payment",
    intent: "split",
    title: "Confirm Stellar split payment",
    summary: `Split ${args.currency} ${args.total.toLocaleString()} across ${items.length} Stellar destinations`,
    requiresConfirmation: true,
    confirmLabel: `Send & split ${args.currency} ${args.total.toLocaleString()}`,
    executeEndpoint: "/api/split-payments",
    payload: { ...args },
    fields: [
      { label: "Total", value: `${args.currency} ${args.total.toLocaleString()}`, emphasis: true },
      { label: "Destinations", value: String(items.length) },
      { label: "Settlement", value: `Stellar ${ASSET}` },
      { label: "Last-mile", value: "Mobile money payout" },
    ],
    items,
  };
}

export function buildPathPaymentCard(
  args: z.infer<typeof stellarToolSchemas.create_path_payment>
): ActionCard {
  const requiresConfirmation = !args.target_rate; // immediate convert needs confirm; alert is informational
  return {
    ...baseStellar,
    tool: "create_path_payment",
    intent: "path",
    title: args.target_rate ? "Set FX target (Stellar path)" : "Convert via Stellar path payment",
    summary: `${args.send_asset} → ${args.dest_asset} on Stellar's order book`,
    requiresConfirmation,
    confirmLabel: args.target_rate ? "Set FX alert" : "Convert now",
    executeEndpoint: args.target_rate ? "/api/fx-optimizer" : "/api/fx-optimizer/convert",
    payload: { ...args },
    memo: "FX_CONVERSION",
    fields: [
      { label: "Send", value: `${args.send_amount.toLocaleString()} ${args.send_asset}`, emphasis: true },
      { label: "Receive", value: args.dest_asset, },
      { label: "Route", value: `${args.send_asset} → ${ASSET} → ${args.dest_asset}` },
      ...(args.target_rate ? [{ label: "Target rate", value: String(args.target_rate) }] : []),
    ],
  };
}

export function buildStellarAutomationCard(
  args: z.infer<typeof stellarToolSchemas.create_stellar_automation>
): ActionCard {
  const fields: ActionField[] = [
    { label: "Rule", value: args.description, emphasis: true },
    { label: "Trigger", value: args.trigger_kind },
    { label: "Action", value: args.action_kind.replace("_", " ") },
    { label: "Executes on", value: "Stellar" },
  ];
  if (args.amount) fields.push({ label: "Amount", value: `${args.currency ?? "ZMW"} ${args.amount.toLocaleString()}` });
  if (args.percentage) fields.push({ label: "Percentage", value: `${args.percentage}%` });
  if (args.memo_tag) fields.push({ label: "Memo", value: args.memo_tag });
  return {
    ...baseStellar,
    tool: "create_stellar_automation",
    intent: "automation",
    title: "Create Stellar automation",
    summary: "Programmable money movement on Stellar",
    requiresConfirmation: true,
    confirmLabel: "Activate automation",
    executeEndpoint: "/api/automations",
    payload: { ...args },
    memo: args.memo_tag,
    fields,
  };
}

export function buildFamilyPlanCard(
  total: number,
  currency: CurrencyCode,
  allocations: { label: string; amount: number; memo: string; percentage?: number; destinationType?: SplitPreviewItem["destinationType"] }[]
): ActionCard {
  return {
    ...baseStellar,
    tool: "generate_financial_plan",
    intent: "plan",
    title: "Confirm family finance plan",
    summary: `Allocate ${currency} ${total.toLocaleString()} across family & Stellar vaults`,
    requiresConfirmation: true,
    confirmLabel: `Execute plan · ${currency} ${total.toLocaleString()}`,
    executeEndpoint: "/api/split-payments",
    payload: {
      total,
      currency,
      items: allocations.map((a) => ({
        label: a.label,
        amount: a.amount,
        memo: a.memo,
        destination_type: a.destinationType ?? "member",
      })),
    },
    fields: [
      { label: "Total", value: `${currency} ${total.toLocaleString()}`, emphasis: true },
      { label: "Legs", value: String(allocations.length) },
      { label: "Settlement", value: `Stellar ${ASSET}` },
      { label: "Payout", value: "Mobile money (last-mile)" },
    ],
    items: allocations.map((a) => ({
      label: a.label,
      amount: a.amount,
      percentage: a.percentage,
      memo: a.memo,
      destinationType: a.destinationType,
    })),
  };
}
