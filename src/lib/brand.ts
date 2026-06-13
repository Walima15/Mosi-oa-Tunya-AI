/** Central brand + product constants for Mosi-oa-Tunya AI. */

export const BRAND = {
  name: "Mosi-oa-Tunya AI",
  shortName: "Mosi",
  meaning: "The Smoke That Thunders",
  tagline:
    "Making money move across Africa as freely as water flows over Victoria Falls.",
  description:
    "Africa's AI-powered cross-border financial operating system. Send money home, automate family finances, save, invest and talk to your personal AI financial agent.",
  colors: {
    midnight: "#071A35",
    gold: "#D4AF37",
    white: "#FFFFFF",
    cyan: "#00D4FF",
    success: "#22C55E",
  },
} as const;

export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "K", flag: "🇿🇲" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", flag: "🇧🇼" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
] as const;

export const PAYMENT_PROVIDERS = [
  { id: "airtel", name: "Airtel Money", type: "mobile_money" },
  { id: "mtn", name: "MTN Mobile Money", type: "mobile_money" },
  { id: "zamtel", name: "Zamtel Kwacha", type: "mobile_money" },
  { id: "flutterwave", name: "Flutterwave", type: "aggregator" },
  { id: "paychangu", name: "PayChangu", type: "aggregator" },
] as const;

export const USER_ROLES = [
  "diaspora",
  "recipient",
  "business",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
