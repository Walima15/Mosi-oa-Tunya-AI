import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWallet, deriveDestination } from "@/lib/stellar/wallet";
import { FamilyWallet } from "@/lib/stellar/contracts";
import { usdcSacAddress } from "@/lib/stellar/soroban";
import { explorerAccountUrl } from "@/lib/stellar/explorer";
import { ASSETS } from "@/lib/stellar/assets";
import type { ContractEvent } from "@/lib/stellar/soroban";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().default("My Family"),
  base_currency: z.enum(["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"]).default("ZMW"),
  members: z
    .array(
      z.object({
        full_name: z.string(),
        relation: z.enum(["parent", "child", "spouse", "sibling", "dependent", "other"]),
        monthly_support: z.number().optional(),
      })
    )
    .default([]),
});

/** Create a Soroban Family Wallet contract + register members with USDC allocations. */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json().catch(() => ({})));
    const account = await createWallet();
    const usdc = usdcSacAddress();

    const createResult = await FamilyWallet.create(account.publicKey, usdc);
    const events: ContractEvent[] = [...createResult.events];

    const members = [];
    for (const m of data.members) {
      const destination = await deriveDestination(`member:${m.full_name}`);
      const memberId = m.full_name.toLowerCase().replace(/\s+/g, "_").slice(0, 28);
      const addResult = await FamilyWallet.addMember(
        memberId,
        m.full_name,
        m.relation,
        destination,
        m.monthly_support ?? 0,
        m.relation === "parent"
      );
      events.push(...addResult.events);
      members.push({
        full_name: m.full_name,
        relation: m.relation,
        monthly_support: m.monthly_support ?? 0,
        stellar_destination: destination,
        memo_tag: `FAMILY_SUPPORT_${m.relation.toUpperCase()}`,
      });
    }

    const totalAllocated = members.reduce((s, m) => s + m.monthly_support, 0);

    return NextResponse.json({
      status: "success",
      name: data.name,
      stellarPublicKey: account.publicKey,
      explorerUrl: explorerAccountUrl(account.publicKey),
      baseCurrency: data.base_currency,
      totalAllocated,
      members,
      contractId: createResult.contractId,
      contractTxHash: createResult.txHash,
      contractEvents: events,
      settlementAsset: ASSETS.USDC.code,
      simulated: createResult.simulated,
    });
  } catch (err) {
    console.error("[/api/family-wallet]", err);
    return NextResponse.json({ error: "Could not create family wallet." }, { status: 500 });
  }
}
