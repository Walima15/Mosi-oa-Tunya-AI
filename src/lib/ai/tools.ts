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
  | "explain_transaction";

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
  intent?: "transfer" | "automation" | "alert" | "savings" | "insight";
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
