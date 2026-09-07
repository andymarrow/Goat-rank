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
  const includeMock = params.mock === "true" || params.mock === "1";

  const [live1v1Battles, categories, featured, globalRooms] = await Promise.all([
    getActive1v1Rooms(sort, category, includeMock),
    getLiveCategories(includeMock),
    getFeaturedRooms(4, includeMock),
    getGlobalRooms(12, includeMock),
  ]);

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* HERO SECTION */}
      {featured.length > 0 && (
        <section className="w-full pt-4">
          <HeroCarousel rooms={featured} />
        </section>
      )}

      <GlobalLeaderboardsRow rooms={globalRooms} />

      <section className="w-full pt-2">
        {/* useSearchParams needs a Suspense boundary during streaming. */}
        <Suspense fallback={<div className="h-9" />}>
          <ArenaFilters sort={sort} category={category} categories={categories} includeMock={includeMock} />
        </Suspense>
      </section>

      <FaceOffsRow liveBattles={live1v1Battles} />
    </div>
  );
}
