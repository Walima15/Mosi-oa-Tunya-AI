import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes intelligently. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a monetary amount with currency code. */
export function formatMoney(
  amount: number,
  currency = "ZMW",
  opts: Intl.NumberFormatOptions = {}
) {
  const symbols: Record<string, string> = {
    ZMW: "K",
    USD: "$",
    ZAR: "R",
    BWP: "P",
    KES: "KSh",
    TZS: "TSh",
  };
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(amount);
  return `${symbols[currency] ?? currency + " "}${formatted}`;
}

/** Compact money for KPI tiles (e.g. K12.4k). */
export function formatCompact(amount: number, currency = "ZMW") {
  const symbols: Record<string, string> = {
    ZMW: "K",
    USD: "$",
    ZAR: "R",
    BWP: "P",
    KES: "KSh",
    TZS: "TSh",
  };
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
  return `${symbols[currency] ?? currency + " "}${formatted}`;
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
