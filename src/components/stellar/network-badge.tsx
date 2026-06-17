import { cn } from "@/lib/utils";

const NETWORK =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "public" ? "Public" : "Testnet";

/** Live Stellar network indicator with a pulsing dot. */
export function StellarNetworkBadge({
  className,
  label = "Stellar",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-2.5 py-1 text-[11px] font-medium text-cyan-accent",
        className
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-accent opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-cyan-accent" />
      </span>
      {label} · {NETWORK}
    </span>
  );
}
