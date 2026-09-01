"use client";

import { useState, useEffect } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat"; 
import VoteModal from "./VoteModal"; 
import { createClient } from "@/utils/supabase/client"; // <-- Import the client!

export default function BattleClient({ initialBattleData }: { initialBattleData: any }) {
  const [battleData, setBattleData] = useState(initialBattleData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContender, setSelectedContender] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (!battleData?.id) return;

    // Create a Realtime Channel for this specific room
    const channel = supabase
      .channel(`room:${battleData.id}`)
      
      // 1. Listen for updates to the Contenders' scores
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_contenders",
          filter: `room_id=eq.${battleData.id}`,
        },
        (payload) => {
          // Update the state with the new score!
          setBattleData((prev: any) => {
            const updatedContenders = prev.contenders.map((c: any) =>
              c.id === payload.new.id ? { ...c, amount: payload.new.current_votes } : c
            );
            return { ...prev, contenders: updatedContenders };
          });
        }
      )
      
      // 2. Listen for new Votes in the Chat
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${battleData.id}`,
        },
        (payload) => {
          // Add the new message to the top of the chat feed
          setBattleData((prev: any) => {
            const newVote = payload.new;
            return {
              ...prev,
              recentVotes: [newVote, ...prev.recentVotes],
            };
          });
        }
      )
      .subscribe();

    // Cleanup subscription when the user leaves the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleData.id, supabase]);

  const handleVoteClick = (contenderIndex: number) => {
    setSelectedContender(contenderIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 relative flex flex-col bg-background h-full overflow-hidden">
        <BattleArena battle={battleData} />
      </div>

      <div className="hidden lg:flex w-96 border-l border-border bg-card flex-col h-full overflow-hidden shrink-0">
        <BattleChat battle={battleData} onVoteClick={handleVoteClick} />
      </div>

      <div className="lg:hidden fixed bottom-16 left-0 w-full bg-card border-t border-border p-4 z-50 flex gap-2">
         <button onClick={() => handleVoteClick(0)} className="flex-1 cut-corner py-3 font-arcade font-bold text-xs shadow-lg" style={{ backgroundColor: battleData.contenders[0].color, color: "#000" }}>
            VOTE {battleData.contenders[0].name}
         </button>
         <button onClick={() => handleVoteClick(1)} className="flex-1 cut-corner py-3 font-arcade font-bold text-xs shadow-lg text-white" style={{ backgroundColor: battleData.contenders[1].color }}>
            VOTE {battleData.contenders[1].name}
         </button>
      </div>

      <VoteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        battle={battleData}
        contenderIndex={selectedContender}
      />
    </>
  );
}