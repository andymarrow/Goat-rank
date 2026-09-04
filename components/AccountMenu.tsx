"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, User, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import { createClient } from "@/utils/supabase/client";

/**
 * Account dropdown.
 *
 * The avatar previously linked to /dashboard, which is exactly where the
 * "Command" nav item already went — two controls, one destination. It now
 * opens a menu with the things that had no home in the desktop chrome at all:
 * who you are signed in as, and signing out.
 */
export default function AccountMenu({
  userId,
  username,
  avatarUrl,
  isAdmin,
}: {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={`pressable flex items-center gap-1.5 pl-1 pr-2 py-1 cut-corner border transition-colors ${
          open
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-foreground/40"
        }`}
      >
        <Avatar src={avatarUrl} name={username} size={28} className="!border-0" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 bg-card border border-border cut-corner
                     shadow-2xl overflow-hidden z-50"
        >
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <Avatar src={avatarUrl} name={username} size={38} />
            <div className="min-w-0">
              <p className="font-arcade text-xs font-bold text-foreground truncate">{username}</p>
              <p className="text-[10px] text-foreground/40 font-sans">
                {isAdmin ? "Administrator" : "Creator"}
              </p>
            </div>
          </div>

          <div className="flex flex-col p-1.5 gap-0.5">
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Command centre" />
            <MenuLink href={`/u/${userId}`} icon={<User className="w-4 h-4" />} label="Public profile" />
            {isAdmin && (
              <MenuLink href="/admin" icon={<ShieldCheck className="w-4 h-4" />} label="Admin console" />
            )}

            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 font-arcade text-[10px] uppercase
                         tracking-widest text-battle-red hover:bg-battle-red/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
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
      role="menuitem"
      className="w-full flex items-center gap-2.5 px-2.5 py-2 font-arcade text-[10px] uppercase
                 tracking-widest text-foreground/75 hover:bg-foreground/5 hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
