"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, User, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import DropdownPanel from "@/components/ui/DropdownPanel";
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
        className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border transition-all ${
          open
            ? "border-primary bg-primary/10"
            : "border-border/60 bg-card hover:bg-muted/60"
        }`}
      >
        <Avatar src={avatarUrl} name={username} size={26} className="!border-0" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <DropdownPanel open={open}>
        {open && (
          <div
            role="menu"
            className="w-60 max-w-[calc(100vw-1rem)] bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-1.5"
          >
            <div className="flex items-center gap-3 p-2.5 mb-1 rounded-xl bg-muted/40 border border-border/40">
              <Avatar src={avatarUrl} name={username} size={36} />
              <div className="min-w-0">
                <p className="font-semibold text-xs font-sans text-foreground truncate">{username}</p>
                <p className="text-[11px] text-muted-foreground font-sans">
                  {isAdmin ? "Administrator" : "Creator"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Command Centre" />
              <MenuLink href={`/u/${userId}`} icon={<User className="w-4 h-4" />} label="Public Profile" />
              {isAdmin && (
                <MenuLink href="/admin" icon={<ShieldCheck className="w-4 h-4" />} label="Admin Console" />
              )}

              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </DropdownPanel>
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
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
