"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { isArenaClosed } from "@/lib/arena";
import { notifyMany } from "@/lib/notify";
import { sendRoomSettled } from "@/lib/email/send";

export type SettleResult = {
  settled: boolean;
  winner?: string | null;
  charity?: string | null;
};

/**
 * Close an arena whose deadline has passed.
 *
 * Nothing runs on a schedule here, so the first person to open an expired
 * arena is what finalises it. Idempotent by construction: the update matches
 * only rows still marked active, so a hundred simultaneous visitors settle it
 * once and the rest are no-ops.
 *
 * Settling records which charity won the nomination, because that vote stops
 * the moment the arena does and the tally would otherwise keep drifting with
 * late preference changes.
 */
export async function settleRoomIfDue(roomId: string): Promise<SettleResult> {
  try {
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, status, expires_at")
      .eq("id", roomId)
      .maybeSingle();

    if (!room) return { settled: false };
    if (!isArenaClosed(room.expires_at, room.status)) return { settled: false };
    if (room.status === "settled") return { settled: true };

    // The charity the room's backers chose, decided once and stored.
    const { data: tally } = await supabase
      .from("room_charity_votes")
      .select("charity_id")
      .eq("room_id", roomId);

    const counts = new Map<string, number>();
    for (const row of tally ?? []) {
      counts.set(row.charity_id, (counts.get(row.charity_id) ?? 0) + 1);
    }

    const leader = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const patch: Record<string, string | null> = {
      status: "settled",
      settled_at: new Date().toISOString(),
    };
    if (leader) patch.settled_charity_id = leader;

    const { data: updated, error } = await supabase
      .from("rooms")
      .update(patch)
      .eq("id", roomId)
      .eq("status", "active")
      .select("id, room_type");

    if (error) {
      console.error("settleRoomIfDue failed:", error.message);
      return { settled: false };
    }

    if (updated?.length) {
      // Only the call that actually flipped the row announces the result, so
      // a hundred simultaneous visitors send one set of notifications.
      await announceResult(roomId, updated[0].room_type);

      revalidatePath(`/${updated[0].room_type === "global" ? "global" : "battle"}/${roomId}`);
      revalidatePath("/");
      revalidatePath("/admin", "layout");
    }

    return { settled: true };
  } catch (error) {
    console.error("settleRoomIfDue threw:", error);
    return { settled: false };
  }
}

/**
 * Tell everyone who had money on it how it ended.
 *
 * This is the return trigger the platform was missing: an arena that nobody is
 * told about is an arena nobody comes back to. Backers get the result, the
 * host gets the result and their commission. Both channels, because an in-app
 * bell only works for someone who already came back.
 */
async function announceResult(roomId: string, roomType: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, title, total_pool, creator_id, charity_name")
      .eq("id", roomId)
      .maybeSingle();

    if (!room) return;

    const { data: contenders } = await supabase
      .from("room_contenders")
      .select("id, current_votes, entities ( name )")
      .eq("room_id", roomId);

    const ranked = [...(contenders ?? [])].sort(
      (a, b) => (Number(b.current_votes) || 0) - (Number(a.current_votes) || 0)
    );

    const winnerName =
      (ranked[0]?.entities as unknown as { name?: string } | null)?.name ?? "Nobody";
    const winnerId = ranked[0]?.id;

    // Real backers only: a seeded pledge has no one behind it to tell.
    const { data: votes } = await supabase
      .from("votes")
      .select("voter_id, contender_id")
      .eq("room_id", roomId)
      .eq("is_demo", false)
      .not("voter_id", "is", null);

    const href = `/${roomType === "global" ? "global" : "battle"}/${roomId}`;
    const pool = Number(room.total_pool) || 0;

    const backers = [...new Set((votes ?? []).map((v) => v.voter_id as string))];
    const backedWinner = new Set(
      (votes ?? []).filter((v) => v.contender_id === winnerId).map((v) => v.voter_id as string)
    );

    await notifyMany(backers, (id) => ({
      kind: "settled",
      roomId,
      href,
      title: backedWinner.has(id)
        ? `${winnerName} won. You called it.`
        : `${room.title} is settled`,
      body: backedWinner.has(id)
        ? `Your side took it with $${Math.round(pool).toLocaleString("en-US")} in the pool.`
        : `${winnerName} took it. See the final standing.`,
    }));

    if (room.creator_id) {
      await notifyMany([room.creator_id], () => ({
        kind: "settled",
        roomId,
        href,
        title: `Your arena closed: ${room.title}`,
        body: `${winnerName} won a $${Math.round(pool).toLocaleString("en-US")} pool. Your 10% is in your wallet.`,
      }));
    }

    // Email the same people, best effort. A mail failure must never leave an
    // arena unsettled.
    const { data: profiles } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map(profiles?.users.map((u) => [u.id, u.email]) ?? []);

    await Promise.all(
      [...backers, room.creator_id]
        .filter((id): id is string => Boolean(id))
        .map(async (id) => {
          const email = emailById.get(id);
          if (!email) return;

          await sendRoomSettled(email, {
            title: room.title,
            winner: winnerName,
            pool,
            charity: room.charity_name ?? "charity",
            roomId,
            roomType,
          });
        })
    );
  } catch (error) {
    console.error("announceResult failed:", error);
  }
}
