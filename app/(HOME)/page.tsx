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
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  // searchParams is a Promise in this version and must be awaited.
  const params = await searchParams;

  const sort = isRoomSort(params.sort) ? params.sort : "hot";
  const category = params.category ?? "all";

  const [live1v1Battles, categories, featured, globalRooms] = await Promise.all([
    getActive1v1Rooms(sort, category),
    getLiveCategories(),
    getFeaturedRooms(),
    getGlobalRooms(),
  ]);

  return (
    <div className="w-full flex flex-col gap-2 pb-24">
      {/* HERO SECTION */}
      <div className="pt-4 md:pt-8 px-4 md:px-0">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2 font-arcade uppercase">
            SETTLE THE <span className="text-primary italic">DEBATE.</span>
          </h1>
          <p className="text-foreground/60 font-medium max-w-lg mx-auto">
            Back your GOAT. Destroy the competition. Fund charity.
          </p>
        </div>

        <HeroCarousel rooms={featured} />
      </div>

      <GlobalLeaderboardsRow rooms={globalRooms} />

      <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 pt-4">
        {/* useSearchParams needs a Suspense boundary during streaming. */}
        <Suspense fallback={<div className="h-9" />}>
          <ArenaFilters sort={sort} category={category} categories={categories} />
        </Suspense>
      </section>

      <FaceOffsRow liveBattles={live1v1Battles} />
    </div>
  );
}
