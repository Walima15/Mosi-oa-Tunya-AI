/**
 * Payment rail adapters — Airtel Money, MTN MoMo, Zamtel Kwacha,
 * Flutterwave, PayChangu.
 *
 * Each adapter implements a common interface so the settlement engine can
 * route payouts without caring about the underlying provider.
 */
import type { CurrencyCode, PaymentRail } from "@/lib/types";

export interface PayoutRequest {
  rail: PaymentRail;
  account: string; // mobile number or bank account
  amount: number;
  currency: CurrencyCode;
  reference: string;
  beneficiaryName: string;
  country?: string;
}

export interface PayoutResult {
  success: boolean;
  providerRef: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  simulated: boolean;
}

export interface RailAdapter {
  id: PaymentRail;
  name: string;
  supportedCurrencies: CurrencyCode[];
  payout(req: PayoutRequest): Promise<PayoutResult>;
}

/** Airtel Money (Zambia, Kenya, Tanzania, …) */
const airtel: RailAdapter = {
  id: "airtel",
  name: "Airtel Money",
  supportedCurrencies: ["ZMW", "KES", "TZS"],
  async payout(req) {
    const key = process.env.AIRTEL_MONEY_CLIENT_ID;
    if (!key) return simulate("airtel", req);
    // TODO: POST /standard/v1/disbursements with OAuth token
    return simulate("airtel", req);
  },
};

/** MTN Mobile Money */
const mtn: RailAdapter = {
  id: "mtn",
  name: "MTN Mobile Money",
  supportedCurrencies: ["ZMW", "ZAR"],
  async payout(req) {
    if (!process.env.MTN_MOMO_SUBSCRIPTION_KEY) return simulate("mtn", req);
    return simulate("mtn", req);
  },
};

/** Zamtel Kwacha */
const zamtel: RailAdapter = {
  id: "zamtel",
  name: "Zamtel Kwacha",
  supportedCurrencies: ["ZMW"],
  async payout(req) {
    if (!process.env.ZAMTEL_KWACHA_API_KEY) return simulate("zamtel", req);
    return simulate("zamtel", req);
  },
};

/** Flutterwave (aggregator — bank + mobile money) */
const flutterwave: RailAdapter = {
  id: "flutterwave",
  name: "Flutterwave",
  supportedCurrencies: ["USD", "ZMW", "ZAR", "KES", "TZS", "BWP"],
  async payout(req) {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) return simulate("flutterwave", req);
    return simulate("flutterwave", req);
  },
};

/** PayChangu (Zambia-focused aggregator) */
const paychangu: RailAdapter = {
  id: "paychangu",
  name: "PayChangu",
  supportedCurrencies: ["ZMW", "USD"],
  async payout(req) {
    if (!process.env.PAYCHANGU_SECRET_KEY) return simulate("paychangu", req);
    return simulate("paychangu", req);
  },
};

const adapters: Record<PaymentRail, RailAdapter> = {
  airtel,
  mtn,
  zamtel,
  flutterwave,
  paychangu,
  stellar: {
    id: "stellar",
    name: "Stellar",
    supportedCurrencies: ["USD"],
    async payout(req) {
      return simulate("stellar", req);
    },
  },
  bank: {
    id: "bank",
    name: "Bank Transfer",
    supportedCurrencies: ["USD", "ZMW", "ZAR", "BWP", "KES", "TZS"],
    async payout(req) {
      return simulate("bank", req);
    },
  },
};

export function getAdapter(rail: PaymentRail): RailAdapter {
  return adapters[rail];
}

export async function executePayout(req: PayoutRequest): Promise<PayoutResult> {
  const adapter = getAdapter(req.rail);
  if (!adapter.supportedCurrencies.includes(req.currency)) {
    return {
      success: false,
      providerRef: "",
      status: "failed",
      message: `${adapter.name} does not support ${req.currency}`,
      simulated: false,
    };
  }
  return adapter.payout(req);
}

function simulate(rail: PaymentRail, req: PayoutRequest): PayoutResult {
  return {
    success: true,
    providerRef: `${rail.toUpperCase()}-${req.reference}`,
    status: "completed",
    message: `Simulated payout via ${rail}`,
    simulated: true,
  };
}
