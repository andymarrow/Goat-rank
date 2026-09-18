import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { levelFromPoints, pointsForLevel, CURVE } from "@/lib/levels";
import { notify } from "@/lib/notify";

const UNIQUE_VIOLATION = "23505";

export type AwardKind =
  | "pledge" | "host_pledge" | "winner" | "upvote" | "free_pick"
  | "streak" | "achievement" | "level" | "admin" | "purchase";

export type AwardInput = {
  profileId: string;
  kind: AwardKind;
  points: number;
  reason?: string;
  roomId?: string | null;
  /**
   * Stable per awardable event: "vote:<id>", "streak:2026-09-18", "level:12".
   * A unique index on it is what makes a webhook retry, a double click or a
   * second page load cost nothing.
   */
  dedupeKey?: string;
};

/** Point rates, tunable from the console without a deploy. */
export async function rates(): Promise<Record<string, number>> {
  const fallback: Record<string, number> = {
    points_per_dollar: 5,
    points_daily_visit: 10,
    points_streak_step: 5,
    points_streak_cap: 60,
    points_upvote: 2,
    points_free_pick: 2,
    points_winner_bonus: 50,
    points_host_pledge: 10,
    level_curve_base: CURVE.base,
    level_curve_exponent: CURVE.exponent,
  };

  try {
    const { data, error } = await createAdminClient()
      .from("app_settings")
      .select("key, value")
      .like("key", "%points%");

    if (error) return fallback;

    const merged = { ...fallback };
    for (const row of data ?? []) {
      const parsed = Number(row.value);
      if (Number.isFinite(parsed)) merged[row.key] = parsed;
    }

    return merged;
  } catch {
    return fallback;
  }
}

/**
 * Award points, once.
 *
 * Writes the ledger row first: if the dedupe key already exists the insert
 * fails and nothing is added, which is the whole guarantee. Only after it
 * lands does the balance move, so a duplicate can never inflate anyone.
 *
 * Never throws. Points are a courtesy layer over the thing that actually
 * happened, and must not be able to fail a payment or a settlement.
 */
export async function awardPoints(input: AwardInput): Promise<boolean> {
  if (!input.profileId || input.points === 0) return false;

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("point_events").insert({
      profile_id: input.profileId,
      kind: input.kind,
      points: input.points,
      reason: input.reason ?? null,
      room_id: input.roomId ?? null,
      dedupe_key: input.dedupeKey ?? null,
    });

    // Already awarded. Not an error: it is the guard doing its job.
    if (error?.code === UNIQUE_VIOLATION) return false;
    if (error) {
      console.error("awardPoints ledger failed:", error.message);
      return false;
    }

    const { data: lifetime } = await supabase.rpc("award_goat_points", {
      uid: input.profileId,
      amount: input.points,
    });

    await applyLevel(input.profileId, Number(lifetime) || 0);
    return true;
  } catch (error) {
    console.error("awardPoints threw:", error);
    return false;
  }
}

/**
 * Move someone to the level their lifetime total now buys, and hand over
 * whatever that level unlocks.
 *
 * Every level between the old and the new pays out, so a single large award
 * that jumps three levels does not silently skip two sets of rewards.
 */
async function applyLevel(profileId: string, lifetimePoints: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("goat_level")
      .eq("id", profileId)
      .maybeSingle();

    const previous = Number(profile?.goat_level) || 1;
    const next = levelFromPoints(lifetimePoints);

    if (next <= previous) return;

    await supabase.from("profiles").update({ goat_level: next }).eq("id", profileId);

    const { data: gifts } = await supabase
      .from("level_rewards")
      .select("level, title, room_credits, contender_credits, free_picks, points")
      .gt("level", previous)
      .lte("level", next)
      .order("level", { ascending: true });

    for (const gift of gifts ?? []) {
      const { data: current } = await supabase
        .from("profiles")
        .select("room_credits, contender_credits, bonus_free_picks")
        .eq("id", profileId)
        .maybeSingle();

      await supabase
        .from("profiles")
        .update({
          room_credits: (Number(current?.room_credits) || 0) + gift.room_credits,
          contender_credits: (Number(current?.contender_credits) || 0) + gift.contender_credits,
          bonus_free_picks: (Number(current?.bonus_free_picks) || 0) + gift.free_picks,
        })
        .eq("id", profileId);

      if (gift.points > 0) {
        await awardPoints({
          profileId,
          kind: "level",
          points: gift.points,
          reason: `Reached level ${gift.level}`,
          dedupeKey: `level:${gift.level}`,
        });
      }

      await notify({
        profileId,
        kind: "system",
        title: `Level ${gift.level}: ${gift.title}`,
        body: describeGift(gift),
        href: "/rewards",
      });
    }

    if (!gifts?.length) {
      await notify({
        profileId,
        kind: "system",
        title: `You reached level ${next}`,
        body: `${pointsForLevel(next + 1) - lifetimePoints} points to the next one.`,
        href: "/rewards",
      });
    }

    await checkAchievements(profileId);
  } catch (error) {
    console.error("applyLevel failed:", error);
  }
}

function describeGift(gift: {
  room_credits: number;
  contender_credits: number;
  free_picks: number;
  points: number;
}): string {
  const parts = [
    gift.room_credits > 0 && `${gift.room_credits} arena${gift.room_credits === 1 ? "" : "s"} to host`,
    gift.contender_credits > 0 && `${gift.contender_credits} contender slot${gift.contender_credits === 1 ? "" : "s"}`,
    gift.free_picks > 0 && `${gift.free_picks} free picks`,
    gift.points > 0 && `${gift.points} points`,
  ].filter(Boolean);

  return parts.length ? `Unlocked: ${parts.join(", ")}.` : "Unlocked a new badge.";
}

export type Metrics = {
  pledges: number;
  pledged_total: number;
  biggest_pledge: number;
  arenas_hosted: number;
  winners_backed: number;
  upvotes_received: number;
  streak: number;
  picks: number;
  level: number;
};

/**
 * What this profile has actually done, for the achievement checker.
 *
 * Counted from the source tables rather than kept as running totals: a counter
 * that drifts is worse than a query that costs a few hundred milliseconds on
 * an action nobody performs in a loop.
 */
export async function getMetrics(profileId: string): Promise<Metrics> {
  const supabase = createAdminClient();

  const [profile, votes, rooms, upvotes, picks] = await Promise.all([
    supabase
      .from("profiles")
      .select("goat_level, longest_streak")
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("votes")
      .select("amount, contender_id, room_id, upvote_count")
      .eq("voter_id", profileId)
      .eq("is_demo", false)
      .eq("refunded", false),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profileId),
    supabase
      .from("votes")
      .select("upvote_count")
      .eq("voter_id", profileId),
    supabase
      .from("free_picks")
      .select("id", { count: "exact", head: true })
      .eq("user_fingerprint", `u:${profileId}`),
  ]);

  const rows = votes.data ?? [];
  const amounts = rows.map((v) => Number(v.amount) || 0);

  // A winner is a settled arena where this profile's side finished top.
  let winners = 0;
  const settledRooms = [...new Set(rows.map((v) => v.room_id))];

  if (settledRooms.length > 0) {
    const { data: leaders } = await supabase
      .from("room_contenders")
      .select("id, room_id, current_votes, rooms!inner ( status )")
      .in("room_id", settledRooms)
      .eq("rooms.status", "settled");

    const topByRoom = new Map<string, { id: string; votes: number }>();
    for (const c of leaders ?? []) {
      const current = topByRoom.get(c.room_id);
      const value = Number(c.current_votes) || 0;
      if (!current || value > current.votes) topByRoom.set(c.room_id, { id: c.id, votes: value });
    }

    const backedWinners = new Set(
      rows
        .filter((v) => topByRoom.get(v.room_id)?.id === v.contender_id)
        .map((v) => `${v.room_id}:${v.contender_id}`)
    );

    winners = backedWinners.size;
  }

  return {
    pledges: rows.length,
    pledged_total: amounts.reduce((sum, n) => sum + n, 0),
    biggest_pledge: amounts.length ? Math.max(...amounts) : 0,
    arenas_hosted: rooms.count ?? 0,
    winners_backed: winners,
    upvotes_received: (upvotes.data ?? []).reduce((sum, v) => sum + (Number(v.upvote_count) || 0), 0),
    streak: Number(profile.data?.longest_streak) || 0,
    picks: picks.count ?? 0,
    level: Number(profile.data?.goat_level) || 1,
  };
}

/**
 * Unlock whatever this profile has earned and not yet been given.
 *
 * Runs after every award rather than on a schedule, so a badge appears in the
 * same moment as the thing that earned it. The unique index on
 * (profile, achievement) means running it twice costs nothing.
 */
export async function checkAchievements(profileId: string): Promise<string[]> {
  try {
    const supabase = createAdminClient();

    const [{ data: defs }, { data: mine }] = await Promise.all([
      supabase
        .from("achievements")
        .select("id, slug, name, description, points, metric, threshold, tier")
        .eq("is_active", true),
      supabase.from("profile_achievements").select("achievement_id").eq("profile_id", profileId),
    ]);

    if (!defs?.length) return [];

    const owned = new Set((mine ?? []).map((r) => r.achievement_id));
    const pending = defs.filter((d) => !owned.has(d.id));
    if (pending.length === 0) return [];

    const metrics = await getMetrics(profileId);
    const unlocked: string[] = [];

    for (const def of pending) {
      const measured = metrics[def.metric as keyof Metrics] ?? 0;
      if (measured < def.threshold) continue;

      const { error } = await supabase.from("profile_achievements").insert({
        profile_id: profileId,
        achievement_id: def.id,
      });

      if (error?.code === UNIQUE_VIOLATION) continue;
      if (error) {
        console.error("achievement unlock failed:", error.message);
        continue;
      }

      unlocked.push(def.slug);

      await awardPoints({
        profileId,
        kind: "achievement",
        points: def.points,
        reason: def.name,
        dedupeKey: `achievement:${def.slug}`,
      });

      await notify({
        profileId,
        kind: "system",
        title: `Achievement unlocked: ${def.name}`,
        body: `${def.description} +${def.points} points.`,
        href: "/rewards",
      });
    }

    return unlocked;
  } catch (error) {
    console.error("checkAchievements failed:", error);
    return [];
  }
}
