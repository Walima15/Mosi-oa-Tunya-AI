import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { invokeContract, type ContractKind } from "@/lib/stellar/soroban";
import { CONTRACT_REGISTRY } from "@/lib/stellar/contracts";

export const runtime = "nodejs";

const invokeSchema = z.object({
  kind: z.enum(["family_wallet", "goal_vault", "split_payment", "automation"]),
  method: z.string(),
  args: z.record(z.unknown()).default({}),
});

/** Invoke a Soroban contract method. */
export async function POST(req: NextRequest) {
  try {
    const { kind, method, args } = invokeSchema.parse(await req.json());
    const result = await invokeContract(kind as ContractKind, method, args);
    return NextResponse.json({ status: "success", ...result });
  } catch (err) {
    console.error("[/api/soroban/invoke]", err);
    return NextResponse.json({ error: "Contract invocation failed." }, { status: 500 });
  }
}

/** List all registered contracts and their state. */
export async function GET() {
  try {
    const contracts = await Promise.all(
      CONTRACT_REGISTRY.map(async (c) => {
        const state = await c.getState();
        return {
          ...state,
          kind: c.kind,
          name: c.name,
          description: c.description,
          methods: c.methods,
          contractId: state.contractId || c.getId(),
        };
      })
    );
    return NextResponse.json({ status: "success", contracts });
  } catch (err) {
    console.error("[/api/soroban/invoke GET]", err);
    return NextResponse.json({ error: "Could not fetch contract state." }, { status: 500 });
  }
}
