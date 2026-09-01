import BattleClient from "./_components/BattleClient";
import { getBattleData } from "@/actions/getBattle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BattlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Fetch the live data!
  const battleData = await getBattleData(resolvedParams.slug);

  // Handle 404 if the room ID is wrong
  if (!battleData) {
    return (
      <div className="w-full h-[calc(100dvh-64px)] flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="font-arcade text-4xl mb-4 text-primary">ARENA NOT FOUND</h1>
        <Link href="/" className="flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> RETURN TO LOBBY
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100dvh-80px)] md:h-[calc(100dvh-64px)] flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Pass the real data into our client component */}
      <BattleClient initialBattleData={battleData} />
    </div>
  );
}