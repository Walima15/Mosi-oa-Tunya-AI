import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recommendFx } from "@/lib/services/fx-optimizer";

export const runtime = "nodejs";

const schema = z.object({
  send_asset: z.string().default("USD"),
  send_amount: z.number().positive().default(1000),
  dest_asset: z.string().default("ZMW"),
  target_rate: z.number().optional(),
  auto_convert: z.boolean().optional(),
});

/** Create / preview an FX rule and return the best Stellar path recommendation. */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json().catch(() => ({})));
    const rec = await recommendFx(
      data.send_asset as never,
      data.dest_asset as never,
      data.send_amount,
      data.target_rate
    );
    return NextResponse.json({
      status: "success",
      alert: {
        base: data.send_asset,
        quote: data.dest_asset,
        targetRate: data.target_rate ?? rec.currentRate,
        autoConvert: data.auto_convert ?? false,
        triggered: rec.recommendation === "convert_now",
      },
      recommendation: rec,
    });
  } catch (err) {
    console.error("[/api/fx-optimizer]", err);
    return NextResponse.json({ error: "Could not create FX rule." }, { status: 500 });
  }
}
