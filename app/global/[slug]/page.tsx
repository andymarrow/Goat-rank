import type { Metadata } from "next";
import GlobalRoomClient from "./_components/GlobalRoomClient";
import { getGlobalRoomData } from "@/actions/getGlobalRoom";
import { getOgArena, money } from "@/lib/og";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Unfurl copy: the title is the question, the description is who leads. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const arena = await getOgArena(slug);

  if (!arena) return { title: "Arena not found" };

  const ranked = [...arena.contenders].sort((a, b) => b.amount - a.amount);
  const leader = ranked[0];

  const title = arena.title;
  const description = leader
    ? `${leader.name} leads with ${money(leader.amount)} of a ${money(arena.totalPool)} pool, across ${ranked.length} contenders. Back yours — 30% goes to charity.`
    : `${money(arena.totalPool)} in the pool. Back your pick — 30% goes to charity.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GlobalRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const roomData = await getGlobalRoomData(resolvedParams.slug);

  if (!roomData) {
    return (
      <div className="w-full h-[calc(100dvh-64px)] flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-primary text-center px-4">Arena Not Found</h1>
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to Lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col bg-background">
      <GlobalRoomClient initialRoomData={roomData} />
    </div>
  );
}