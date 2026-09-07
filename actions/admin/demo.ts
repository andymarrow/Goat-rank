"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";
import { generatedAvatar } from "@/lib/avatar";
import { colorForIndex } from "@/lib/palette";

/**
 * Demo arenas and bot accounts.
 *
 * Seeds ordinary rows flagged `is_demo` / `is_bot` rather than rendering
 * fixtures from a constants file, so the admin console can edit, moderate and
 * delete them through the panels that already exist.
 *
 * Every bot is disclosed in the UI with a marker, and demo pledges are kept
 * out of financial reporting.
 */

const BOT_NAMES = [
  "Ridge", "Willow", "Thorn", "Fell", "Cinder", "Vale", "Ash", "Bram",
  "Wren", "Slate", "Rook", "Juno", "Kestrel", "Marlow", "Onyx", "Piper",
];

const CRIES = [
  "Not even close. Settle it.",
  "The numbers don't lie.",
  "Been saying this for years.",
  "Respectfully, you're all wrong.",
  "This one's personal.",
  "Backing this to the end.",
  "History will remember.",
  "Put your money where your mouth is.",
  "Watched every game. No contest.",
  "Come back when you've done the reading.",
  "Ice in the veins.",
  "One more push and it's over.",
];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

export type DemoRoomInput = {
  title: string;
  category: string;
  roomType: "1v1" | "global";
  contenders: { name: string; image?: string; color?: string }[];
  /** How many bot battle cries to attach. */
  cries?: number;
  featured?: boolean;
};

/** Ensure a pool of bot profiles exists, and return their ids. */
async function ensureBots(count: number): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("is_bot", true)
    .limit(count);

  const bots = [...(existing ?? [])];

  for (let i = bots.length; i < count; i++) {
    const name = `${pick(BOT_NAMES, i)}${i > BOT_NAMES.length - 1 ? i : ""}`;

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        username: name,
        avatar_url: generatedAvatar(name),
        is_bot: true,
        bot_persona: "Demo supporter",
      })
      .select("id, username")
      .single();

    if (error) {
      console.error("Bot creation failed:", error);
      break;
    }
    if (data) bots.push(data);
  }

  return bots.map((b) => b.id);
}

/** Create one demo arena, its contenders, and its bot battle cries. */
export async function createDemoRoom(
  input: DemoRoomInput
): Promise<AdminResult<{ roomId: string }>> {
  try {
    await requireAdmin();

    const title = input.title?.trim();
    const category = input.category?.trim();
    if (!title || !category) return { ok: false, error: "Title and category are required." };

    const contenders = (input.contenders ?? []).filter((c) => c.name?.trim());
    if (input.roomType === "1v1" && contenders.length !== 2) {
      return { ok: false, error: "A 1v1 demo needs exactly 2 contenders." };
    }
    if (contenders.length < 2) return { ok: false, error: "Needs at least 2 contenders." };

    const supabase = createAdminClient();

    // creator_id null: a demo arena must never pay a real creator commission.
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        title: title.slice(0, 120),
        category: category.slice(0, 60),
        room_type: input.roomType,
        status: "active",
        creator_id: null,
        is_demo: true,
        charity_name: "Demo Arena",
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        is_featured: Boolean(input.featured),
        featured_rank: input.featured ? 0 : null,
      })
      .select("id")
      .single();

    if (roomError || !room) throw roomError ?? new Error("Demo room insert returned nothing");

    // Contenders, also flagged demo so they can be told apart in the roster.
    const { data: entities, error: entityError } = await supabase
      .from("entities")
      .insert(
        contenders.map((c, i) => ({
          name: c.name.trim().slice(0, 80),
          category: category.slice(0, 60),
          brand_color: c.color ?? colorForIndex(i),
          image_url: c.image ?? null,
          moderation_status: "approved" as const,
          is_demo: true,
        }))
      )
      .select("id");

    if (entityError || !entities?.length) throw entityError ?? new Error("No demo entities");

    const { data: links, error: linkError } = await supabase
      .from("room_contenders")
      .insert(
        entities.map((e, i) => ({ room_id: room.id, entity_id: e.id, seed_index: i }))
      )
      .select("id");

    if (linkError) throw linkError;

    // Bot battle cries. These insert into `votes`, so handle_new_vote fills the
    // demo room's pool exactly as a real vote would — the difference is the
    // is_demo flag, which keeps them out of revenue reporting.
    const cryCount = Math.min(Math.max(input.cries ?? 6, 0), 40);

    if (cryCount > 0 && links?.length) {
      const botIds = await ensureBots(Math.min(cryCount, 12));

      if (botIds.length > 0) {
        const { data: bots } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", botIds);

        const rows = Array.from({ length: cryCount }, (_, i) => {
          const bot = (bots ?? [])[i % (bots?.length || 1)];
          const amount = [3, 5, 5, 10, 20, 25, 50][i % 7];

          return {
            polar_transaction_id: `demo-${room.id}-${i}`,
            room_id: room.id,
            contender_id: pick(links, i).id,
            voter_id: bot?.id ?? null,
            amount,
            voter_name: bot?.username ?? "Demo",
            voter_avatar: bot?.avatar_url ?? null,
            message: pick(CRIES, i),
            is_demo: true,
            created_at: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
          };
        });

        const { error: voteError } = await supabase.from("votes").insert(rows);
        if (voteError) console.error("Demo cries failed:", voteError);
      }
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return { ok: true, data: { roomId: room.id } };
  } catch (error) {
    return adminError(error, "Could not create the demo arena.");
  }
}

/**
 * Delete a demo arena and everything it owns.
 *
 * Refuses on a live arena — this is the one place a delete cascades through
 * votes, and doing that to real money would be unrecoverable.
 */
export async function deleteDemoRoom(roomId: string): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, is_demo")
      .eq("id", roomId)
      .single();

    if (!room) return { ok: false, error: "Arena not found." };
    if (!room.is_demo) {
      return { ok: false, error: "That is a live arena — delete it from Arenas instead." };
    }

    const { data: links } = await supabase
      .from("room_contenders")
      .select("entity_id")
      .eq("room_id", roomId);

    await supabase.from("votes").delete().eq("room_id", roomId);
    await supabase.from("room_contenders").delete().eq("room_id", roomId);
    await supabase.from("rooms").delete().eq("id", roomId);

    // Only remove demo entities, and only if no other room still uses them.
    for (const l of links ?? []) {
      const { count } = await supabase
        .from("room_contenders")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", l.entity_id);

      if ((count ?? 0) === 0) {
        await supabase.from("entities").delete().eq("id", l.entity_id).eq("is_demo", true);
      }
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the demo arena.");
  }
}

/** Add more bot battle cries to an existing demo arena. */
export async function addDemoCries(
  roomId: string,
  count = 5
): Promise<AdminResult<{ added: number }>> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, is_demo")
      .eq("id", roomId)
      .single();

    if (!room?.is_demo) return { ok: false, error: "Only demo arenas can take bot cries." };

    const { data: links } = await supabase
      .from("room_contenders")
      .select("id")
      .eq("room_id", roomId);

    if (!links?.length) return { ok: false, error: "That arena has no contenders." };

    const { count: existing } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);

    const offset = existing ?? 0;
    const botIds = await ensureBots(8);

    const { data: bots } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", botIds);

    const rows = Array.from({ length: Math.min(Math.max(count, 1), 20) }, (_, i) => {
      const bot = (bots ?? [])[(offset + i) % (bots?.length || 1)];
      return {
        polar_transaction_id: `demo-${roomId}-${offset + i}`,
        room_id: roomId,
        contender_id: pick(links, offset + i).id,
        voter_id: bot?.id ?? null,
        amount: [3, 5, 10, 20, 50][(offset + i) % 5],
        voter_name: bot?.username ?? "Demo",
        voter_avatar: bot?.avatar_url ?? null,
        message: pick(CRIES, offset + i),
        is_demo: true,
      };
    });

    const { error } = await supabase.from("votes").insert(rows);
    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath(`/battle/${roomId}`);
    revalidatePath(`/global/${roomId}`);
    return { ok: true, data: { added: rows.length } };
  } catch (error) {
    return adminError(error, "Could not add bot cries.");
  }
}

export type DemoRoomRow = {
  id: string;
  title: string;
  category: string;
  room_type: string;
  total_pool: number;
  is_featured: boolean;
  created_at: string;
  cries: number;
};

export async function listDemoRooms(): Promise<DemoRoomRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, title, category, room_type, total_pool, is_featured, created_at")
    .eq("is_demo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listDemoRooms failed:", error);
    return [];
  }

  const rooms = data ?? [];
  if (rooms.length === 0) return [];

  const { data: votes } = await supabase
    .from("votes")
    .select("room_id")
    .in("room_id", rooms.map((r) => r.id));

  const counts = new Map<string, number>();
  for (const v of votes ?? []) counts.set(v.room_id, (counts.get(v.room_id) ?? 0) + 1);

  return rooms.map((r) => ({
    ...r,
    total_pool: Number(r.total_pool) || 0,
    cries: counts.get(r.id) ?? 0,
  }));
}
