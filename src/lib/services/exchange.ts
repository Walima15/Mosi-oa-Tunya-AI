/** FX rates + transfer quoting. */
import type { CurrencyCode } from "@/lib/types";

const FALLBACK_USD: Record<CurrencyCode, number> = {
  USD: 1,
  ZMW: 27.62,
  ZAR: 18.2,
  BWP: 13.6,
  KES: 129.0,
  TZS: 2510.0,
};

/** Get the rate to convert 1 unit of `from` into `to`. */
export async function getRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  // In production: fetch from exchange_rates table / provider with caching.
  if (from === to) return 1;
  const usdFrom = FALLBACK_USD[from];
  const usdTo = FALLBACK_USD[to];
  return usdTo / usdFrom;
}

export interface TransferQuote {
  sendAmount: number;
  sendCurrency: CurrencyCode;
  receiveAmount: number;
  receiveCurrency: CurrencyCode;
  rate: number;
  feePercent: number;
  fee: number;
  total: number;
  etaSeconds: number;
}

/** Mosi pricing: a transparent 0.5% fee, no hidden FX margin. */
export async function quoteTransfer(
  sendAmount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<TransferQuote> {
  const rate = await getRate(from, to);
  const feePercent = 0.5;
  const fee = +(sendAmount * (feePercent / 100)).toFixed(2);
  const receiveAmount = +((sendAmount - fee) * rate).toFixed(2);
  return {
    sendAmount,
    sendCurrency: from,
    receiveAmount,
    receiveCurrency: to,
    rate,
    feePercent,
    fee,
    total: +(sendAmount).toFixed(2),
    etaSeconds: 12,
  };
}
