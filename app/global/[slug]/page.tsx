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