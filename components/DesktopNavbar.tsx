"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Swords, Sun, Moon, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import AccountMenu from "@/components/AccountMenu";

/**
 * Only routes that actually exist are linked. The previous version pointed at
 * /sports, /movies, /cars and /countries, none of which are real routes — every
 * one of them 404'd.
 */
const LINKS = [
  { href: "/", label: "Arena" },
  // The mobile tab bar had Ranks but desktop did not, so the contender
  // directory was unreachable on a large screen.
  { href: "/profile", label: "Ranks" },
  { href: "/create", label: "Host" },
  { href: "/dashboard", label: "Command" },
];

export default function DesktopNavbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname() ?? "/";

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{
    username: string | null;
    avatar_url: string | null;
    is_admin?: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ? { id: user.id } : null);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, is_admin")
          .eq("id", user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
      if (!session?.user) setProfile(null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="hidden md:flex fixed top-0 w-full h-16 z-40 bg-background/80 backdrop-blur-md
                 border-b border-border items-center justify-between px-6 lg:px-12"
    >
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Image
            src="/image/logo.png"
            alt=""
            width={222}
            height={256}
            priority
            className="h-9 w-auto object-contain transition-transform group-hover:rotate-6"
          />
          <span className="font-arcade text-xl font-bold tracking-wider">GOATRANK</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
          {LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative font-arcade text-xs font-bold uppercase tracking-widest
                  transition-colors ${
                    active ? "text-primary" : "text-foreground/60 hover:text-foreground"
                  }`}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-1.5 inset-x-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="pressable p-2 rounded-full transition-colors text-foreground/70
                       hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <Link
          href="/create"
          className="pressable sheen cut-corner relative overflow-hidden flex items-center gap-2
                     bg-primary text-primary-foreground px-5 py-2.5 font-arcade font-bold text-xs
                     uppercase tracking-widest hover:brightness-110 transition-all"
        >
          <Swords className="w-4 h-4" />
          <span>Host Battle</span>
        </Link>

        {mounted && user ? (
          <AccountMenu
            userId={user.id}
            username={profile?.username ?? "Operator"}
            avatarUrl={profile?.avatar_url ?? null}
            isAdmin={Boolean(profile?.is_admin)}
          />
        ) : (
          mounted && (
            <Link
              href="/login"
              className="pressable cut-corner flex items-center gap-2 bg-background border border-border
                         text-foreground px-4 py-2 font-arcade text-xs uppercase tracking-widest
                         hover:border-primary hover:text-primary transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )
        )}
      </div>
    </header>
  );
}
