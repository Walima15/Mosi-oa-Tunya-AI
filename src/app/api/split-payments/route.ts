import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeSplit } from "@/lib/services/split";

export const runtime = "nodejs";

const schema = z.object({
  total: z.number().positive(),
  currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("USD"),
  items: z
    .array(
      z.object({
        label: z.string(),
        percentage: z.number().optional(),
        amount: z.number().optional(),
        memo: z.string().optional(),
        stellar_destination: z.string().optional(),
        destination_type: z.enum(["member", "vault", "bill", "school"]).default("member"),
      })
    )
    .min(1),
});

/** Execute a Stellar split payment — fan a remittance to many destinations. */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const result = await executeSplit({
      userId: "demo-user",
      total: data.total,
      currency: data.currency,
      items: data.items.map((it) => ({
        label: it.label,
        destinationType: it.destination_type,
        stellarDestination: it.stellar_destination,
        percentage: it.percentage,
        amount: it.amount,
        memo: it.memo,
      })),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/split-payments]", err);
    return NextResponse.json({ error: "Could not execute split payment." }, { status: 500 });
  }
}
