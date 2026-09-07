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
  charity_id: string | null;
  is_featured: boolean;
  featured_rank: number | null;
  expires_at: string;
  created_at: string;
  settled_at: string | null;
  creator_id: string | null;
  room_contenders: {
    id: string;
    current_votes: number | string;
    seed_index: number;
    entities: {
      id: string;
      name: string;
      image_url: string | null;
      brand_color: string | null;
    } | null;
  }[];
};

/** Read side — imported by the admin page, not callable from the browser. */
export async function listRooms(): Promise<AdminRoom[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("rooms")
    .select(
      `id, title, category, room_type, status, total_pool, charity_name, charity_id,
       is_featured, featured_rank, expires_at, created_at, settled_at, creator_id,
       room_contenders ( id, current_votes, seed_index, entities ( id, name, image_url, brand_color ) )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listRooms failed:", error);
    return [];
  }

  return (data ?? []) as unknown as AdminRoom[];
}

/** One arena, for the detail editor. */
export async function getAdminRoom(roomId: string): Promise<AdminRoom | null> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("rooms")
    .select(
      `id, title, category, room_type, status, total_pool, charity_name, charity_id,
       is_featured, featured_rank, expires_at, created_at, settled_at, creator_id,
       room_contenders ( id, current_votes, seed_index, entities ( id, name, image_url, brand_color ) )`
    )
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("getAdminRoom failed:", error);
    return null;
  }

  return (data as unknown as AdminRoom) ?? null;
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
  patch: {
    title?: string;
    category?: string;
    charity_name?: string;
    charity_id?: string | null;
    expires_at?: string;
  }
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const clean: Record<string, string | null> = {};
    if (patch.title?.trim()) clean.title = patch.title.trim().slice(0, 120);
    if (patch.category?.trim()) clean.category = patch.category.trim().slice(0, 60);
    if (patch.charity_name?.trim()) clean.charity_name = patch.charity_name.trim().slice(0, 120);
    if (patch.charity_id !== undefined) clean.charity_id = patch.charity_id || null;

    if (patch.expires_at) {
      const when = new Date(patch.expires_at);
      if (Number.isNaN(when.getTime())) {
        return { ok: false, error: "That closing time is not a valid date." };
      }
      clean.expires_at = when.toISOString();
    }

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

/**
 * Add a contender to an existing arena.
 *
 * Reuses an entity when one is chosen or the name already exists, so adding
 * "Ronaldo" to a second arena links the same profile rather than minting a
 * duplicate. 1v1 arenas are capped at two.
 */
export async function addContenderToRoom(
  roomId: string,
  input: { entityId?: string; name?: string; image?: string; color?: string }
): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, room_type, category, is_demo")
      .eq("id", roomId)
      .single();

    if (!room) return { ok: false, error: "Arena not found." };

    const { count } = await supabase
      .from("room_contenders")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);

    const seeded = count ?? 0;

    if (room.room_type === "1v1" && seeded >= 2) {
      return { ok: false, error: "A 1v1 arena already has both contenders." };
    }

    let entityId = input.entityId ?? null;

    if (!entityId) {
      const name = input.name?.trim();
      if (!name) return { ok: false, error: "Pick a contender or give a name." };

      const { data: existing } = await supabase
        .from("entities")
        .select("id")
        .ilike("name", name)
        .eq("moderation_status", "approved")
        .limit(1)
        .maybeSingle();

      if (existing) {
        entityId = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from("entities")
          .insert({
            name: name.slice(0, 80),
            category: room.category,
            brand_color: input.color ?? "#FF7A00",
            image_url: input.image ?? null,
            moderation_status: "approved",
            is_demo: room.is_demo ?? false,
          })
          .select("id")
          .single();

        if (createError || !created) throw createError ?? new Error("Entity insert failed");
        entityId = created.id;
      }
    }

    const { data: already } = await supabase
      .from("room_contenders")
      .select("id")
      .eq("room_id", roomId)
      .eq("entity_id", entityId)
      .maybeSingle();

    if (already) return { ok: false, error: "That contender is already in this arena." };

    const { error } = await supabase.from("room_contenders").insert({
      room_id: roomId,
      entity_id: entityId,
      seed_index: seeded,
    });

    if (error) throw error;

    revalidatePath("/admin/arenas");
    revalidatePath(`/admin/arenas/${roomId}`);
    revalidatePath(`/${room.room_type === "global" ? "global" : "battle"}/${roomId}`);
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not add the contender.");
  }
}

/** Remove a contender from an arena. Refuses once it has taken votes. */
export async function removeContenderFromRoom(
  roomId: string,
  contenderId: string
): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: link } = await supabase
      .from("room_contenders")
      .select("id, current_votes")
      .eq("id", contenderId)
      .maybeSingle();

    if (!link) return { ok: false, error: "Contender not found in this arena." };

    if (Number(link.current_votes) > 0) {
      return {
        ok: false,
        error: "This contender has taken votes — removing them would orphan those pledges.",
      };
    }

    const { error } = await supabase.from("room_contenders").delete().eq("id", contenderId);
    if (error) throw error;

    revalidatePath(`/admin/arenas/${roomId}`);
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not remove the contender.");
  }
}
