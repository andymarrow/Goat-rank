"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Swords, Hammer, Users, MessageSquare, Wallet, Settings,
  ArrowLeft, ShieldCheck, Smile,
} from "lucide-react";

const SECTIONS = [
  { href: "/admin", label: "God-Eye", icon: Activity, exact: true },
  { href: "/admin/arenas", label: "Arenas", icon: Swords },
  { href: "/admin/studio", label: "Studio", icon: Hammer },
  { href: "/admin/roster", label: "Roster", icon: Users, badge: "roster" },
  { href: "/admin/feed", label: "Feed", icon: MessageSquare },
  { href: "/admin/ledger", label: "Ledger", icon: Wallet, badge: "ledger" },
  { href: "/admin/avatars", label: "Avatars", icon: Smile },
  { href: "/admin/config", label: "Config", icon: Settings },
] as const;

/**
 * Admin navigation.
 *
 * Real links rather than tab state: each section is its own route now, so a
 * visit only loads that section's data instead of every query on the console.
 */
export default function AdminSidebar({
  adminName,
  badges,
}: {
  adminName: string;
  badges: { roster: number; ledger: number };
}) {
  const pathname = usePathname() ?? "/admin";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="lg:w-60 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 border-b lg:border-b-0
                 lg:border-r border-border bg-card flex flex-col"
    >
      <div className="corner-ticks relative px-4 py-4 lg:py-6 border-b border-border overflow-hidden">
        <div className="tex-grid absolute inset-0 pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-arcade text-[9px] uppercase tracking-[0.2em] text-foreground/50">
            Restricted
          </span>
        </div>
        <p className="relative font-arcade font-black uppercase tracking-wider text-xl lg:text-2xl text-foreground">
          GOD<span className="text-primary italic"> MODE</span>
        </p>
        <p className="relative mt-0.5 text-[11px] text-foreground/45 font-sans truncate">
          {adminName}
        </p>
      </div>

      <nav
        aria-label="Admin sections"
        className="flex lg:flex-col gap-1 p-2 overflow-x-auto lg:overflow-x-visible
                   lg:overflow-y-auto scrollbar-hide lg:flex-1"
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = isActive(s.href, "exact" in s ? s.exact : false);
          const count = "badge" in s ? badges[s.badge as keyof typeof badges] : 0;

          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`pressable relative shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5
                cut-corner font-arcade text-[10px] font-bold uppercase tracking-widest
                transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/55 hover:text-foreground hover:bg-foreground/5"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{s.label}</span>

              {count > 0 && (
                <span
                  className={`ml-auto cut-corner px-1.5 py-0.5 text-[9px] tabular-nums ${
                    active ? "bg-black/25" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block p-2 border-t border-border">
        <Link
          href="/"
          className="pressable w-full flex items-center gap-2.5 px-3 py-2.5 cut-corner
                     font-arcade text-[10px] font-bold uppercase tracking-widest
                     text-foreground/55 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Live site
        </Link>
      </div>
    </aside>
  );
}
