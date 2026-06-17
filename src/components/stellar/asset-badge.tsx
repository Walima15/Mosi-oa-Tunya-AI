import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  XLM: "border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent",
  USDC: "border-[#2775CA]/40 bg-[#2775CA]/15 text-[#5AA0EE]",
  USD: "border-success/30 bg-success/10 text-success",
  ZMW: "border-gold/30 bg-gold/10 text-gold",
  ZAR: "border-gold/30 bg-gold/10 text-gold",
  KES: "border-gold/30 bg-gold/10 text-gold",
  BWP: "border-gold/30 bg-gold/10 text-gold",
  TZS: "border-gold/30 bg-gold/10 text-gold",
};

export function AssetBadge({ code, className }: { code: string; className?: string }) {
  const style = STYLES[code] ?? "border-white/15 bg-white/5 text-foreground/80";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        style,
        className
      )}
    >
      {code}
    </span>
  );
}
