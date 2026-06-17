import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { convertViaPath } from "@/lib/services/fx-optimizer";

export const runtime = "nodejs";

const schema = z.object({
  send_asset: z.string().default("USD"),
  send_amount: z.number().positive(),
  dest_asset: z.string().default("ZMW"),
});

/** Execute a Stellar path-payment conversion now and return a receipt. */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const result = await convertViaPath(
      data.send_asset as never,
      data.dest_asset as never,
      data.send_amount
    );
    return NextResponse.json({ status: "success", ...result });
  } catch (err) {
    console.error("[/api/fx-optimizer/convert]", err);
    return NextResponse.json({ error: "Could not convert via path payment." }, { status: 500 });
  }
}
