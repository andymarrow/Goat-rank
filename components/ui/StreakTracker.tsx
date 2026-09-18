"use client";

import { useEffect, useRef } from "react";
import { touchStreak } from "@/actions/rewards";

/**
 * Counts today's visit, once.
 *
 * Mounted in the chrome so any page counts, guarded by sessionStorage so a
 * dozen navigations in one session make one call, and idempotent on the server
 * by UTC date regardless. Renders nothing: the reward shows up in the bell and
 * on the rewards page, not as an interruption.
 */
export default function StreakTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const today = new Date().toISOString().slice(0, 10);

    try {
      if (sessionStorage.getItem("gr:streak") === today) return;
      sessionStorage.setItem("gr:streak", today);
    } catch {
      // Private mode. The server dedupes by date anyway.
    }

    touchStreak().catch(() => {
      // Signed out, or offline. Nothing to do.
    });
  }, []);

  return null;
}
