"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Bot,
  Send,
  Wallet,
  PiggyBank,
  TrendingUp,
  Users,
  GraduationCap,
  Receipt,
  Repeat,
  Building2,
  Shield,
  Settings,
  Menu,
  Bell,
  ChevronLeft,
  HeartHandshake,
  Vault,
  Split,
  ArrowLeftRight,
  ScrollText,
  Sparkles,
  FileCode,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/layout/demo-badge";
import { isDemoMode } from "@/lib/config";
import { cn } from "@/lib/utils";
import { demoUser } from "@/lib/demo-data";

const navGroups: {
  label?: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard; highlight?: boolean }[];
}[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/ai", label: "Mosi Agent", icon: Bot, highlight: true },
      { href: "/demo", label: "Demo Flow", icon: Sparkles, highlight: true },
    ],
  },
  {
    label: "Stellar",
    items: [
      { href: "/wallet", label: "Stellar Wallet", icon: Wallet },
      { href: "/family-wallet", label: "Family Wallet", icon: HeartHandshake },
      { href: "/goal-vaults", label: "Goal Vaults", icon: Vault },
      { href: "/split-payments", label: "Split Payments", icon: Split },
      { href: "/fx-optimizer", label: "FX Optimizer", icon: ArrowLeftRight },
      { href: "/stellar-receipts", label: "Receipts", icon: ScrollText },
      { href: "/smart-contracts", label: "Smart Contracts", icon: FileCode },
      { href: "/automations", label: "Automations", icon: Repeat },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/transfer", label: "Send Money", icon: Send },
      { href: "/savings", label: "Savings", icon: PiggyBank },
      { href: "/investments", label: "Investments", icon: TrendingUp },
      { href: "/family", label: "Family", icon: Users },
      { href: "/school-fees", label: "School Fees", icon: GraduationCap },
      { href: "/bills", label: "Bills", icon: Receipt },
      { href: "/business", label: "Business", icon: Building2 },
      { href: "/admin", label: "Admin", icon: Shield },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && <Logo />}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden rounded-lg p-1.5 text-muted hover:bg-white/5 lg:block"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
        {navGroups.map((group, gi) => (
          <div key={group.label ?? gi} className="space-y-1">
            {group.label && !collapsed && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? item.highlight
                        ? "bg-gradient-to-r from-gold/20 to-gold/5 text-gold"
                        : "bg-white/[0.06] text-foreground"
                      : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("size-[18px] shrink-0", item.highlight && active && "text-gold")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/[0.04] hover:text-foreground"
        >
          <Settings className="size-[18px]" />
          {!collapsed && "Settings"}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:px-6">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {isDemoMode && <DemoBadge className="hidden sm:inline-flex" />}
            <button className="relative rounded-full p-2 text-muted hover:bg-white/5 hover:text-foreground">
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cyan-accent" />
            </button>
            <div className="flex items-center gap-2.5">
              <Avatar name={demoUser.full_name} size={32} />
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{demoUser.full_name}</p>
                <p className="text-[11px] text-muted">Diaspora · Verified</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-aurora">{children}</main>
      </div>
    </div>
  );
}
