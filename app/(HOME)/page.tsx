import { Suspense } from "react";
import HeroCarousel from "./_components/HeroCarousel";
import GlobalLeaderboardsRow from "./_components/GlobalLeaderboardsRow";
import FaceOffsRow from "./_components/FaceOffsRow";
import ArenaFilters from "./_components/ArenaFilters";
import { getActive1v1Rooms, getLiveCategories } from "@/actions/getRooms";
import { getFeaturedRooms, getGlobalRooms } from "@/actions/getLanding";
import { isRoomSort } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; mock?: string }>;
}) {
  // searchParams is a Promise in this version and must be awaited.
  const params = await searchParams;

  const sort = isRoomSort(params.sort) ? params.sort : "hot";
  const category = params.category ?? "all";

  const [live1v1Battles, categories, featured, globalRooms] = await Promise.all([
    getActive1v1Rooms(sort, category),
    getLiveCategories(),
    getFeaturedRooms(4),
    getGlobalRooms(12),
  ]);

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* HERO SECTION */}
      {featured.length > 0 && (
        <section className="w-full pt-4">
          <HeroCarousel rooms={featured} />
        </section>
      )}

      <section className="w-full pt-2">
        {/* useSearchParams needs a Suspense boundary during streaming. */}
        <Suspense fallback={<div className="h-9" />}>
          <ArenaFilters sort={sort} category={category} categories={categories} />
        </Suspense>
      </section>

      {/* Head-to-heads lead: two things to compare creates more urgency than a
          field of many, so the 1v1 rail sits above the global leaderboards. */}
      <FaceOffsRow liveBattles={live1v1Battles} />

      <GlobalLeaderboardsRow rooms={globalRooms} />
    </div>
  );
}
