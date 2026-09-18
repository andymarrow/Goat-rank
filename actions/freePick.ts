"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { getFingerprint } from "@/lib/fingerprint";
import { isArenaClosed } from "@/lib/arena";
import { awardPoints, rates } from "@/lib/rewards";

const DEFAULT_ALLOWANCE = 10;

export type PickTally = {
  contenderId: string;
  picks: number;
};

export type FreePickState = {
  /** What this viewer picked in this arena, if anything. */
  mine: string | null;
  tally: PickTally[];
  total: number;
  /** Picks left before they have to pay to have a say. */
  remaining: number;
  allowance: number;
};

/** The site-wide allowance, set from the admin console. */
async function allowance(): Promise<number> {
  try {
    const { data } = await createAdminClient()
      .from("app_settings")
      .select("value")
      .eq("key", "free_picks_per_user")
      .maybeSingle();

    const parsed = Number(data?.value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_ALLOWANCE;
  } catch {
    return DEFAULT_ALLOWANCE;
  }
}

/**
 * Sentiment for an arena, separate from the money.
 *
 * A free pick never touches a pool, a standing or a payout. It lives in its
 * own table for exactly that reason: the moment sentiment could move a
 * leaderboard that people paid into, the paying stops making sense. What it
 * buys is a reason for someone who will not pay yet to take part, come back,
 * and eventually convert.
 */
export async function getFreePicks(roomId: string): Promise<FreePickState> {
  const limit = await allowance();
  const empty: FreePickState = {
    mine: null, tally: [], total: 0, remaining: limit, allowance: limit,
  };

  try {
    const supabase = createAdminClient();
    const fingerprint = await getFingerprint(false);

    // Picks bought with points, or handed over by a level, sit on top of the
    // site-wide allowance. Without this a redeemed reward changed nothing the
    // buyer could see.
    const bonus = await bonusPicks(fingerprint);
    const total = limit + bonus;

    const { data, error } = await supabase
      .from("free_picks")
      .select("contender_id, user_fingerprint")
      .eq("room_id", roomId);

    // Table arrives with migration 0013.
    if (error) return empty;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.contender_id, (counts.get(row.contender_id) ?? 0) + 1);
    }

    const mine = fingerprint
      ? (data ?? []).find((r) => r.user_fingerprint === fingerprint)?.contender_id ?? null
      : null;

    let used = 0;
    if (fingerprint) {
      const { count } = await supabase
        .from("free_picks")
        .select("id", { count: "exact", head: true })
        .eq("user_fingerprint", fingerprint);

      used = count ?? 0;
    }

    return {
      mine,
      tally: [...counts.entries()].map(([contenderId, picks]) => ({ contenderId, picks })),
      total: data?.length ?? 0,
      remaining: Math.max(0, total - used),
      allowance: total,
    };
  } catch {
    return empty;
  }
}

/**
 * Extra picks this person holds beyond the site-wide allowance.
 *
 * Only a signed-in account can hold them: an anonymous fingerprint has nothing
 * to attach a purchase to.
 */
async function bonusPicks(fingerprint: string | null): Promise<number> {
  if (!fingerprint?.startsWith("u:")) return 0;

  try {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("bonus_free_picks")
      .eq("id", fingerprint.slice(2))
      .maybeSingle();

    return Number(data?.bonus_free_picks) || 0;
  } catch {
    return 0;
  }
}

export type PickResult = { ok: boolean; error?: string; remaining?: number };

/** Cast or move a free pick. */
export async function castFreePick(roomId: string, contenderId: string): Promise<PickResult> {
  try {
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, status, expires_at, room_type")
      .eq("id", roomId)
      .maybeSingle();

    if (!room) return { ok: false, error: "Arena not found." };
    if (isArenaClosed(room.expires_at, room.status)) {
      return { ok: false, error: "This arena has closed." };
    }

    const fingerprint = await getFingerprint(true);
    if (!fingerprint) return { ok: false, error: "Could not identify you." };

    const limit = (await allowance()) + (await bonusPicks(fingerprint));

    const { data: existing } = await supabase
      .from("free_picks")
      .select("id, contender_id")
      .eq("room_id", roomId)
      .eq("user_fingerprint", fingerprint)
      .maybeSingle();

    // Changing your mind in an arena you already picked costs nothing: the
    // allowance is about how many arenas you can weigh in on, not how often
    // you can waver.
    if (!existing) {
      const { count } = await supabase
        .from("free_picks")
        .select("id", { count: "exact", head: true })
        .eq("user_fingerprint", fingerprint);

      if ((count ?? 0) >= limit) {
        return {
          ok: false,
          error: `That is your ${limit} free picks used. Back a contender, or buy more with points.`,
          remaining: 0,
        };
      }
    }

    const { error } = existing
      ? await supabase
          .from("free_picks")
          .update({ contender_id: contenderId })
          .eq("id", existing.id)
      : await supabase
          .from("free_picks")
          .insert({ room_id: roomId, contender_id: contenderId, user_fingerprint: fingerprint });

    if (error) throw error;

    // A pick pays a little, once per arena: enough to make a free visit worth
    // something, not enough to farm.
    if (fingerprint.startsWith("u:")) {
      const rate = await rates();

      await awardPoints({
        profileId: fingerprint.slice(2),
        kind: "free_pick",
        points: Math.round(rate.points_free_pick),
        reason: "Picked a side",
        roomId,
        dedupeKey: `pick:${roomId}`,
      });
    }

    revalidatePath(`/${room.room_type === "global" ? "global" : "battle"}/${roomId}`);

    const { count: used } = await supabase
      .from("free_picks")
      .select("id", { count: "exact", head: true })
      .eq("user_fingerprint", fingerprint);

    return { ok: true, remaining: Math.max(0, limit - (used ?? 0)) };
  } catch (error) {
    console.error("castFreePick failed:", error);
    return { ok: false, error: "Could not record that pick." };
  }
}
