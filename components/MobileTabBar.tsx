"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home, Swords, LayoutDashboard, Trophy, MoreHorizontal,
  ShieldCheck, Sun, Moon, LogIn, LogOut, X, HeartHandshake, Shield, FileText,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ? { id: user.id } : null);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(Boolean(data?.is_admin));
      } else {
        setIsAdmin(false);
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close the sheet on navigation.
  useEffect(() => setSheetOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Overflow sheet — everything the five slots can't hold */}
      {sheetOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setSheetOpen(false)}
            className="md:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-label="More options"
            className="md:hidden fixed bottom-16 inset-x-0 z-[56] bg-card border-t border-border
                       p-4 pb-6 flex flex-col gap-2 shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50">
                More
              </span>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="pressable w-full flex items-center gap-3 px-3 py-3 bg-background border border-border
                           cut-corner font-arcade text-xs uppercase tracking-widest text-foreground/80"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            )}

            {mounted && isAdmin && (
              <SheetLink href="/admin" icon={<ShieldCheck className="w-4 h-4" />} label="Admin console" />
            )}

            {/* The footer is desktop-only, so its links live here. */}
            <div className="pt-2 mt-1 border-t border-border flex flex-col gap-2">
              <SheetLink
                href="/legal/money"
                icon={<HeartHandshake className="w-4 h-4" />}
                label="Where the money goes"
              />
              <SheetLink href="/legal/privacy" icon={<Shield className="w-4 h-4" />} label="Privacy" />
              <SheetLink href="/legal/terms" icon={<FileText className="w-4 h-4" />} label="Terms" />
            </div>

            {mounted &&
              (user ? (
                <button
                  onClick={async () => {
                    await createClient().auth.signOut();
                    window.location.href = "/";
                  }}
                  className="pressable w-full flex items-center gap-3 px-3 py-3 bg-background border border-border
                             cut-corner font-arcade text-xs uppercase tracking-widest text-battle-red"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              ) : (
                <SheetLink href="/login" icon={<LogIn className="w-4 h-4" />} label="Sign in" />
              ))}
          </div>
        </>
      )}

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 z-[57] bg-background/95 backdrop-blur-lg
                   border-t border-border grid grid-cols-5 items-center
                   pb-[env(safe-area-inset-bottom)]"
      >
        <Tab href="/" label="Arena" icon={<Home className="w-5 h-5" />} active={isActive("/")} />
        <Tab
          href="/dashboard"
          label="Command"
          icon={<LayoutDashboard className="w-5 h-5" />}
          active={isActive("/dashboard")}
        />

        {/* Centre action, raised out of the bar */}
        <Link
          href="/create"
          aria-label="Host a battle"
          className="pressable relative -top-5 mx-auto flex flex-col items-center group"
        >
          <span
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center
                       text-primary-foreground shadow-[0_6px_16px_rgba(255,122,0,0.45)]
                       group-active:scale-95 transition-transform"
          >
            <Swords className="w-6 h-6" />
          </span>
        </Link>

        <Tab
          href="/profile"
          label="Ranks"
          icon={<Trophy className="w-5 h-5" />}
          active={isActive("/profile")}
        />

        <button
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          aria-label="More options"
          className={`pressable flex flex-col items-center gap-1 py-2 transition-colors ${
            sheetOpen ? "text-primary" : "text-foreground/60"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-arcade font-bold uppercase tracking-wider">More</span>
        </button>
      </nav>
    </>
  );
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`pressable flex flex-col items-center gap-1 py-2 transition-colors ${
        active ? "text-primary" : "text-foreground/60"
      }`}
    >
      {icon}
      <span className="text-[9px] font-arcade font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}

function SheetLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="pressable w-full flex items-center gap-3 px-3 py-3 bg-background border border-border
                 cut-corner font-arcade text-xs uppercase tracking-widest text-foreground/80"
    >
      {icon}
      {label}
    </Link>
  );
}
