import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { settleTransfer } from "@/lib/services/settlement";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/data/user";
import { isSupabaseConfigured } from "@/lib/config";
import type { TxStatus } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  beneficiary: z.string().min(1),
  beneficiary_id: z.string().uuid().optional(),
  account: z.string().optional(),
  amount: z.number().positive(),
  send_currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("USD"),
  receive_currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("ZMW"),
  payment_rail: z
    .enum(["airtel", "mtn", "zamtel", "flutterwave", "paychangu", "stellar", "bank"])
    .optional(),
  note: z.string().optional(),
});

function toTxStatus(status: string): TxStatus {
  if (status === "paid_out") return "completed";
  if (status === "failed") return "failed";
  return "processing";
}

/**
 * Execute a confirmed cross-border transfer through the settlement engine,
 * then persist the transaction (and debit the sender wallet when funded) for
 * the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (isSupabaseConfigured && !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid transfer", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const a = parsed.data;

    const result = await settleTransfer({
      userId: userId ?? "demo-user",
      beneficiary: a.beneficiary,
      account: a.account,
      amount: a.amount,
      sendCurrency: a.send_currency,
      receiveCurrency: a.receive_currency,
      rail: a.payment_rail,
      note: a.note,
    });

    // Persist to the database for the authenticated user (RLS-scoped insert).
    if (userId) {
      const supabase = await createClient();
      const status = toTxStatus(result.status);

      await supabase.from("transactions").insert({
        user_id: userId,
        type: "transfer",
        status,
        beneficiary_id: a.beneficiary_id ?? null,
        send_currency: a.send_currency,
        send_amount: a.amount,
        receive_currency: a.receive_currency,
        receive_amount: result.receiveAmount,
        exchange_rate: result.exchangeRate,
        fee: result.fee,
        payment_rail: a.payment_rail ?? null,
        stellar_tx_hash: result.stellarTxHash || null,
        reference: result.reference,
        description: a.note ?? `Transfer to ${a.beneficiary}`,
        settled_at: status === "completed" ? new Date().toISOString() : null,
      });

      // Debit the sender's matching-currency wallet when it has enough balance.
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("currency", a.send_currency)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (wallet && Number(wallet.balance) >= a.amount && status !== "failed") {
        await supabase
          .from("wallets")
          .update({ balance: Number(wallet.balance) - a.amount })
          .eq("id", wallet.id);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/transfer]", err);
    return NextResponse.json({ error: "Settlement failed. Please try again." }, { status: 500 });
  }
}
