import { createClient } from "@/utils/supabase/server";

export type LandingContender = {
  name: string;
  image_url: string | null;
  brand_color: string | null;
  current_votes: number;
  seed_index: number;
};

export type LandingRoom = {
  id: string;
  title: string;
  category: string;
  room_type: "1v1" | "global";
  total_pool: number;
  expires_at: string;
  is_featured: boolean;
  contenders: LandingContender[];
  /** Rooms have no cover column, so the leading contender's art stands in. */
  cover_image: string | null;
  vote_count: number;
};

const SELECT = `
  id,
  title,
  category,
  room_type,
  total_pool,
  expires_at,
  created_at,
  is_featured,
  featured_rank,
  room_contenders (
    current_votes,
    seed_index,
    entities (
      name,
      image_url,
      brand_color
    )
  )
`;

type RawRoom = {
  id: string;
  title: string;
  category: string;
  room_type: string;
  total_pool: number | string;
  expires_at: string;
  is_featured?: boolean;
  featured_rank?: number | null;
  room_contenders?: {
    current_votes: number | string;
    seed_index: number;
    entities: { name: string; image_url: string | null; brand_color: string | null } | null;
  }[];
};

function shape(room: RawRoom, voteCounts: Map<string, number>): LandingRoom {
  // seed_index fixes display order — never rely on row order coming back.
  const contenders = (room.room_contenders ?? [])
    .filter((rc) => rc.entities)
    .sort((a, b) => a.seed_index - b.seed_index)
    .map((rc) => ({
      name: rc.entities!.name,
      image_url: rc.entities!.image_url,
      brand_color: rc.entities!.brand_color,
      current_votes: Number(rc.current_votes) || 0,
      seed_index: rc.seed_index,
    }));

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    room_type: room.room_type === "global" ? "global" : "1v1",
    total_pool: Number(room.total_pool) || 0,
    expires_at: room.expires_at,
    is_featured: Boolean(room.is_featured),
    contenders,
    cover_image: contenders.find((c) => c.image_url)?.image_url ?? null,
    vote_count: voteCounts.get(room.id) ?? 0,
  };
}

/** Vote tallies per room, in one round-trip rather than one query per card. */
async function getVoteCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomIds: string[]
): Promise<Map<string, number>> {
  if (roomIds.length === 0) return new Map();

  const { data } = await supabase
    .from("votes")
    .select("room_id")
    .in("room_id", roomIds)
    .eq("refunded", false);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Rooms for the hero carousel.
 *
 * Admin-pinned arenas win (is_featured, ordered by featured_rank). When
 * nothing is pinned it falls back to the biggest live pools, so the hero is
 * never empty just because nobody has curated it yet.
 */
export async function getFeaturedRooms(limit = 4): Promise<LandingRoom[]> {
  const supabase = await createClient();

  const { data: pinned } = await supabase
    .from("rooms")
    .select(SELECT)
    .eq("status", "active")
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true })
    .limit(limit);

  let rooms = (pinned ?? []) as unknown as RawRoom[];

  if (rooms.length < limit) {
    const { data: fallback } = await supabase
      .from("rooms")
      .select(SELECT)
      .eq("status", "active")
      .order("total_pool", { ascending: false })
      .limit(limit);

    const seen = new Set(rooms.map((r) => r.id));
    rooms = [
      ...rooms,
      ...((fallback ?? []) as unknown as RawRoom[]).filter((r) => !seen.has(r.id)),
    ].slice(0, limit);
  }

  const counts = await getVoteCounts(supabase, rooms.map((r) => r.id));

  // A 1v1 card with only one contender renders broken, so drop those.
  return rooms
    .map((r) => shape(r, counts))
    .filter((r) => r.room_type === "global" || r.contenders.length >= 2);
}

/** Active global (1-vs-many) arenas, biggest pool first. */
export async function getGlobalRooms(limit = 12): Promise<LandingRoom[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("rooms")
    .select(SELECT)
    .eq("status", "active")
    .eq("room_type", "global")
    .order("total_pool", { ascending: false })
    .limit(limit);

  const rooms = (data ?? []) as unknown as RawRoom[];
  const counts = await getVoteCounts(supabase, rooms.map((r) => r.id));

  return rooms.map((r) => shape(r, counts));
}
