"use client";

import Link from "next/link";
import Image from "next/image";
import SearchLauncher from "@/components/ui/SearchLauncher";
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
    <header className="hidden md:flex fixed top-0 w-full h-16 z-40 bg-background items-center">
      <div className="w-[80%] max-w-[1920px] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/image/logo.png"
              alt="GOATRANK"
              width={222}
              height={256}
              priority
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-lg tracking-tight font-sans text-foreground">
              GOAT<span className="text-primary">RANK</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-1.5">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Cmd+K lives here too, so search is reachable from every page. */}
          <SearchLauncher variant="icon" />

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-sm active:scale-95"
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
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-muted/60 text-foreground hover:bg-muted transition-all"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
