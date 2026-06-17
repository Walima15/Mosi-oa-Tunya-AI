import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Automation } from "@/lib/stellar/contracts";
import { usdcSacAddress } from "@/lib/stellar/soroban";
import { createWallet } from "@/lib/stellar/wallet";
import { ASSETS } from "@/lib/stellar/assets";

export const runtime = "nodejs";

const schema = z.object({
  description: z.string().optional(),
  name: z.string().optional(),
  trigger_kind: z.enum(["schedule", "condition"]).optional(),
  action_kind: z.enum(["transfer", "save", "convert", "pay_bill"]).optional(),
  amount: z.number().optional(),
  percentage: z.number().optional(),
  currency: z.string().optional(),
  memo_tag: z.string().optional(),
});

/** Create a Soroban automation rule that executes programmable USDC finance. */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json().catch(() => ({})));
    const id = "rule-" + Math.random().toString(36).slice(2, 8);
    const wallet = await createWallet();
    const usdc = usdcSacAddress();

    await Automation.init(wallet.publicKey, usdc);
    const result = await Automation.createRule(
      id,
      data.trigger_kind ?? "schedule",
      data.action_kind ?? "transfer",
      wallet.publicKey,
      data.amount ?? 0,
      data.percentage ? Math.round(data.percentage * 100) : 0
    );

    return NextResponse.json({
      status: "success",
      automation: {
        id,
        name: data.name ?? data.description ?? "New automation",
        natural_language: data.description,
        trigger: { kind: data.trigger_kind ?? "schedule" },
        action: {
          kind: data.action_kind ?? "transfer",
          amount: data.amount,
          percentage: data.percentage,
          currency: data.currency,
          memo_tag: data.memo_tag,
        },
        status: "active",
        run_count: 0,
        executesOn: "Soroban",
      },
      contractId: result.contractId,
      contractTxHash: result.txHash,
      contractEvents: result.events,
      settlementAsset: ASSETS.USDC.code,
      simulated: result.simulated,
    });
  } catch (err) {
    console.error("[/api/automations]", err);
    return NextResponse.json({ error: "Could not create automation." }, { status: 500 });
  }
}
