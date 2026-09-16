"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, Swords, Trophy, TrendingDown, Clock } from "lucide-react";

import DropdownPanel from "@/components/ui/DropdownPanel";
import {
  listNotifications, markNotificationsRead, type Notification, type NotificationKind,
} from "@/actions/notifications";
import { formatSince } from "@/lib/time";

const ICON: Record<NotificationKind, typeof Bell> = {
  overtaken: TrendingDown,
  settled: Trophy,
  backed: Swords,
  closing: Clock,
  system: Bell,
};

/**
 * The inbox, in the navbar.
 *
 * Fetched on open rather than polled: the bell is checked far less often than
 * the page is rendered, and a poll on every page for every visitor is a lot of
 * queries to answer "nothing new". The unread count loads once on mount so the
 * dot is honest without that cost.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;

    listNotifications(20).then((rows) => {
      if (live) {
        setItems(rows);
        setLoaded(true);
      }
    });

    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);

    if (next) {
      // Refresh on open, and clear the badge: they are looking at them.
      startTransition(async () => {
        const rows = await listNotifications(20);
        setItems(rows);

        if (rows.some((n) => !n.read)) {
          await markNotificationsRead();
          setItems(rows.map((n) => ({ ...n, read: true })));
        }
      });
    }
  };

  // Nothing to show a signed-out visitor, and no reason to occupy the space.
  if (loaded && items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-full p-2 text-muted-foreground hover:text-primary
                   hover:bg-muted/60 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />

        {unread > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-primary
                       text-primary-foreground text-[9px] font-bold flex items-center justify-center
                       tabular-nums"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <DropdownPanel open={open}>
        {open && (
          <div
            className="w-80 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto overscroll-contain
                       rounded-2xl bg-card border border-border/80 shadow-2xl p-1.5"
          >
            <div className="px-2.5 py-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Notifications
              </span>
              {unread > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-500">
                  <Check className="w-2.5 h-2.5" /> marked read
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              {items.map((n) => {
                const Icon = ICON[n.kind] ?? Bell;

                const row = (
                  <>
                    <span
                      className={`shrink-0 rounded-lg p-1.5 ${
                        n.kind === "overtaken"
                          ? "bg-red-500/10 text-red-500"
                          : n.kind === "settled"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-foreground leading-snug">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {n.body}
                        </span>
                      )}
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                        {formatSince(n.createdAt)}
                      </span>
                    </span>
                  </>
                );

                const className = `flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors ${
                  n.read ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
                }`;

                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className={className}>
                    {row}
                  </Link>
                ) : (
                  <div key={n.id} className={className}>
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DropdownPanel>
    </div>
  );
}
