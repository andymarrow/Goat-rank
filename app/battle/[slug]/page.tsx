import type { Metadata } from "next";
import BattleClient from "./_components/BattleClient";
import { getBattleData } from "@/actions/getBattle";
import { getOgArena, money } from "@/lib/og";
import { absolute, arenaSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Unfurl copy for the card.
 *
 * A shared arena used to preview as the site name and tagline, identical for
 * every link — which on X reads as spam. The title is the matchup and the
 * description is the current standing, so the preview carries the argument.
 * The image comes from opengraph-image.tsx alongside this file.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const arena = await getOgArena(slug);

  if (!arena) return { title: "Arena not found" };

  const [left, right] = arena.contenders;
  const total = (left?.amount ?? 0) + (right?.amount ?? 0);
  const leftPct = total > 0 ? Math.round(((left?.amount ?? 0) / total) * 100) : 50;

  const title = arena.title;
  const description = left && right
    ? `${left.name} ${leftPct}% vs ${right.name} ${100 - leftPct}% · ${money(arena.totalPool)} in the pool. Back your pick: 30% goes to charity.`
    : `${money(arena.totalPool)} in the pool. Back your pick: 30% goes to charity.`;

  return {
    title,
    description,
    alternates: { canonical: absolute(`/battle/${slug}`) },
    openGraph: { title, description, type: "website", url: absolute(`/battle/${slug}`) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BattlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Fetch the live data!
  const battleData = await getBattleData(resolvedParams.slug);

  // Handle 404 if the room ID is wrong
  if (!battleData) {
    return (
      <div className="w-full h-[calc(100dvh-64px)] flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="font-arcade text-2xl sm:text-3xl md:text-4xl mb-4 text-primary text-center px-4">ARENA NOT FOUND</h1>
        <Link href="/" className="flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> RETURN TO LOBBY
        </Link>
      </div>
    );
  }

  // An arena is a contest with a deadline, which is the fact worth surfacing
  // while it is still live. Event is the only schema.org type that carries it.
  const schema = jsonLd(
    arenaSchema({
      id: battleData.id,
      title: battleData.title,
      description: `${battleData.contenders?.[0]?.name ?? "Contender"} against ${
        battleData.contenders?.[1]?.name ?? "contender"
      } on GOAT Rank. Back a side with a real pledge: 30% of every pledge goes to charity.`,
      roomType: "1v1",
      category: battleData.category,
      expiresAt: battleData.expiresAt,
      totalPool: Number(battleData.totalPool) || 0,
      contenders: (battleData.contenders ?? []).map((c: { name: string; image: string | null }) => ({
        name: c.name,
        image: c.image,
      })),
    }),
    breadcrumbSchema([
      { name: "GOAT Rank", path: "/" },
      { name: battleData.title, path: `/battle/${resolvedParams.slug}` },
    ])
  );

  return (
    <div className="w-full min-h-[calc(100dvh-64px)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Pass the real data into our client component */}
      <BattleClient initialBattleData={battleData} />
    </div>
  );
}