import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  className,
  size = 40,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-midnight-400 to-midnight-700 text-xs font-semibold text-gold ring-1 ring-white/10",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
