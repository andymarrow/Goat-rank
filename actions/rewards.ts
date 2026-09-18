"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardPoints, checkAchievements, rates } from "@/lib/rewards";
import { levelProgress, tierOf, TIER_LABEL } from "@/lib/levels";
import { notify } from "@/lib/notify";

export type RewardProfile = {
  points: number;
  lifetime: number;
  level: number;
  tier: string;
  tierLabel: string;
  progress: { into: number; span: number; fraction: number; toNext: number; nextLevel: number | null };
  streak: number;
  longestStreak: number;
  roomCredits: number;
  contenderCredits: number;
  bonusFreePicks: number;
};

export type Achievement = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
  metric: string;
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
  /** How far along, for a locked one. */
  progress: number;
};

export type RewardItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  grantKind: string;
  grantAmount: number;
  affordable: boolean;
};

export type LevelReward = {
  level: number;
  title: string;
  roomCredits: number;
  contenderCredits: number;
  freePicks: number;
  points: number;
  reached: boolean;
};

export type PointEntry = {
  id: string;
  kind: string;
  points: number;
  reason: string | null;
  createdAt: string;
};

/**
 * Everything the rewards page needs, in one round trip.
 *
 * Returns null for a signed-out visitor rather than throwing: the page still
 * shows the ladder and the store, because seeing what is worth chasing is
 * half the reason to sign up.
 */
export async function getMyRewards(): Promise<{
  profile: RewardProfile | null;
  achievements: Achievement[];
  items: RewardItem[];
  levels: LevelReward[];
  history: PointEntry[];
}> {
  const admin = createAdminClient();

  const [{ data: defs }, { data: items }, { data: levels }] = await Promise.all([
    admin
      .from("achievements")
      .select("slug, name, description, icon, tier, points, metric, threshold, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("reward_items")
      .select("id, slug, name, description, icon, cost, grant_kind, grant_amount, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("level_rewards")
      .select("level, title, room_credits, contender_credits, free_picks, points")
      .order("level", { ascending: true }),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shapeItems = (points: number): RewardItem[] =>
    (items ?? []).map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      description: i.description,
      icon: i.icon,
      cost: i.cost,
      grantKind: i.grant_kind,
      grantAmount: i.grant_amount,
      affordable: points >= i.cost,
    }));

  if (!user) {
    return {
      profile: null,
      achievements: (defs ?? []).map((d) => ({
        slug: d.slug,
        name: d.name,
        description: d.description,
        icon: d.icon,
        tier: d.tier,
        points: d.points,
        metric: d.metric,
        threshold: d.threshold,
        unlocked: false,
        unlockedAt: null,
        progress: 0,
      })),
      items: shapeItems(0),
      levels: (levels ?? []).map((l) => ({
        level: l.level,
        title: l.title,
        roomCredits: l.room_credits,
        contenderCredits: l.contender_credits,
        freePicks: l.free_picks,
        points: l.points,
        reached: false,
      })),
      history: [],
    };
  }

  const [{ data: profile }, { data: unlocked }, { data: history }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "goat_points, lifetime_points, goat_level, streak_days, longest_streak, room_credits, contender_credits, bonus_free_picks"
      )
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("profile_achievements")
      .select("unlocked_at, achievements ( slug )")
      .eq("profile_id", user.id),
    admin
      .from("point_events")
      .select("id, kind, points, reason, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const lifetime = Number(profile?.lifetime_points) || 0;
  const points = Number(profile?.goat_points) || 0;
  const progress = levelProgress(lifetime);
  const tier = tierOf(progress.level);

  const unlockedBySlug = new Map(
    (unlocked ?? []).map((u) => [
      (u.achievements as unknown as { slug?: string } | null)?.slug ?? "",
      u.unlocked_at,
    ])
  );

  // Progress on a locked badge needs the same metrics the checker uses.
  const { getMetrics } = await import("@/lib/rewards");
  const metrics = await getMetrics(user.id);

  return {
    profile: {
      points,
      lifetime,
      level: progress.level,
      tier,
      tierLabel: TIER_LABEL[tier],
      progress: {
        into: progress.into,
        span: progress.span,
        fraction: progress.fraction,
        toNext: progress.toNext,
        nextLevel: progress.nextLevel,
      },
      streak: Number(profile?.streak_days) || 0,
      longestStreak: Number(profile?.longest_streak) || 0,
      roomCredits: Number(profile?.room_credits) || 0,
      contenderCredits: Number(profile?.contender_credits) || 0,
      bonusFreePicks: Number(profile?.bonus_free_picks) || 0,
    },
    achievements: (defs ?? []).map((d) => {
      const measured = (metrics as unknown as Record<string, number>)[d.metric] ?? 0;

      return {
        slug: d.slug,
        name: d.name,
        description: d.description,
        icon: d.icon,
        tier: d.tier,
        points: d.points,
        metric: d.metric,
        threshold: d.threshold,
        unlocked: unlockedBySlug.has(d.slug),
        unlockedAt: unlockedBySlug.get(d.slug) ?? null,
        progress: Math.min(1, d.threshold > 0 ? measured / d.threshold : 0),
      };
    }),
    items: shapeItems(points),
    levels: (levels ?? []).map((l) => ({
      level: l.level,
      title: l.title,
      roomCredits: l.room_credits,
      contenderCredits: l.contender_credits,
      freePicks: l.free_picks,
      points: l.points,
      reached: progress.level >= l.level,
    })),
    history: (history ?? []).map((h) => ({
      id: h.id,
      kind: h.kind,
      points: h.points,
      reason: h.reason,
      createdAt: h.created_at,
    })),
  };
}

/**
 * Count today's visit, and extend or reset the streak.
 *
 * Called once per session from the client. Idempotent by date: the ledger key
 * is the UTC day, so ten page loads pay once.
 */
export async function touchStreak(): Promise<{ streak: number; awarded: number } | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: profile } = await admin
      .from("profiles")
      .select("streak_days, longest_streak, streak_day")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return null;
    if (profile.streak_day === today) {
      return { streak: Number(profile.streak_days) || 0, awarded: 0 };
    }

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    // Consecutive if the last visit was yesterday; otherwise the run is over
    // and today is day one again.
    const streak = profile.streak_day === yesterday ? (Number(profile.streak_days) || 0) + 1 : 1;
    const longest = Math.max(Number(profile.longest_streak) || 0, streak);

    await admin
      .from("profiles")
      .update({ streak_days: streak, longest_streak: longest, streak_day: today })
      .eq("id", user.id);

    const rate = await rates();

    // Each consecutive day is worth more than the last, up to a ceiling, so a
    // long run is rewarding without becoming the only thing that matters.
    const bonus = Math.min(
      rate.points_streak_cap,
      (streak - 1) * rate.points_streak_step
    );
    const points = Math.round(rate.points_daily_visit + bonus);

    await awardPoints({
      profileId: user.id,
      kind: "streak",
      points,
      reason: streak > 1 ? `${streak} day streak` : "Daily visit",
      dedupeKey: `streak:${today}`,
    });

    if (streak > 1 && streak % 5 === 0) {
      await notify({
        profileId: user.id,
        kind: "system",
        title: `${streak} days in a row`,
        body: `Your streak is paying ${points} points a day now.`,
        href: "/rewards",
      });
    }

    await checkAchievements(user.id);
    revalidatePath("/rewards");

    return { streak, awarded: points };
  } catch (error) {
    console.error("touchStreak failed:", error);
    return null;
  }
}

export type PurchaseResult = { ok: boolean; error?: string; points?: number };

/** Spend points on a privilege. */
export async function buyReward(itemId: string): Promise<PurchaseResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Sign in to spend your points." };

    const admin = createAdminClient();

    const { data: item } = await admin
      .from("reward_items")
      .select("id, name, cost, grant_kind, grant_amount, is_active")
      .eq("id", itemId)
      .maybeSingle();

    if (!item?.is_active) return { ok: false, error: "That reward is no longer available." };

    // One statement with the balance in its WHERE clause: two tabs cannot both
    // spend the same points.
    const { data: spent } = await admin.rpc("spend_goat_points", {
      uid: user.id,
      amount: item.cost,
    });

    if (!spent) return { ok: false, error: "Not enough points for that yet." };

    const column =
      item.grant_kind === "room_credits"
        ? "room_credits"
        : item.grant_kind === "contender_credits"
        ? "contender_credits"
        : "bonus_free_picks";

    const { data: current } = await admin
      .from("profiles")
      .select(column)
      .eq("id", user.id)
      .maybeSingle();

    const held = Number((current as unknown as Record<string, number>)?.[column]) || 0;

    await admin
      .from("profiles")
      .update({ [column]: held + item.grant_amount })
      .eq("id", user.id);

    await admin.from("reward_purchases").insert({
      profile_id: user.id,
      item_id: item.id,
      cost: item.cost,
    });

    await admin.from("point_events").insert({
      profile_id: user.id,
      kind: "purchase",
      points: -item.cost,
      reason: item.name,
    });

    const { data: after } = await admin
      .from("profiles")
      .select("goat_points")
      .eq("id", user.id)
      .maybeSingle();

    revalidatePath("/rewards");
    revalidatePath("/dashboard");

    return { ok: true, points: Number(after?.goat_points) || 0 };
  } catch (error) {
    console.error("buyReward failed:", error);
    return { ok: false, error: "Could not complete that purchase." };
  }
}
