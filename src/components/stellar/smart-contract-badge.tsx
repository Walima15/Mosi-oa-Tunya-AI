import { cn } from "@/lib/utils";

/** Badge indicating a Soroban smart contract is involved. */
export function SmartContractBadge({
  className,
  label = "Soroban",
  status = "active",
}: {
  className?: string;
  label?: string;
  status?: "active" | "paused" | "simulated";
}) {
  const styles = {
    active: "border-purple-400/40 bg-purple-500/15 text-purple-300",
    paused: "border-gold/30 bg-gold/10 text-gold",
    simulated: "border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        styles[status],
        className
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3" fill="currentColor" aria-hidden>
        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" opacity="0.3" />
        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1ZM8 4L5 5.5V10.5L8 12L11 10.5V5.5L8 4Z" />
      </svg>
      {label}
      {status === "simulated" && <span className="opacity-70">· demo</span>}
    </span>
  );
}
