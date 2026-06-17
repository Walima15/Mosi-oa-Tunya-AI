/**
 * AI FX Optimizer.
 *
 * Sits on top of Stellar path payments. It tracks a target rate, recommends
 * whether to convert now or wait, and (on user permission) executes the best
 * route via a strict-send path payment.
 *
 * SERVER-ONLY.
 */
import {
  quotePathPayment,
  executePathPayment,
  type PathPaymentQuote,
} from "@/lib/stellar/path-payment";
import { receiptFromPathPayment, type StellarReceipt } from "@/lib/stellar/receipts";
import type { CurrencyCode } from "@/lib/types";

export interface FxRecommendation {
  quote: PathPaymentQuote;
  currentRate: number;
  targetRate?: number;
  recommendation: "convert_now" | "wait" | "set_alert";
  reason: string;
}

/** Recommend an action for a USD→local conversion given an optional target. */
export async function recommendFx(
  base: CurrencyCode,
  quoteCcy: CurrencyCode,
  amount: number,
  targetRate?: number
): Promise<FxRecommendation> {
  const q = await quotePathPayment(base, amount, quoteCcy);
  const currentRate = q.rate;

  let recommendation: FxRecommendation["recommendation"] = "set_alert";
  let reason: string;

  if (targetRate && currentRate >= targetRate) {
    recommendation = "convert_now";
    reason = `Current ${base}/${quoteCcy} rate ${currentRate} is at or above your ${targetRate} target. The best Stellar path improves the result by ${q.improvementPct}%.`;
  } else if (targetRate) {
    recommendation = "set_alert";
    reason = `Rate ${currentRate} is below your ${targetRate} target. I'll watch the Stellar order book and auto-convert via path payment when it's reached.`;
  } else {
    recommendation = "convert_now";
    reason = `Best Stellar path delivers ${q.destAmount} ${quoteCcy} (${q.improvementPct}% better than a naive conversion).`;
  }

  return { quote: q, currentRate, targetRate, recommendation, reason };
}

export interface FxConversionResult {
  receipt: StellarReceipt;
  quote: PathPaymentQuote;
}

/** Execute a path-payment conversion and return a receipt. */
export async function convertViaPath(
  base: CurrencyCode,
  quoteCcy: CurrencyCode,
  amount: number,
  source = "GMOSI_USER",
  destination = "GMOSI_LOCAL"
): Promise<FxConversionResult> {
  const result = await executePathPayment(base, amount, quoteCcy);
  return {
    receipt: receiptFromPathPayment(result, source, destination),
    quote: result,
  };
}
