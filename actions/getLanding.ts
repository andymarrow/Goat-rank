import { createClient } from "@/utils/supabase/server";
import { MOCK_GLOBAL_ROOMS, MOCK_1V1_ROOMS } from "@/lib/mockData";

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

  try {
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
  } catch (err) {
    return new Map();
  }
}

/** Convert raw 1v1 mock object to LandingRoom format */
function mock1v1ToLandingRoom(m: any): LandingRoom {
  const contenders = (m.room_contenders || [])
    .map((rc: any) => ({
      name: rc.entities.name,
      image_url: rc.entities.image_url,
      brand_color: rc.entities.brand_color,
      current_votes: rc.current_votes,
      seed_index: rc.seed_index,
    }))
    .sort((a: any, b: any) => a.seed_index - b.seed_index);

  return {
    id: m.id,
    title: m.title,
    category: m.category,
    room_type: "1v1",
    total_pool: m.total_pool,
    expires_at: m.expires_at,
    is_featured: true,
    contenders,
    cover_image: contenders[0]?.image_url || null,
    vote_count: Math.floor(m.total_pool / 25),
  };
}

/**
 * Rooms for the hero carousel.
 */
export async function getFeaturedRooms(limit = 4, includeMock = false): Promise<LandingRoom[]> {
  let dbRooms: LandingRoom[] = [];
  try {
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

    dbRooms = rooms
      .map((r) => shape(r, counts))
      .filter((r) => r.room_type === "global" || r.contenders.length >= 2);
  } catch (error) {
    console.error("Error fetching featured rooms from Supabase:", error);
  }

  let combined = [...dbRooms];

  if (includeMock) {
    const mockFeatured = [
      ...MOCK_GLOBAL_ROOMS.filter((r) => r.is_featured),
      ...MOCK_1V1_ROOMS.map(mock1v1ToLandingRoom),
    ];

    const seenIds = new Set(dbRooms.map((r) => r.id));
    for (const m of mockFeatured) {
      if (!seenIds.has(m.id)) {
        combined.push(m);
        seenIds.add(m.id);
      }
    }
  }

  return combined.slice(0, limit);
}

/** Active global (1-vs-many) arenas, biggest pool first. */
export async function getGlobalRooms(limit = 12, includeMock = false): Promise<LandingRoom[]> {
  let dbRooms: LandingRoom[] = [];
  try {
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

    dbRooms = rooms.map((r) => shape(r, counts));
  } catch (error) {
    console.error("Error fetching global rooms from Supabase:", error);
  }

  let combined = [...dbRooms];

  if (includeMock) {
    const dbIds = new Set(dbRooms.map((r) => r.id));
    const filteredMocks = MOCK_GLOBAL_ROOMS.filter((m) => !dbIds.has(m.id));
    combined = [...dbRooms, ...filteredMocks];
  }

  return combined.slice(0, limit);
}
