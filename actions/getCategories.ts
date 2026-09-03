import { createClient } from "@/utils/supabase/server";

/** Fallback used while the categories table is empty or unmigrated. */
const DEFAULTS = ["Sports", "Soccer", "Basketball", "Movies", "Tech", "Cars", "Racing", "Countries"];

/**
 * Category labels for the create flow.
 *
 * These were hardcoded in ContenderStep, so adding a category in the admin
 * console had no effect on what creators could actually pick.
 */
export async function getCategoryLabels(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("getCategoryLabels failed:", error);
    return DEFAULTS;
  }

  return data.map((c) => c.label);
}
