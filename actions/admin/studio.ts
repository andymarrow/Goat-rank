"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

import { colorForIndex, HEX_RE as HEX } from "@/lib/palette";

export type SeedContender = { name: string; color?: string; image?: string };

/**
 * God-mode deploy: create an arena directly, skipping checkout.
 *
 * Rooms made here land as `active` with creator_id null. Null creator is
 * deliberate — handle_new_vote() only pays a 10% commission when creator_id
 * is set, so a house arena keeps the full pool instead of paying you a
 * commission on your own room.
 */
export async function deployHouseArena(input: {
  title: string;
  category: string;
  roomType: "1v1" | "global";
  charityId?: string;
  charityName?: string;
  durationDays?: number;
  featured?: boolean;
  contenders: SeedContender[];
}): Promise<AdminResult<{ roomId: string; seeded: number }>> {
  try {
    await requireAdmin();

    const title = input.title?.trim();
    const category = input.category?.trim();

    if (!title || !category) return { ok: false, error: "Title and category are required." };

    const contenders = (input.contenders ?? []).filter((c) => c.name?.trim());

    if (input.roomType === "1v1" && contenders.length !== 2) {
      return { ok: false, error: "A 1v1 arena needs exactly 2 contenders." };
    }
    if (input.roomType === "global" && contenders.length < 2) {
      return { ok: false, error: "A global arena needs at least 2 contenders." };
    }

    const supabase = createAdminClient();
    const days = Math.min(Math.max(input.durationDays ?? 7, 1), 90);

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        title: title.slice(0, 120),
        category: category.slice(0, 60),
        room_type: input.roomType,
        status: "active", // no checkout — this is the house deploying
        creator_id: null,
        charity_id: input.charityId ?? null,
        charity_name: input.charityName?.trim().slice(0, 120) ?? "House Arena",
        expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
        is_featured: Boolean(input.featured),
        featured_rank: input.featured ? 0 : null,
      })
      .select("id")
      .single();

    if (roomError || !room) throw roomError ?? new Error("Room insert returned nothing");

    const seeded = await seedContenders(room.id, category, contenders, 0);

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, data: { roomId: room.id, seeded } };
  } catch (error) {
    return adminError(error, "Could not deploy the arena.");
  }
}

/**
 * Bulk-seed contenders into an existing global room.
 *
 * Accepts up to 100 at a time. Entities and room_contenders are each written
 * in one batched insert rather than a loop of round-trips.
 */
export async function seedGlobalRoom(
  roomId: string,
  contenders: SeedContender[]
): Promise<AdminResult<{ seeded: number }>> {
  try {
    await requireAdmin();

    const clean = (contenders ?? []).filter((c) => c.name?.trim()).slice(0, 100);
    if (clean.length === 0) return { ok: false, error: "No contender names given." };

    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, category")
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;
    if (!room) return { ok: false, error: "Arena not found." };

    const { count } = await supabase
      .from("room_contenders")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);

    const seeded = await seedContenders(roomId, room.category, clean, count ?? 0);

    revalidatePath("/admin");
    revalidatePath(`/global/${roomId}`);
    return { ok: true, data: { seeded } };
  } catch (error) {
    return adminError(error, "Could not seed the arena.");
  }
}

/** Shared insert path for both deploy and seed. Returns how many landed. */
async function seedContenders(
  roomId: string,
  category: string,
  contenders: SeedContender[],
  seedOffset: number
): Promise<number> {
  const supabase = createAdminClient();

  const { data: entities, error: entityError } = await supabase
    .from("entities")
    .insert(
      contenders.map((c, i) => ({
        name: c.name.trim().slice(0, 80),
        category: category.slice(0, 60),
        brand_color: HEX.test(c.color ?? "") ? c.color : colorForIndex(seedOffset + i),
        image_url: c.image?.trim() || null,
        moderation_status: "approved" as const,
      }))
    )
    .select("id");

  if (entityError) throw entityError;
  if (!entities?.length) return 0;

  const { error: linkError } = await supabase.from("room_contenders").insert(
    entities.map((e, i) => ({
      room_id: roomId,
      entity_id: e.id,
      seed_index: seedOffset + i,
    }))
  );

  if (linkError) throw linkError;

  return entities.length;
}

/**
 * Parse the quick-add textarea. One contender per line:
 *   Name
 *   Name | #RRGGBB
 *   Name | #RRGGBB | https://images.unsplash.com/...
 */
export async function parseSeedList(raw: string): Promise<SeedContender[]> {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, color, image] = line.split("|").map((p) => p?.trim());
      return { name, color: color || undefined, image: image || undefined };
    })
    .filter((c) => c.name);
}
