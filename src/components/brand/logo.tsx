import { cn } from "@/lib/utils";

/**
 * Mosi-oa-Tunya mark — abstract "smoke that thunders": three rising mist
 * streams over a falling water line. Stays global, avoids tribal clichés.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-9 w-9", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="moGold" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#F3DD8F" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A8862A" />
        </linearGradient>
        <linearGradient id="moCyan" x1="0" y1="0" x2="0" y2="48">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#1D3963" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="#071A35" />
      {/* rising mist */}
      <path
        d="M14 30c0-5 4-7 4-12M24 30c0-6 4-9 4-16M34 30c0-5 4-7 4-12"
        stroke="url(#moGold)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* falling water */}
      <path
        d="M11 30h26"
        stroke="url(#moCyan)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 34c2 3 6 3 8 0M26 34c2 3 6 3 8 0"
        stroke="url(#moCyan)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <div className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight">
            Mosi-oa-Tunya
          </span>
          <span className="block text-[10px] font-medium tracking-[0.3em] text-gold">
            AI
          </span>
        </div>
      )}
    </div>
  );
}
