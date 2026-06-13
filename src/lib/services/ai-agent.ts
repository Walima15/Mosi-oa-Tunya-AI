/**
 * Mosi AI Financial Agent
 *
 * Architecture:
 *   User message
 *     → load profile + wallets + memories + recent transactions
 *     → LangChain agent (GPT-4o) with financial tools
 *     → structured actions (transfer, automation, savings, …)
 *     → persist messages + extract new memories
 *
 * When OPENAI_API_KEY is absent the agent returns curated demo responses
 * so the product is fully explorable without credentials.
 */
import { isAiConfigured, env } from "@/lib/config";
import type { AiMemory } from "@/lib/types";
import {
  buildTransferCard,
  buildAutomationCard,
  buildRateAlertCard,
  buildSavingsGoalCard,
  type ActionCard,
} from "@/lib/ai/tools";

export interface AgentContext {
  userId: string;
  userName: string;
  preferredCurrency: string;
  memories: AiMemory[];
  recentTransfers?: { amount: number; currency: string; to: string; date: string }[];
  savingsGoals?: { name: string; current: number; target: number }[];
  monthlyIncome?: number;
}

export interface AgentResponse {
  message: string;
  suggestedActions?: { label: string; action: string }[];
  /** Structured financial preview the UI renders as a confirmable card. */
  actionCard?: ActionCard;
  toolResults?: unknown[];
  memoriesExtracted?: { key: string; value: string; category: string }[];
}

const SYSTEM_PROMPT = `You are Mosi, the AI financial agent for Mosi-oa-Tunya AI — Africa's cross-border financial operating system.

Your personality: warm, knowledgeable, concise, and action-oriented. You speak like a trusted personal financial manager, not a bank chatbot.

Capabilities you can help with:
- Cross-border money transfers (USD, ZMW, ZAR, BWP, KES, TZS)
- Recurring family support and automations
- Savings goals and forecasting
- Exchange rate monitoring and conversion
- School fee payments
- Bill payments (electricity, water, internet, TV)
- Investment guidance (bonds, T-bills, agriculture, real estate, SMEs)
- Family budgeting and spending insights

When the user asks you to DO something (send money, create automation, save, etc.), confirm the details and tell them what you will set up. Be specific with amounts, dates, and beneficiaries.

When asked analytical questions (affordability, spending analysis), use the user's financial context to give data-driven answers.

Keep responses under 200 words unless the user asks for detail. Use the user's preferred currency when quoting amounts.

Remember: you are NOT a licensed financial advisor. For investment decisions, recommend they review official prospectuses.`;

/** Demo responses keyed by intent keywords. */
const DEMO_RESPONSES: { match: RegExp; response: AgentResponse }[] = [
  {
    match: /send.*(?:k|kwacha|5000|5,?000).*mother|mum|mom|grace/i,
    response: {
      message:
        "Here's the monthly support plan for Grace Mwila (Mum) — please review and confirm. I'll send it via Airtel Money on the 1st of each month.\n\nWant me to also save 10% of each transfer into your House Fund?",
      actionCard: buildAutomationCard({
        description: "Send K5,000 to Mum every month",
        trigger_kind: "schedule",
        cron: "0 9 1 * *",
        action_kind: "transfer",
        amount: 5000,
        currency: "ZMW",
        beneficiary: "Grace Mwila",
      }),
      suggestedActions: [
        { label: "Yes, save 10%", action: "create_savings_rule" },
        { label: "Set rate alert", action: "create_rate_alert" },
        { label: "View automation", action: "view_automation" },
      ],
      memoriesExtracted: [
        { key: "mother_name", value: "Grace Mwila", category: "family" },
        { key: "monthly_support_mum", value: "5000 ZMW", category: "family" },
      ],
    },
  },
  {
    match: /how much.*send.*(?:this year|home)/i,
    response: {
      message:
        "This year you've sent home **K68,400** across 14 transfers to 3 beneficiaries:\n\n• Grace Mwila (Mum) — K35,000 (7 transfers)\n• Joseph Mwila (Dad) — K21,000 (4 transfers)\n• Natasha Mwila — K12,400 (3 transfers, incl. school fees)\n\nThat's about **$2,494 USD** at an average rate of 27.42. You also auto-saved K6,840 (10%) into your goals.",
      suggestedActions: [
        { label: "Download report", action: "export_report" },
        { label: "Compare to last year", action: "compare_yoy" },
      ],
    },
  },
  {
    match: /afford.*(?:house|500,?000|lusaka)/i,
    response: {
      message:
        "Let's look at the numbers for a K500,000 house in Lusaka:\n\n**Your position:**\n• Monthly income: ~K18,400 ($670)\n• Current savings: K184,500 (House Fund)\n• Monthly auto-save: K3,500\n• Average transfers home: K5,200/mo\n\n**Forecast:** At K3,500/month savings, you'll reach K500,000 in **7.5 years** (Jan 2034). If you increase to K5,000/month, that's **5.3 years**.\n\nA mortgage at 14% over 20 years would mean ~K6,100/month — tight but possible if you reduce transfers by K2,000.\n\nI'd recommend continuing to save while monitoring rates. Want me to create an optimised savings plan?",
      suggestedActions: [
        { label: "Create optimised plan", action: "create_savings_plan" },
        { label: "Explore mortgage options", action: "explore_mortgage" },
        { label: "Adjust automations", action: "view_automations" },
      ],
    },
  },
  {
    match: /convert.*(?:dollar|usd).*(?:rate|27\.?5)/i,
    response: {
      message:
        "I can watch the market for you and auto-convert when USD/ZMW hits your target. Review the alert below.\n\nCurrent rate: 27.62 ✅ (already above your 27.5 target!)",
      actionCard: buildRateAlertCard({
        base: "USD",
        quote: "ZMW",
        target_rate: 27.5,
        direction: "above",
        auto_convert_amount: 1000,
      }),
      suggestedActions: [
        { label: "Convert now", action: "execute_conversion" },
        { label: "Wait for higher rate", action: "keep_alert" },
      ],
    },
  },
  {
    match: /school.*fee|pay.*(?:son|daughter|natasha)/i,
    response: {
      message:
        "Natasha's Term 3 fees at Rhodes Park School are **K14,000**, due September 1st.\n\nI can schedule an automatic payment on August 28th (3 days early) via Flutterwave. Last term you paid K14,000 on time — great track record!\n\nShall I set this up?",
      suggestedActions: [
        { label: "Schedule payment", action: "schedule_school_fee" },
        { label: "Pay now", action: "pay_school_fee_now" },
      ],
    },
  },
  {
    match: /save.*(?:10%|percent)/i,
    response: {
      message:
        "Great habit. Here's the savings rule — confirm and I'll route 10% of every transfer into your highest-priority goal (currently: Build a house in Lusaka).\n\nThis has already saved you K6,840 this year across 23 transfers.",
      actionCard: buildAutomationCard({
        description: "Save 10% of every transfer",
        trigger_kind: "condition",
        event: "transfer_sent",
        action_kind: "save",
        percentage: 10,
        currency: "ZMW",
      }),
      suggestedActions: [
        { label: "View savings progress", action: "view_savings" },
        { label: "Change percentage", action: "edit_automation" },
      ],
    },
  },
  {
    match: /(?:build|save).*(?:house|home).*(?:goal|save)|create.*savings goal/i,
    response: {
      message:
        "Let's turn that into a goal you can track. Review the plan below — I'll forecast your progress and nudge you along the way.",
      actionCard: buildSavingsGoalCard({
        name: "Build a house in Lusaka",
        target_amount: 500000,
        currency: "ZMW",
        monthly_contribution: 3500,
        target_date: "2030-12-01",
      }),
      suggestedActions: [
        { label: "Increase monthly", action: "edit_goal" },
        { label: "See forecast", action: "view_savings" },
      ],
    },
  },
];

/** Heuristic: parse a free-form "send X to Y" instruction into a transfer card. */
function tryParseTransfer(message: string): ActionCard | null {
  const m = message.match(
    /send\s+(?:k|usd|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:kwacha|zmw|usd|dollars?)?\s+to\s+([a-z][a-z\s']{1,30}?)(?:\s+(?:via|using|now|please|every|each)\b.*)?$/i
  );
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ""));
  if (!amount || amount <= 0) return null;
  const beneficiary = m[2].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const isUsd = /\$|usd|dollar/i.test(message);
  return buildTransferCard({
    beneficiary,
    amount,
    send_currency: isUsd ? "USD" : "ZMW",
    receive_currency: "ZMW",
    payment_rail: "airtel",
  });
}

function buildContextBlock(ctx: AgentContext): string {
  const lines = [
    `User: ${ctx.userName}`,
    `Preferred currency: ${ctx.preferredCurrency}`,
  ];
  if (ctx.monthlyIncome) lines.push(`Monthly income: ${ctx.preferredCurrency} ${ctx.monthlyIncome}`);
  if (ctx.memories.length) {
    lines.push("Known facts:");
    ctx.memories.forEach((m) => lines.push(`  - ${m.key}: ${m.value}`));
  }
  if (ctx.savingsGoals?.length) {
    lines.push("Savings goals:");
    ctx.savingsGoals.forEach((g) =>
      lines.push(`  - ${g.name}: ${g.current}/${g.target}`)
    );
  }
  return lines.join("\n");
}

/** Run the Mosi agent against a user message. */
export async function runAgent(
  userMessage: string,
  ctx: AgentContext,
  history: { role: string; content: string }[] = []
): Promise<AgentResponse> {
  // Demo mode — pattern-match curated responses
  if (!isAiConfigured) {
    for (const demo of DEMO_RESPONSES) {
      if (demo.match.test(userMessage)) return demo.response;
    }
    // Generic "send X to Y" → transfer preview card
    const transferCard = tryParseTransfer(userMessage);
    if (transferCard) {
      return {
        message: `Here's the transfer to ${transferCard.fields[0].value}. Review the details and confirm when you're ready.`,
        actionCard: transferCard,
        suggestedActions: [
          { label: "Make it recurring", action: "create_automation" },
          { label: "Save 10% too", action: "create_savings_rule" },
        ],
      };
    }
    return {
      message:
        "I'm Mosi, your AI financial agent. I can help you send money home, automate family support, save towards goals, pay bills and school fees, monitor exchange rates, and explore investments.\n\nTry asking me something like:\n• \"Send K5,000 to my mother every month\"\n• \"How much did I send home this year?\"\n• \"Can I afford a K500,000 house in Lusaka?\"",
      suggestedActions: [
        { label: "Send money", action: "start_transfer" },
        { label: "View savings", action: "view_savings" },
        { label: "Check rates", action: "view_rates" },
      ],
    };
  }

  // Live mode — LangChain + OpenAI
  const { ChatOpenAI } = await import("@langchain/openai");
  const { HumanMessage, SystemMessage, AIMessage } = await import("@langchain/core/messages");

  const llm = new ChatOpenAI({
    modelName: env.openaiModel,
    temperature: 0.4,
    openAIApiKey: env.openaiKey,
  });

  const messages = [
    new SystemMessage(SYSTEM_PROMPT + "\n\n--- User context ---\n" + buildContextBlock(ctx)),
    ...history.map((h) =>
      h.role === "user" ? new HumanMessage(h.content) : new AIMessage(h.content)
    ),
    new HumanMessage(userMessage),
  ];

  const result = await llm.invoke(messages);
  const content = typeof result.content === "string" ? result.content : JSON.stringify(result.content);

  return {
    message: content,
    actionCard: tryParseTransfer(userMessage) ?? undefined,
    suggestedActions: extractSuggestedActions(content),
  };
}

function extractSuggestedActions(text: string): { label: string; action: string }[] {
  // Simple heuristic — in production this would be structured output.
  const actions: { label: string; action: string }[] = [];
  if (/automation|schedule|recurring/i.test(text))
    actions.push({ label: "View automations", action: "view_automations" });
  if (/transfer|send/i.test(text))
    actions.push({ label: "Confirm transfer", action: "confirm_transfer" });
  if (/sav/i.test(text))
    actions.push({ label: "View savings", action: "view_savings" });
  return actions.slice(0, 3);
}
