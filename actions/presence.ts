"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Lifetime visitor count.
 *
 * Counted server-side through an RPC rather than an update from the browser,
 * so the number cannot be set to anything a client fancies. The caller decides
 * how often to count — once per browser session, not once per render.
 *
 * Returns null when the counter is not installed yet, and the caller shows the
 * live figure alone rather than a zero.
 */
export async function recordVisit(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("bump_visitors");

    if (error) {
      console.error("recordVisit failed:", error.message);
      return null;
    }
    return Number(data) || null;
  } catch (error) {
    console.error("recordVisit threw:", error);
    return null;
  }
}

/** Read the total without counting a new arrival. */
export async function getVisitorCount(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_counters")
      .select("value")
      .eq("key", "visitors")
      .maybeSingle();

    if (error || !data) return null;
    return Number(data.value) || 0;
  } catch {
    return null;
  }
}
