import type { Metadata } from "next";
import BattleClient from "./_components/BattleClient";
import { getBattleData } from "@/actions/getBattle";
import { getOgArena, money } from "@/lib/og";
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
    openGraph: { title, description, type: "website" },
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

  return (
    <div className="w-full min-h-[calc(100dvh-64px)] bg-background">
      {/* Pass the real data into our client component */}
      <BattleClient initialBattleData={battleData} />
    </div>
  );
}