"use server";

import { createClient } from "@/utils/supabase/server";

export type SearchArena = {
  id: string;
  title: string;
  category: string;
  room_type: string;
  status: string;
  total_pool: number;
  expires_at: string;
  is_demo: boolean;
  leader: string | null;
};

export type SearchContender = {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  brand_color: string | null;
  lifetime_raised: number;
  arenas: number;
};

export type SearchPerson = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_earned: number;
  is_bot: boolean;
};

export type SearchResults = {
  arenas: SearchArena[];
  contenders: SearchContender[];
  people: SearchPerson[];
};

const EMPTY: SearchResults = { arenas: [], contenders: [], people: [] };

/** PostgREST treats these as pattern syntax inside ilike. */
const escape = (q: string) => q.replace(/[%_,()]/g, " ").trim();

/**
 * One search across everything the site holds.
 *
 * A visitor arrives from a post about one argument and wants to find it, or
 * the contender in it, or the person who staged it — three different tables.
 * Searching each separately and merging beats a database view here: the three
 * result kinds are ranked on different things (a pool, a lifetime total, an
 * earned total) and are shown in their own groups, so there is nothing to gain
 * from a single ordered list.
 *
 * Empty query is not an empty answer: it returns what is currently biggest,
 * which is what makes the overlay useful before anyone types.
 */
export async function searchEverything(
  rawQuery: string,
  category?: string
): Promise<SearchResults> {
  const supabase = await createClient();
  const q = escape(rawQuery ?? "");
  const cat = category && category !== "all" ? category : null;

  try {
    let arenaQuery = supabase
      .from("rooms")
      .select(
        `id, title, category, room_type, status, total_pool, expires_at, is_demo,
         room_contenders ( current_votes, entities ( name ) )`
      )
      .eq("status", "active");

    if (q) arenaQuery = arenaQuery.ilike("title", `%${q}%`);
    if (cat) arenaQuery = arenaQuery.ilike("category", cat);

    let contenderQuery = supabase
      .from("entities")
      .select("id, name, category, image_url, brand_color, lifetime_raised")
      .eq("moderation_status", "approved");

    if (q) contenderQuery = contenderQuery.ilike("name", `%${q}%`);
    if (cat) contenderQuery = contenderQuery.ilike("category", cat);

    // People are not categorised, so a category filter simply excludes them
    // rather than returning everyone under a heading that cannot apply.
    const peopleQuery = cat
      ? null
      : supabase
          .from("profiles")
          .select("id, username, avatar_url, total_earned, is_bot")
          .eq("is_banned", false)
          .not("username", "is", null)
          .order("total_earned", { ascending: false })
          .limit(6);

    const [arenas, contenders, people] = await Promise.all([
      arenaQuery.order("total_pool", { ascending: false }).limit(8),
      contenderQuery.order("lifetime_raised", { ascending: false }).limit(8),
      peopleQuery
        ? (q ? peopleQuery.ilike("username", `%${q}%`) : peopleQuery)
        : Promise.resolve({ data: [], error: null }),
    ]);

    return {
      arenas: (arenas.data ?? []).map((r) => {
        const top = [...(r.room_contenders ?? [])].sort(
          (a, b) => (Number(b.current_votes) || 0) - (Number(a.current_votes) || 0)
        )[0];

        return {
          id: r.id,
          title: r.title,
          category: r.category,
          room_type: r.room_type,
          status: r.status,
          total_pool: Number(r.total_pool) || 0,
          expires_at: r.expires_at,
          is_demo: Boolean(r.is_demo),
          leader:
            (top?.entities as unknown as { name?: string } | null)?.name ?? null,
        };
      }),

      contenders: (contenders.data ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        image_url: e.image_url,
        brand_color: e.brand_color,
        lifetime_raised: Number(e.lifetime_raised) || 0,
        arenas: 0,
      })),

      people: (people.data ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        total_earned: Number(p.total_earned) || 0,
        is_bot: Boolean(p.is_bot),
      })),
    };
  } catch (error) {
    console.error("searchEverything failed:", error);
    return EMPTY;
  }
}
