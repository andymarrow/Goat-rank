"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { recordVisit } from "@/actions/presence";

/**
 * Who is here right now.
 *
 * A Realtime presence channel, so nobody is written to the database to be
 * counted: each open tab joins the channel, the count is the size of the
 * roster, and leaving removes it without a heartbeat table to clean up.
 *
 * Scope is either the whole site or one arena. In an arena the number is the
 * point — a room with people in it is a room where the standing is about to
 * move, and that is the reason to pledge now rather than later.
 */
export default function LivePresence({
  scope,
  label = "online",
  showVisitors = false,
  className = "",
}: {
  /** "site" or a room id. */
  scope: string;
  label?: string;
  /** Homepage only: the lifetime arrival count beside the live one. */
  showVisitors?: boolean;
  className?: string;
}) {
  const [online, setOnline] = useState(1);
  const [visitors, setVisitors] = useState<number | null>(null);
  const counted = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // A random key per tab: presence groups by key, so a shared one would
    // collapse every viewer into a single entry.
    const channel = supabase.channel(`presence:${scope}`, {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnline(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") channel.track({ at: Date.now() });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scope]);

  useEffect(() => {
    if (!showVisitors || counted.current) return;
    counted.current = true;

    // Once per browser session, not once per mount: a tab that navigates back
    // to the homepage is the same arrival.
    let already: string | null = null;
    try {
      already = sessionStorage.getItem("gr:" + "counted");
    } catch {
      // Private mode or blocked storage — count it and move on.
    }

    if (already) {
      import("@/actions/presence").then(({ getVisitorCount }) =>
        getVisitorCount().then(setVisitors)
      );
      return;
    }

    recordVisit().then((total) => {
      setVisitors(total);
      try {
        sessionStorage.setItem("gr:counted", "1");
      } catch {
        // Nothing to do: the worst case is counting this tab twice.
      }
    });
  }, [showVisitors]);

  return (
    <span
      className={`inline-flex items-center gap-2 font-sans text-[11px] text-muted-foreground ${className}`}
    >
      <span className="relative flex w-2 h-2 shrink-0">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500/60 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>

      <span className="tabular-nums">
        <span className="font-bold text-foreground">{online.toLocaleString()}</span> {label}
      </span>

      {showVisitors && visitors !== null && (
        <>
          <span aria-hidden="true" className="text-muted-foreground/50">
            ·
          </span>
          <span className="tabular-nums">{visitors.toLocaleString()} visitors</span>
        </>
      )}
    </span>
  );
}
