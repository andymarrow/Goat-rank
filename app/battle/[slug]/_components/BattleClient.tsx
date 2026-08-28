"use client";

import { useState } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat"; 
import VoteModal from "./VoteModal"; 

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
  
  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContender, setSelectedContender] = useState(0);

  const handleVoteClick = (contenderIndex: number) => {
    setSelectedContender(contenderIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* LEFT SIDE: The Immersive Arena */}
      <div className="flex-1 relative flex flex-col bg-[#0A0A0C]">
        <BattleArena battle={battleData} />
      </div>

      {/* RIGHT SIDE: The Live Feed (Visible on Desktop, hidden on small screens for now) */}
      <div className="hidden lg:flex w-96 border-l border-white/10 bg-background flex-col h-[calc(100vh-64px)] overflow-hidden shrink-0">
        <BattleChat battle={battleData} onVoteClick={handleVoteClick} />
      </div>

      {/* Mobile Sticky CTA (Since sidebar is hidden on mobile) */}
      <div className="lg:hidden fixed bottom-16 left-0 w-full bg-[#0A0A0C] border-t border-white/10 p-4 z-50 flex gap-2">
         <button 
            onClick={() => handleVoteClick(0)}
            className="flex-1 cut-corner py-3 font-arcade font-bold text-xs" 
            style={{ backgroundColor: battleData.contenders[0].color, color: "#000" }}
         >
            VOTE {battleData.contenders[0].name}
         </button>
         <button 
            onClick={() => handleVoteClick(1)}
            className="flex-1 cut-corner py-3 font-arcade font-bold text-xs text-white" 
            style={{ backgroundColor: battleData.contenders[1].color }}
         >
            VOTE {battleData.contenders[1].name}
         </button>
      </div>

      {/* THE VOTING MODAL OVERLAY */}
      <VoteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        battle={battleData}
        contenderIndex={selectedContender}
      />
    </>
  );
}