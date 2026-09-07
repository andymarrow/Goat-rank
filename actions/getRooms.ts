import { createClient } from "@/utils/supabase/server";
import { ROOM_SORTS, type RoomSort } from "@/lib/constants";
import { MOCK_1V1_ROOMS, MOCK_GLOBAL_ROOMS } from "@/lib/mockData";

const SELECT = `
  id,
  title,
  category,
  total_pool,
  expires_at,
  created_at,
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

/**
 * Active 1v1 arenas for the homepage rail.
 */
export async function getActive1v1Rooms(
  sort: RoomSort = "hot",
  category?: string,
  includeMock = false
) {
  let dbData: any[] = [];
  try {
    const supabase = await createClient();
    const { column, ascending } = ROOM_SORTS[sort] ?? ROOM_SORTS.hot;

    let query = supabase
      .from("rooms")
      .select(SELECT)
      .eq("status", "active")
      .eq("room_type", "1v1");

    if (category && category !== "all") {
      query = query.ilike("category", category);
    }

    if (sort === "closing") {
      query = query.gte("expires_at", new Date().toISOString());
    }

    const { data, error } = await query.order(column, { ascending }).limit(40);
    if (!error && data) {
      dbData = data;
    }
  } catch (error) {
    console.error("Error fetching rooms from Supabase:", error);
  }

  let combined = [...dbData];

  if (includeMock) {
    const dbIds = new Set(dbData.map((r) => r.id));
    let filteredMocks = MOCK_1V1_ROOMS.filter((m) => !dbIds.has(m.id));

    if (category && category !== "all") {
      filteredMocks = filteredMocks.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }
    combined = [...dbData, ...filteredMocks];
  }

  // Apply sorting
  if (sort === "hot") {
    combined.sort((a, b) => (b.total_pool || 0) - (a.total_pool || 0));
  } else if (sort === "new") {
    combined.sort(
      (a, b) =>
        new Date(b.created_at || b.expires_at).getTime() -
        new Date(a.created_at || a.expires_at).getTime()
    );
  } else if (sort === "closing") {
    combined.sort(
      (a, b) =>
        new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    );
  }

  return combined;
}

/** Distinct categories that actually have a live arena behind them. */
export async function getLiveCategories(includeMock = false): Promise<string[]> {
  let dbCategories: string[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("category")
      .eq("status", "active");

    if (!error && data) {
      dbCategories = data.map((r) => r.category).filter(Boolean);
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  const mockCategories = includeMock
    ? [
        ...MOCK_1V1_ROOMS.map((r) => r.category),
        ...MOCK_GLOBAL_ROOMS.map((r) => r.category),
      ]
    : [];

  return [...new Set([...dbCategories, ...mockCategories])].sort();
}
