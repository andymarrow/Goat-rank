"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, LayoutDashboard, ShieldCheck } from "lucide-react";

/**
 * Every destination here is a real route. The previous version linked
 * /explore and /activity, neither of which exists — both 404'd on tap.
 */
const TABS = [
  { href: "/", label: "Arena", icon: Home },
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
];

export default function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 w-full h-16 z-50 bg-background/90 backdrop-blur-lg
                 border-t border-border flex items-center justify-around px-2"
    >
      {TABS.slice(0, 1).map(({ href, label, icon: Icon }) => (
        <TabLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
      ))}

      {/* Centre action — raised, the primary thing we want people doing. */}
      <Link
        href="/create"
        aria-label="Host a battle"
        className="pressable relative -top-4 flex flex-col items-center group"
      >
        <div
          className="w-12 h-12 bg-primary rounded-full flex items-center justify-center
                     text-primary-foreground shadow-[0_8px_15px_rgba(255,122,0,0.4)]
                     group-hover:scale-105 transition-transform"
        >
          <Swords className="w-6 h-6" />
        </div>
      </Link>

      {TABS.slice(1).map(({ href, label, icon: Icon }) => (
        <TabLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
      ))}
    </nav>
  );
}

function TabLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof ShieldCheck;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`pressable flex flex-col items-center gap-1 p-2 transition-colors ${
        active ? "text-primary" : "text-foreground/60 hover:text-primary"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-arcade font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
