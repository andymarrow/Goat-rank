"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";
import { generatedAvatar } from "@/lib/avatar";
import { colorForIndex } from "@/lib/palette";
import { STARTER_ARENAS } from "@/lib/starterArenas";
import { VIRAL_ARENAS } from "@/lib/viralArenas";

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
    //
    // Reused by name where one already exists: entities are global, so a name
    // that appears in two arenas — "Claude Code" in both the head-to-head and
    // the agent leaderboard — has to be one profile with one lifetime total,
    // not two rows splitting the same reputation.
    const names = contenders.map((c) => c.name.trim().slice(0, 80));

    const { data: existingEntities } = await supabase
      .from("entities")
      .select("id, name")
      .in("name", names);

    const byName = new Map(
      (existingEntities ?? []).map((e) => [e.name.toLowerCase(), e.id as string])
    );

    const fresh = contenders
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !byName.has(c.name.trim().toLowerCase()));

    if (fresh.length > 0) {
      const { data: created, error: entityError } = await supabase
        .from("entities")
        .insert(
          fresh.map(({ c, i }) => ({
            name: c.name.trim().slice(0, 80),
            category: category.slice(0, 60),
            brand_color: c.color ?? colorForIndex(i),
            image_url: c.image ?? null,
            moderation_status: "approved" as const,
            is_demo: true,
          }))
        )
        .select("id, name");

      if (entityError || !created?.length) throw entityError ?? new Error("No demo entities");

      for (const e of created) byName.set(e.name.toLowerCase(), e.id);
    }

    const entityIds = names
      .map((n) => byName.get(n.toLowerCase()))
      .filter((id): id is string => Boolean(id));

    if (entityIds.length === 0) throw new Error("No demo entities");

    const { data: links, error: linkError } = await supabase
      .from("room_contenders")
      .insert(entityIds.map((id, i) => ({ room_id: room.id, entity_id: id, seed_index: i })))
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

export type BotRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bot_persona: string | null;
  cries: number;
  created_at: string;
};

export async function listBots(): Promise<BotRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bot_persona, created_at")
    .eq("is_bot", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listBots failed:", error);
    return [];
  }

  const bots = data ?? [];
  if (bots.length === 0) return [];

  const { data: votes } = await supabase
    .from("votes")
    .select("voter_id")
    .in("voter_id", bots.map((b) => b.id));

  const counts = new Map<string, number>();
  for (const v of votes ?? []) {
    if (v.voter_id) counts.set(v.voter_id, (counts.get(v.voter_id) ?? 0) + 1);
  }

  return bots.map((b) => ({ ...b, cries: counts.get(b.id) ?? 0 }));
}

/** Rename a bot or change the persona line shown on its profile. */
export async function updateBot(
  botId: string,
  patch: { username?: string; persona?: string }
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const clean: Record<string, string> = {};
    if (patch.username?.trim()) clean.username = patch.username.trim().slice(0, 24);
    if (patch.persona !== undefined) clean.bot_persona = patch.persona.trim().slice(0, 80);

    if (Object.keys(clean).length === 0) return { ok: false, error: "Nothing to update." };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update(clean)
      .eq("id", botId)
      .eq("is_bot", true); // never let this touch a real account

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: "That name is taken." };
      }
      throw error;
    }

    revalidatePath("/admin/demo");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the bot.");
  }
}

/**
 * Remove every trace of the demo layer.
 *
 * The point of seeded content is to be temporary — this is the exit. Deletes
 * demo votes, demo rooms and their contenders, then the bot accounts. Refuses
 * to touch anything not flagged demo.
 */
export async function purgeDemoContent(): Promise<
  AdminResult<{ rooms: number; cries: number; bots: number }>
> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: rooms } = await supabase.from("rooms").select("id").eq("is_demo", true);
    const roomIds = (rooms ?? []).map((r) => r.id);

    let cries = 0;
    if (roomIds.length > 0) {
      const { count } = await supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .in("room_id", roomIds);
      cries = count ?? 0;

      await supabase.from("votes").delete().in("room_id", roomIds);
      await supabase.from("room_contenders").delete().in("room_id", roomIds);
      await supabase.from("rooms").delete().in("id", roomIds);
    }

    // Demo entities no longer attached to any room.
    const { data: orphans } = await supabase.from("entities").select("id").eq("is_demo", true);
    for (const e of orphans ?? []) {
      const { count } = await supabase
        .from("room_contenders")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", e.id);
      if ((count ?? 0) === 0) {
        await supabase.from("entities").delete().eq("id", e.id).eq("is_demo", true);
      }
    }

    const { data: bots } = await supabase.from("profiles").select("id").eq("is_bot", true);
    await supabase.from("profiles").delete().eq("is_bot", true);

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return {
      ok: true,
      data: { rooms: roomIds.length, cries, bots: (bots ?? []).length },
    };
  } catch (error) {
    return adminError(error, "Could not purge demo content.");
  }
}

/** Add any catalogue category the registry is missing, in catalogue order. */
async function registerCategories(arenas: { category: string }[]): Promise<void> {
  const supabase = createAdminClient();

  const { data: known } = await supabase.from("categories").select("slug, sort_order");
  const bySlug = new Set((known ?? []).map((c) => c.slug));
  let order = Math.max(0, ...(known ?? []).map((c) => Number(c.sort_order) || 0));

  const slugify = (label: string) =>
    label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

  const rows = [];
  for (const label of new Set(arenas.map((a) => a.category))) {
    const slug = slugify(label);
    if (!slug || bySlug.has(slug)) continue;

    bySlug.add(slug);
    order += 10;
    rows.push({ slug, label, sort_order: order, is_active: true });
  }

  if (rows.length === 0) return;

  const { error } = await supabase.from("categories").insert(rows);
  // A missing category is cosmetic — never fail the seed over it.
  if (error) console.error("registerCategories failed:", error);
}

/** Which catalogue to seed — evergreen, the X launch set, or both. */
export type CatalogueKey = "classic" | "viral" | "all";

const CATALOGUES = {
  classic: STARTER_ARENAS,
  viral: VIRAL_ARENAS,
  all: [...STARTER_ARENAS, ...VIRAL_ARENAS],
};

/**
 * Seed a catalogue of arenas in one action.
 *
 * The original fixtures rendered straight from a constants file, so deleting
 * that file left the feed empty. This creates each of them as a real demo
 * room instead. Skips any title already seeded, so it is safe to re-run and
 * safe to run one catalogue after the other.
 */
export async function seedStarterArenas(
  catalogue: CatalogueKey = "classic"
): Promise<AdminResult<{ created: number; skipped: number }>> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("rooms")
      .select("title")
      .eq("is_demo", true);

    const seen = new Set((existing ?? []).map((r) => r.title.toLowerCase()));

    // rooms.category is free text, so a new catalogue can introduce one the
    // registry has never heard of — Politics, Culture. The homepage builds its
    // filter from live rooms and would show them either way, but the admin
    // dropdowns read this table, so register them here rather than leaving the
    // console unable to name a category it just seeded.
    await registerCategories(CATALOGUES[catalogue] ?? STARTER_ARENAS);

    let created = 0;
    let skipped = 0;

    for (const arena of CATALOGUES[catalogue] ?? STARTER_ARENAS) {
      if (seen.has(arena.title.toLowerCase())) {
        skipped++;
        continue;
      }

      const res = await createDemoRoom({
        title: arena.title,
        category: arena.category,
        roomType: arena.roomType,
        contenders: arena.contenders,
        cries: arena.cries,
        featured: arena.featured,
      });

      if (res.ok) created++;
      else console.error(`Seeding "${arena.title}" failed:`, res.error);
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return { ok: true, data: { created, skipped } };
  } catch (error) {
    return adminError(error, "Could not seed the starter arenas.");
  }
}

/**
 * Place a chosen set of bots behind chosen contenders for chosen amounts.
 *
 * The bulk "+5 cries" helper picks bots, targets and amounts at random, which
 * fills a room but can't produce a particular result — a close race, a clear
 * leader, a named supporter on a named side at a named price. Each assignment
 * carries its own contender and amount so one call can stage a whole arena.
 */
export type BotAssignment = {
  botId: string;
  contenderId: string;
  amount: number;
  message?: string;
};

export async function assignBotsToArena(input: {
  roomId: string;
  assignments: BotAssignment[];
}): Promise<AdminResult<{ placed: number; total: number }>> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    if (input.assignments.length === 0) {
      return { ok: false, error: "Pick at least one bot." };
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("id, is_demo, room_type")
      .eq("id", input.roomId)
      .single();

    if (!room) return { ok: false, error: "Arena not found." };

    // The DB guard enforces this too, but failing here gives a clearer reason
    // than a raised exception from the trigger.
    if (!room.is_demo) {
      return {
        ok: false,
        error: "Bots can only back demo arenas — a live arena must take real pledges.",
      };
    }

    const [{ data: bots }, { data: links }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, avatar_url, is_bot")
        .in("id", input.assignments.map((a) => a.botId)),
      supabase.from("room_contenders").select("id").eq("room_id", input.roomId),
    ]);

    const botById = new Map((bots ?? []).map((b) => [b.id, b]));
    const validContenders = new Set((links ?? []).map((l) => l.id));

    const rows = [];
    let total = 0;

    for (const a of input.assignments) {
      const amount = Number(a.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: "Every pledge needs an amount greater than zero." };
      }

      const bot = botById.get(a.botId);
      if (!bot?.is_bot) return { ok: false, error: "One of those accounts is not a bot." };

      if (!validContenders.has(a.contenderId)) {
        return { ok: false, error: `Pick a contender for ${bot.username ?? "each bot"}.` };
      }

      total += amount;
      rows.push({
        // Unique per bot per call; the column is the payment idempotency key.
        polar_transaction_id: `demo-${input.roomId}-${a.botId}-${Date.now()}`,
        room_id: input.roomId,
        contender_id: a.contenderId,
        voter_id: bot.id,
        amount,
        voter_name: bot.username ?? "Demo",
        voter_avatar: bot.avatar_url ?? null,
        message: a.message?.trim().slice(0, 150) || null,
        is_demo: true,
      });
    }

    // One statement, so the pool moves in a single transaction — the row
    // trigger still fires per row and does all the accounting.
    const { error } = await supabase.from("votes").insert(rows);
    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath(`/${room.room_type === "global" ? "global" : "battle"}/${input.roomId}`);
    revalidatePath("/");
    return { ok: true, data: { placed: rows.length, total } };
  } catch (error) {
    return adminError(error, "Could not place those bot pledges.");
  }
}

export type DemoContenderOption = {
  contenderId: string;
  name: string;
};

/** Contenders in a demo arena, for the assignment picker. */
export async function listDemoContenders(roomId: string): Promise<DemoContenderOption[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("room_contenders")
    .select("id, seed_index, entities ( name )")
    .eq("room_id", roomId)
    .order("seed_index", { ascending: true });

  if (error) {
    console.error("listDemoContenders failed:", error);
    return [];
  }

  return (data ?? []).map((c) => ({
    contenderId: c.id,
    name: (c.entities as unknown as { name?: string } | null)?.name ?? "Contender",
  }));
}
