"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — brand story */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-aurora" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-30">
          <div className="animate-flow h-full w-full bg-[linear-gradient(110deg,transparent,rgba(0,212,255,0.15),transparent,rgba(212,175,55,0.12),transparent)] bg-[length:200%_100%]" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight">
            {BRAND.meaning}
          </h1>
          <p className="mt-4 text-lg text-muted">{BRAND.tagline}</p>
        </div>
        <p className="relative text-xs text-muted/60">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
