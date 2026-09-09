import { Suspense } from "react";
import Link from "next/link";
import HeroCarousel from "./_components/HeroCarousel";
import GlobalLeaderboardsRow from "./_components/GlobalLeaderboardsRow";
import FaceOffsRow from "./_components/FaceOffsRow";
import ArenaFilters from "./_components/ArenaFilters";
import SearchLauncher from "@/components/ui/SearchLauncher";
import LivePresence from "@/components/ui/LivePresence";
import { getActive1v1Rooms, getLiveCategories } from "@/actions/getRooms";
import { getFeaturedRooms, getGlobalRooms } from "@/actions/getLanding";
import { isRoomSort } from "@/lib/constants";
import {
  absolute, breadcrumbSchema, jsonLd, leaderboardSchema, DESCRIPTION,
} from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // The homepage is the one page that should rank for the brand itself, so it
  // keeps the default title rather than taking the "%s | GOAT Rank" template.
  title: {
    absolute: "GOAT Rank: settle the debate with real money",
  },
  description: DESCRIPTION,
  alternates: { canonical: absolute("/") },
};

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

  const schema = jsonLd(
    leaderboardSchema(
      "/",
      "Live arenas on GOAT Rank",
      [...featured, ...live1v1Battles, ...globalRooms]
        .slice(0, 20)
        .map((room: { id: string; title: string; room_type?: string }) => ({
          name: room.title,
          url: `/${room.room_type === "global" ? "global" : "battle"}/${room.id}`,
        }))
    ),
    breadcrumbSchema([{ name: "GOAT Rank", path: "/" }])
  );

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* The page's own heading. The carousel's title changes with the slide,
          so it cannot be the h1, and a homepage whose only h1 is a rotating
          arena name tells a crawler nothing about what the site is. */}
      <header className="w-full pt-5 flex flex-col gap-1.5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Settle the debate with real money
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-2xl leading-relaxed">
          Back a contender and the leaderboard moves by what you paid. 60% grows the arena&apos;s
          pool, 30% goes to a charity the backers choose, and 10% goes to whoever started the
          argument.{" "}
          <Link href="/faq" className="text-primary hover:underline font-medium">
            How it works
          </Link>
        </p>
      </header>

      {/* HERO SECTION */}
      {featured.length > 0 && (
        <section className="w-full pt-4">
          <HeroCarousel rooms={featured} />
        </section>
      )}

      {/* One box for the whole site. Someone arriving from a post knows a
          name, not which table it lives in. */}
      <section className="w-full pt-2 flex flex-col gap-2">
        <SearchLauncher categories={categories} />
        <div className="flex justify-end px-1">
          <LivePresence scope="site" showVisitors />
        </div>
      </section>

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
