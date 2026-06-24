import { NextRequest, NextResponse } from "next/server";
import { runAgent, type AgentContext } from "@/lib/services/ai-agent";
import { isSupabaseConfigured } from "@/lib/config";
import { getProfile } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";
import {
  demoUser,
  demoGoals,
  demoTransactions,
  demoBeneficiaries,
} from "@/lib/demo-data";

export const runtime = "nodejs";

async function buildContext(): Promise<AgentContext> {
  // Demo fallback when Supabase isn't configured.
  if (!isSupabaseConfigured) {
    return {
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
      savingsGoals: demoGoals.map((g) => ({ name: g.name, current: g.current_amount, target: g.target_amount })),
      monthlyIncome: 18400,
    };
  }

  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: txs }, { data: goals }, { data: memories }, { data: beneficiaries }] = await Promise.all([
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("savings_goals").select("name, current_amount, target_amount"),
    supabase.from("ai_memories").select("id, user_id, key, value, category, importance"),
    supabase.from("beneficiaries").select("id, full_name"),
  ]);

  const benMap = new Map((beneficiaries ?? []).map((b: { id: string; full_name: string }) => [b.id, b.full_name]));

  return {
    userId: profile?.id ?? "unknown",
    userName: profile?.full_name ?? "there",
    preferredCurrency: profile?.preferred_currency ?? "ZMW",
    memories: (memories ?? []) as AgentContext["memories"],
    recentTransfers: (txs ?? []).map((t: {
      receive_amount: number;
      receive_currency: string;
      beneficiary_id: string | null;
      created_at: string;
    }) => ({
      amount: Number(t.receive_amount),
      currency: t.receive_currency,
      to: t.beneficiary_id ? benMap.get(t.beneficiary_id) ?? "Unknown" : "Unknown",
      date: t.created_at,
    })) as AgentContext["recentTransfers"],
    savingsGoals: (goals ?? []).map((g: { name: string; current_amount: number; target_amount: number }) => ({
      name: g.name,
      current: Number(g.current_amount),
      target: Number(g.target_amount),
    })),
    monthlyIncome: undefined,
  };
}

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

    const ctx = await buildContext();
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
