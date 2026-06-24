import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGoalVault, depositToVault, forecastVault } from "@/lib/services/vault";
import { GoalVault } from "@/lib/stellar/contracts";
import { explorerAccountUrl } from "@/lib/stellar/explorer";
import { getUserId } from "@/lib/data/user";
import { isSupabaseConfigured } from "@/lib/config";
import type { VaultType } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string(),
  vault_type: z
    .enum(["house", "education", "emergency", "retirement", "school_fees", "general"])
    .default("general"),
  target_amount: z.number().positive(),
  currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("ZMW"),
  monthly_contribution: z.number().optional(),
  initial_deposit: z.number().optional(),
});

/** Create a Soroban Goal Vault (USDC) with optional opening deposit. */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (isSupabaseConfigured && !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const data = schema.parse(await req.json());

    const created = await createGoalVault({
      userId: userId ?? "demo-user",
      vaultName: data.name,
      vaultType: data.vault_type as VaultType,
      targetAmount: data.target_amount,
      currency: data.currency,
    });

    let deposit = null;
    if (data.initial_deposit && data.initial_deposit > 0) {
      deposit = await depositToVault({
        userId: userId ?? "demo-user",
        vaultName: data.name,
        vaultType: data.vault_type as VaultType,
        vaultAccount: created.stellarPublicKey,
        amount: data.initial_deposit,
        currency: data.currency,
      });
    }

    const progress = await GoalVault.getProgress().catch(() => 0);
    const forecast = forecastVault(
      data.target_amount,
      data.initial_deposit ?? 0,
      data.monthly_contribution ?? 0
    );

    return NextResponse.json({
      status: "success",
      name: data.name,
      vaultType: data.vault_type,
      stellarPublicKey: created.stellarPublicKey,
      explorerUrl: explorerAccountUrl(created.stellarPublicKey),
      targetAmount: data.target_amount,
      currency: data.currency,
      forecast: { ...forecast, onChainProgressPct: progress },
      contractId: created.contractId,
      contractEvents: [
        ...created.contractEvents,
        ...(deposit?.contractEvents ?? []),
      ],
      receipt: deposit?.receipt ?? null,
      settlementAsset: created.settlementAsset,
      simulated: created.simulated,
    });
  } catch (err) {
    console.error("[/api/goal-vaults]", err);
    return NextResponse.json({ error: "Could not create goal vault." }, { status: 500 });
  }
}
