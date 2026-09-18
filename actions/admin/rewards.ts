"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";
import { awardPoints, checkAchievements } from "@/lib/rewards";

export type RateRow = { key: string; value: number; label: string; hint: string };

const RATE_LABELS: Record<string, { label: string; hint: string }> = {
  points_per_dollar: { label: "Per dollar pledged", hint: "The main earner. 5 means a $20 pledge pays 100." },
  points_daily_visit: { label: "Daily visit", hint: "Paid once per UTC day, whatever they do." },
  points_streak_step: { label: "Streak step", hint: "Added per consecutive day on top of the daily visit." },
  points_streak_cap: { label: "Streak ceiling", hint: "Where the streak bonus stops growing." },
  points_upvote: { label: "Upvote received", hint: "Paid to the author of an upvoted battle cry." },
  points_free_pick: { label: "Free pick", hint: "Once per arena, so picks cannot be farmed." },
  points_winner_bonus: { label: "Backed the winner", hint: "Paid once per settled arena." },
  points_host_pledge: { label: "Pledge in your arena", hint: "Paid to the host on every pledge." },
};

export type AdminReward = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cost: number;
  grantKind: string;
  grantAmount: number;
  isActive: boolean;
};

export type AdminAchievement = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: string;
  points: number;
  metric: string;
  threshold: number;
  isActive: boolean;
  unlockedCount: number;
};

export type Earner = {
  id: string;
  username: string | null;
  level: number;
  points: number;
  lifetime: number;
  streak: number;
};

export async function getRewardConfig(): Promise<{
  rates: RateRow[];
  items: AdminReward[];
  achievements: AdminAchievement[];
  earners: Earner[];
  totals: { awarded: number; spent: number; unlocks: number };
}> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [settings, items, achievements, unlocks, earners, events] = await Promise.all([
    supabase.from("app_settings").select("key, value").like("key", "points%"),
    supabase
      .from("reward_items")
      .select("id, slug, name, description, cost, grant_kind, grant_amount, is_active, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("achievements")
      .select("id, slug, name, description, tier, points, metric, threshold, is_active, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("profile_achievements").select("achievement_id"),
    supabase
      .from("profiles")
      .select("id, username, goat_level, goat_points, lifetime_points, streak_days")
      .eq("is_bot", false)
      .order("lifetime_points", { ascending: false })
      .limit(15),
    supabase.from("point_events").select("points"),
  ]);

  const unlockCounts = new Map<string, number>();
  for (const row of unlocks.data ?? []) {
    unlockCounts.set(row.achievement_id, (unlockCounts.get(row.achievement_id) ?? 0) + 1);
  }

  const amounts = (events.data ?? []).map((e) => Number(e.points) || 0);

  return {
    rates: Object.entries(RATE_LABELS).map(([key, meta]) => ({
      key,
      value: Number((settings.data ?? []).find((s) => s.key === key)?.value) || 0,
      ...meta,
    })),
    items: (items.data ?? []).map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      description: i.description,
      cost: i.cost,
      grantKind: i.grant_kind,
      grantAmount: i.grant_amount,
      isActive: i.is_active,
    })),
    achievements: (achievements.data ?? []).map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      tier: a.tier,
      points: a.points,
      metric: a.metric,
      threshold: a.threshold,
      isActive: a.is_active,
      unlockedCount: unlockCounts.get(a.id) ?? 0,
    })),
    earners: (earners.data ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      level: Number(p.goat_level) || 1,
      points: Number(p.goat_points) || 0,
      lifetime: Number(p.lifetime_points) || 0,
      streak: Number(p.streak_days) || 0,
    })),
    totals: {
      awarded: amounts.filter((n) => n > 0).reduce((sum, n) => sum + n, 0),
      spent: Math.abs(amounts.filter((n) => n < 0).reduce((sum, n) => sum + n, 0)),
      unlocks: unlocks.data?.length ?? 0,
    },
  };
}

/** Change what an action is worth. Takes effect on the next award. */
export async function setPointRate(key: string, value: number): Promise<AdminResult> {
  try {
    await requireAdmin();

    if (!(key in RATE_LABELS)) return { ok: false, error: "Unknown rate." };
    if (!Number.isFinite(value) || value < 0 || value > 10000) {
      return { ok: false, error: "Pick a number between 0 and 10,000." };
    }

    const { error } = await createAdminClient()
      .from("app_settings")
      .upsert(
        { key, value: String(Math.round(value)), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) throw error;

    revalidatePath("/admin/rewards");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not save that rate.");
  }
}

export async function upsertRewardItem(input: {
  id?: string;
  slug: string;
  name: string;
  description: string;
  cost: number;
  grantKind: string;
  grantAmount: number;
  isActive?: boolean;
}): Promise<AdminResult> {
  try {
    await requireAdmin();

    if (!input.name?.trim()) return { ok: false, error: "Give it a name." };
    if (!(input.cost > 0)) return { ok: false, error: "Cost must be above zero." };
    if (!(input.grantAmount > 0)) return { ok: false, error: "It has to grant something." };

    const row = {
      slug: input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
      name: input.name.trim().slice(0, 80),
      description: input.description.trim().slice(0, 200),
      cost: Math.round(input.cost),
      grant_kind: input.grantKind,
      grant_amount: Math.round(input.grantAmount),
      is_active: input.isActive ?? true,
    };

    const supabase = createAdminClient();
    const { error } = input.id
      ? await supabase.from("reward_items").update(row).eq("id", input.id)
      : await supabase.from("reward_items").insert(row);

    if (error) throw error;

    revalidatePath("/admin/rewards");
    revalidatePath("/rewards");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not save that reward.");
  }
}

export async function setRewardActive(id: string, active: boolean): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient()
      .from("reward_items")
      .update({ is_active: active })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/rewards");
    revalidatePath("/rewards");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update that reward.");
  }
}

export async function updateAchievement(input: {
  id: string;
  points?: number;
  threshold?: number;
  isActive?: boolean;
}): Promise<AdminResult> {
  try {
    await requireAdmin();

    const patch: Record<string, number | boolean> = {};
    if (input.points !== undefined) patch.points = Math.max(0, Math.round(input.points));
    if (input.threshold !== undefined) patch.threshold = Math.max(1, Math.round(input.threshold));
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to change." };

    const { error } = await createAdminClient()
      .from("achievements")
      .update(patch)
      .eq("id", input.id);

    if (error) throw error;

    revalidatePath("/admin/rewards");
    revalidatePath("/rewards");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update that achievement.");
  }
}

/**
 * Hand points to someone directly.
 *
 * For the cases a rule cannot cover: an apology, a bug that cost someone their
 * streak, a competition prize. Ledgered like everything else, so the reason is
 * on the record.
 */
export async function grantPoints(
  profileId: string,
  points: number,
  reason: string
): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();

    if (!Number.isFinite(points) || points === 0) {
      return { ok: false, error: "Enter an amount." };
    }

    const awarded = await awardPoints({
      profileId,
      kind: "admin",
      points: Math.round(points),
      reason: reason?.trim() || `Granted by ${admin.username ?? "an admin"}`,
      dedupeKey: `admin:${Date.now()}:${profileId}`,
    });

    if (!awarded) return { ok: false, error: "Could not award those points." };

    await checkAchievements(profileId);

    revalidatePath("/admin/rewards");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not grant those points.");
  }
}

/**
 * Re-run the achievement checker for everyone.
 *
 * Needed after adding a badge or lowering a threshold: people who already
 * qualify should not have to do the thing again to be given it.
 */
export async function backfillAchievements(): Promise<AdminResult<{ checked: number }>> {
  try {
    await requireAdmin();

    const { data: profiles } = await createAdminClient()
      .from("profiles")
      .select("id")
      .eq("is_bot", false)
      .gt("lifetime_points", 0)
      .limit(500);

    for (const profile of profiles ?? []) {
      await checkAchievements(profile.id);
    }

    revalidatePath("/admin/rewards");
    return { ok: true, data: { checked: profiles?.length ?? 0 } };
  } catch (error) {
    return adminError(error, "Could not run the backfill.");
  }
}
