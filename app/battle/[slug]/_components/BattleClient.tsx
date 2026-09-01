"use client";

import { useState } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat"; 
import VoteModal from "./VoteModal"; 

// REMOVE the MOCK_BATTLE const completely!

export default function BattleClient({ initialBattleData }: { initialBattleData: any }) {
  // Initialize state with the real data from Supabase
  const [battleData, setBattleData] = useState(initialBattleData);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContender, setSelectedContender] = useState(0);

  const handleVoteClick = (contenderIndex: number) => {
    setSelectedContender(contenderIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* LEFT SIDE: The Immersive Arena (Takes up remaining space, height 100%) */}
      <div className="flex-1 relative flex flex-col bg-background h-full overflow-hidden">
        <BattleArena battle={battleData} />
      </div>

      {/* RIGHT SIDE: The Live Feed */}
      <div className="hidden lg:flex w-96 border-l border-border bg-card flex-col h-full overflow-hidden shrink-0">
        <BattleChat battle={battleData} onVoteClick={handleVoteClick} />
      </div>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 w-full bg-card border-t border-border p-4 z-50 flex gap-2">
         <button 
            onClick={() => handleVoteClick(0)}
            className="flex-1 cut-corner py-3 font-arcade font-bold text-xs shadow-lg" 
            style={{ backgroundColor: battleData.contenders[0].color, color: "#000" }}
         >
            VOTE {battleData.contenders[0].name}
         </button>
         <button 
            onClick={() => handleVoteClick(1)}
            className="flex-1 cut-corner py-3 font-arcade font-bold text-xs shadow-lg text-white" 
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