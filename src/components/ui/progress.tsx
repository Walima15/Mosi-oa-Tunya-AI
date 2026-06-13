import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "gold",
}: {
  value: number;
  className?: string;
  tone?: "gold" | "cyan" | "success";
}) {
  const tones = {
    gold: "from-gold-light to-gold",
    cyan: "from-cyan-accent to-[#0094ff]",
    success: "from-success to-emerald-400",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-700",
          tones[tone]
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
