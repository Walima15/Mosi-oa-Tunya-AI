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
  buildStellarWalletCard,
  buildFamilyWalletCard,
  buildGoalVaultCard,
  buildSplitPaymentCard,
  buildPathPaymentCard,
  buildFamilyPlanCard,
  type ActionCard,
} from "@/lib/ai/tools";
import { generateMonthlyFamilyPlan, looksLikeFamilyPlan } from "@/lib/services/family-finance";

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

const SYSTEM_PROMPT = `You are Mosi, the AI financial agent for Mosi-oa-Tunya AI — Africa's first autonomous family finance agent powered by Stellar.

Your personality: warm, knowledgeable, concise, and action-oriented. You speak like a trusted personal financial manager, not a bank chatbot.

Stellar is your financial backbone. Value moves as stablecoin over the Stellar network; mobile money (Airtel, MTN, Zamtel) is only the last-mile payout. You organize money using Stellar wallets, Family Wallets, Goal Vaults, split payments and path payments.

Capabilities:
- Create a real Stellar wallet for the user
- Create a Stellar Family Wallet (mother, father, child, dependents) with mapped Stellar destinations
- Create Stellar Goal Vaults (house, education, emergency, retirement, school fees)
- Split one remittance across many Stellar destinations (e.g. 60% mother, 20% school, 10% emergency, 10% house)
- Optimize FX using Stellar path payments and rate alerts
- Programmable Stellar automations (save 10% of every transfer, monthly support, convert at target rate)
- Tag every transfer with a Stellar memo describing its purpose (FAMILY_SUPPORT_MOTHER, SCHOOL_FEES, HOUSE_FUND_DEPOSIT, EMERGENCY_RESERVE)
- Family budgeting, spending insights, affordability analysis

When the user asks you to DO something, build a clear plan and present it for confirmation. NEVER move money without explicit user confirmation — you propose a confirmable ActionCard, the user confirms, and only then does Stellar execute.

Keep responses under 200 words unless asked for detail. Use the user's preferred currency when quoting amounts.

You are NOT a licensed financial advisor. For investments, recommend reviewing official prospectuses.`;

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

/**
 * Recognise Stellar-native intents and return a full agent response with a
 * confirmable ActionCard. This powers the judge-facing demo.
 */
function tryStellarIntent(message: string): AgentResponse | null {
  // 1. "Take care of my family's finances" → full family plan
  if (looksLikeFamilyPlan(message)) {
    const plan = generateMonthlyFamilyPlan(7500, "ZMW");
    return {
      message:
        "Here's a complete family finance plan for this month. I'll settle everything over Stellar — family support goes out as stablecoin and lands in mobile money, while savings flow into your Stellar Goal Vaults. Review and confirm and I'll execute it.",
      actionCard: buildFamilyPlanCard(
        plan.total,
        plan.currency,
        plan.allocations.map((a) => ({
          label: a.label,
          amount: a.amount,
          memo: a.memo,
          percentage: a.percentage,
          destinationType: a.destinationType,
        }))
      ),
      suggestedActions: [
        { label: "Adjust amounts", action: "edit_plan" },
        { label: "Add a family member", action: "add_member" },
      ],
    };
  }

  // 2. Split payment
  if (/split|divide|share.*between|60%|allocate.*between/i.test(message) && /\d/.test(message)) {
    const amt = Number((message.match(/\$?\s*([\d,]+)/)?.[1] ?? "300").replace(/,/g, ""));
    return {
      message:
        "I'll split this remittance across multiple Stellar destinations — each leg is its own Stellar payment with an intent memo, settled as stablecoin and delivered to mobile money as the last mile.",
      actionCard: buildSplitPaymentCard({
        total: amt,
        currency: "USD",
        items: [
          { label: "Grace Mwila (Mum)", percentage: 60, memo: "FAMILY_SUPPORT_MOTHER", destination_type: "member" },
          { label: "School fees vault", percentage: 20, memo: "SCHOOL_FEES", destination_type: "vault" },
          { label: "Emergency vault", percentage: 10, memo: "EMERGENCY_RESERVE", destination_type: "vault" },
          { label: "House fund vault", percentage: 10, memo: "HOUSE_FUND_DEPOSIT", destination_type: "vault" },
        ],
      }),
      suggestedActions: [{ label: "Change split", action: "edit_split" }],
    };
  }

  // 3. Create / set up family wallet
  if (/family wallet|set up.*family|create.*family/i.test(message)) {
    return {
      message:
        "Let's set up your Stellar Family Wallet. Each member gets a mapped Stellar destination and an intent memo, so support, school fees and emergencies are organised and traceable on-chain.",
      actionCard: buildFamilyWalletCard({ name: "Mwila Family", base_currency: "ZMW" }),
      suggestedActions: [{ label: "Add another member", action: "add_member" }],
    };
  }

  // 4. Create a Stellar wallet
  if (/(create|make|set up|open).*(stellar )?wallet/i.test(message)) {
    return {
      message:
        "I'll create a real Stellar wallet for you. Your secret key is encrypted server-side and never shared — you'll get an XLM balance, a USDC trustline, and a public address you can view on Stellar Expert.",
      actionCard: buildStellarWalletCard({ network: "testnet", fund: true }),
    };
  }

  // 5. Goal vaults — house / education / emergency
  if (/(build|buy).*(house|home)|house fund|education (fund|vault)|emergency (fund|vault)|retirement|create.*vault/i.test(message)) {
    const isHouse = /house|home/i.test(message);
    const isEdu = /educat|school|univers|college/i.test(message);
    const isEmerg = /emergency/i.test(message);
    const vault_type = isHouse ? "house" : isEdu ? "education" : isEmerg ? "emergency" : "general";
    const name = isHouse
      ? "Build a house in Lusaka"
      : isEdu
      ? "Education Fund"
      : isEmerg
      ? "Family Emergency Fund"
      : "Savings Vault";
    const target = isHouse ? 500000 : isEdu ? 120000 : isEmerg ? 30000 : 50000;
    return {
      message:
        "Great goal. I'll create a Stellar Goal Vault for it — a Stellar-backed account that tracks your progress and accepts deposits tagged with an intent memo. Confirm to create it.",
      actionCard: buildGoalVaultCard({
        name,
        vault_type: vault_type as "house" | "education" | "emergency" | "general",
        target_amount: target,
        currency: "ZMW",
        monthly_contribution: Math.round(target / 100),
      }),
      suggestedActions: [{ label: "Save 10% of transfers here", action: "auto_save" }],
    };
  }

  // 6. FX / convert when rate
  if (/convert.*(when|reach|hit|above|better)|fx|exchange rate.*target|path payment/i.test(message)) {
    const target = Number(message.match(/(\d{2}(?:\.\d+)?)/)?.[1] ?? "30");
    return {
      message:
        "I'll watch the Stellar order book and convert via a path payment for the best route. Here's the FX rule — confirm to set it.",
      actionCard: buildPathPaymentCard({
        send_asset: "USD",
        send_amount: 1000,
        dest_asset: "ZMW",
        target_rate: target,
      }),
      suggestedActions: [{ label: "Convert now instead", action: "convert_now" }],
    };
  }

  return null;
}

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
    // Stellar-native intents take priority
    const stellar = tryStellarIntent(userMessage);
    if (stellar) return stellar;

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

  // Attach a structured, confirmable card when the message implies an action.
  const stellar = tryStellarIntent(userMessage);
  return {
    message: content,
    actionCard: stellar?.actionCard ?? tryParseTransfer(userMessage) ?? undefined,
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
