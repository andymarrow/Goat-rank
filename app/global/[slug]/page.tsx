import GlobalRoomClient from "./_components/GlobalRoomClient";
import { getGlobalRoomData } from "@/actions/getGlobalRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GlobalRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  const roomData = await getGlobalRoomData(resolvedParams.slug);

  if (!roomData) {
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
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center bg-background">
      <GlobalRoomClient initialRoomData={roomData} />
    </div>
  );
}