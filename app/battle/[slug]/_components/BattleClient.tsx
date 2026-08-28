"use client";

import { useState } from "react";
import BattleArena from "./BattleArena";
// We will build BattleChat in the next sub-phase
// import BattleChat from "./BattleChat"; 

// Mock Data for the room
const MOCK_BATTLE = {
  id: "b1",
  title: "The GOAT Battle",
  category: "Soccer",
  timeLeft: "12:45:00",
  charity: "Save The Children",
  contenders: [
    { id: "c1", name: "Ronaldo", image: "/image/ronaldo.png", color: "#F9F8F3", amount: 12450 },
    { id: "c2", name: "Messi", image: "/image/messi.png", color: "#3B82F6", amount: 9800 }
  ]
};

export default function BattleClient({ slug }: { slug: string }) {
  const [battleData, setBattleData] = useState(MOCK_BATTLE);

  return (
    <>
      {/* LEFT SIDE: The Immersive Arena (Takes up remaining space) */}
      <div className="flex-1 relative flex flex-col bg-[#0A0A0C]">
        <BattleArena battle={battleData} />
      </div>

      {/* RIGHT SIDE: The Live Feed (Fixed width on desktop) */}
      <div className="hidden md:flex w-96 border-l border-border bg-background flex-col">
        {/* Placeholder for Sub-Phase 4.2 */}
        <div className="p-6 text-center font-arcade text-foreground/50 border-b border-border">
          LIVE FEED CONNECTING...
        </div>
      </div>
    </>
  );
}