import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { settleTransfer } from "@/lib/services/settlement";

export const runtime = "nodejs";

const schema = z.object({
  beneficiary: z.string().min(1),
  account: z.string().optional(),
  amount: z.number().positive(),
  send_currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("USD"),
  receive_currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("ZMW"),
  payment_rail: z
    .enum(["airtel", "mtn", "zamtel", "flutterwave", "paychangu", "stellar", "bank"])
    .optional(),
  note: z.string().optional(),
});

/**
 * Execute a confirmed cross-border transfer through the settlement engine.
 * The AI agent never calls this directly — only the UI does, after the user
 * confirms the action card / transaction preview.
 */
export async function POST(req: NextRequest) {
  try {
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
      userId: "demo-user",
      beneficiary: a.beneficiary,
      account: a.account,
      amount: a.amount,
      sendCurrency: a.send_currency,
      receiveCurrency: a.receive_currency,
      rail: a.payment_rail,
      note: a.note,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/transfer]", err);
    return NextResponse.json({ error: "Settlement failed. Please try again." }, { status: 500 });
  }
}
