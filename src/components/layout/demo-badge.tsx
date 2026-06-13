import { FlaskConical } from "lucide-react";

/**
 * Small indicator shown across the app when running in demo mode, so it's
 * always clear that integrations are simulated. Mirrors `isDemoMode` from
 * lib/config — kept as a client-free presentational component.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/25 bg-cyan-accent/10 px-2.5 py-1 text-[11px] font-medium text-cyan-accent ${className ?? ""}`}
      title="Stellar, mobile money & FX are simulated in demo mode"
    >
      <FlaskConical className="size-3" /> Demo
    </span>
  );
}
