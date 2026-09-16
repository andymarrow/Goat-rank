"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { isArenaClosed } from "@/lib/arena";

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
