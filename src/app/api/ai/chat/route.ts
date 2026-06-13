import { NextRequest, NextResponse } from "next/server";
import { runAgent, type AgentContext } from "@/lib/services/ai-agent";
import { demoUser, demoGoals, demoTransactions, demoBeneficiaries } from "@/lib/demo-data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ctx: AgentContext = {
      userId: demoUser.id,
      userName: demoUser.full_name,
      preferredCurrency: demoUser.preferred_currency,
      memories: [
        { id: "m1", user_id: demoUser.id, key: "mother_name", value: "Grace Mwila", category: "family", importance: 5 },
        { id: "m2", user_id: demoUser.id, key: "monthly_income", value: "18400 ZMW", category: "income", importance: 4 },
      ],
      recentTransfers: demoTransactions.slice(0, 5).map((t) => ({
        amount: t.receive_amount,
        currency: t.receive_currency,
        to: demoBeneficiaries.find((b) => b.id === t.beneficiary_id)?.full_name ?? "Unknown",
        date: t.created_at,
      })),
      savingsGoals: demoGoals.map((g) => ({
        name: g.name,
        current: g.current_amount,
        target: g.target_amount,
      })),
      monthlyIncome: 18400,
    };

    const response = await runAgent(message, ctx, history);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/ai/chat]", err);
    return NextResponse.json(
      { error: "Agent unavailable. Please try again." },
      { status: 500 }
    );
  }
}
