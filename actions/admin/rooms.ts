"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type AdminRoom = {
  id: string;
  title: string;
  category: string;
  room_type: string;
  status: string;
  total_pool: number;
  charity_name: string | null;
  is_featured: boolean;
  featured_rank: number | null;
  expires_at: string;
  created_at: string;
  settled_at: string | null;
  creator_id: string | null;
  room_contenders: {
    current_votes: number | string;
    seed_index: number;
    entities: { name: string; image_url: string | null; brand_color: string | null } | null;
  }[];
};

/** Read side — imported by the admin page, not callable from the browser. */
export async function listRooms(): Promise<AdminRoom[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("rooms")
    .select(
      `id, title, category, room_type, status, total_pool, charity_name,
       is_featured, featured_rank, expires_at, created_at, settled_at, creator_id,
       room_contenders ( current_votes, seed_index, entities ( name, image_url, brand_color ) )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listRooms failed:", error);
    return [];
  }

  return (data ?? []) as unknown as AdminRoom[];
}

/** Pin/unpin a room into the homepage Hero Carousel. */
export async function setRoomFeatured(
  roomId: string,
  featured: boolean,
  rank?: number
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient()
      .from("rooms")
      .update({
        is_featured: featured,
        featured_rank: featured ? (rank ?? 0) : null,
      })
      .eq("id", roomId);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the featured flag.");
  }
}

/** Moderate user-deployed rooms: fix titles, recategorise. */
export async function updateRoom(
  roomId: string,
  patch: { title?: string; category?: string; charity_name?: string }
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const clean: Record<string, string> = {};
    if (patch.title?.trim()) clean.title = patch.title.trim().slice(0, 120);
    if (patch.category?.trim()) clean.category = patch.category.trim().slice(0, 60);
    if (patch.charity_name?.trim()) clean.charity_name = patch.charity_name.trim().slice(0, 120);

    if (Object.keys(clean).length === 0) {
      return { ok: false, error: "Nothing to update." };
    }

    const { error } = await createAdminClient().from("rooms").update(clean).eq("id", roomId);
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath(`/battle/${roomId}`);
    revalidatePath(`/global/${roomId}`);
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the arena.");
  }
}

/**
 * End a room early and mark it settled.
 *
 * Deliberately does NOT move money. The 10% creator commission was already
 * credited per-vote by the handle_new_vote trigger, and charity is paid out
 * of band — settling only closes the room and stamps the audit trail. Wiring
 * an actual disbursement here would double-pay the creators.
 */
export async function forceSettleRoom(roomId: string): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminClient();

    const { data: room, error: readError } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("id", roomId)
      .single();

    if (readError) throw readError;
    if (!room) return { ok: false, error: "Arena not found." };
    if (room.status === "settled") return { ok: false, error: "Arena is already settled." };

    const { error } = await supabase
      .from("rooms")
      .update({
        status: "settled",
        settled_at: new Date().toISOString(),
        settled_by: admin.id,
        is_featured: false,
        featured_rank: null,
        expires_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .neq("status", "settled");

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not settle the arena.");
  }
}

/**
 * Delete a room that violates terms.
 *
 * Refuses once money is in the pool: the votes rows are the only record of
 * what people paid, and the aggregates they fed are irreversible. Settle a
 * funded room instead.
 */
export async function deleteRoom(roomId: string): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: room, error: readError } = await supabase
      .from("rooms")
      .select("id, total_pool")
      .eq("id", roomId)
      .single();

    if (readError) throw readError;
    if (!room) return { ok: false, error: "Arena not found." };

    if (Number(room.total_pool) > 0) {
      return {
        ok: false,
        error: "This arena has taken money. Force-settle it instead of deleting.",
      };
    }

    await supabase.from("room_contenders").delete().eq("room_id", roomId);
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the arena.");
  }
}
