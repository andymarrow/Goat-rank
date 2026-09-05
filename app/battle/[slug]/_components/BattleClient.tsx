"use client";

import { useState, useEffect } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat"; 
import VoteModal from "./VoteModal"; 
import { createClient } from "@/utils/supabase/client"; // <-- Import the client!
import { onBrand } from "@/lib/color";
import MobileFeedDrawer from "@/components/ui/MobileFeedDrawer";

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

      {/* Mobile feed + charity, as a slide-over. The trigger floats clear of
          the arena header, which already holds the back link and countdown. */}
      <MobileFeedDrawer
        roomId={battleData.id}
        feed={battleData.feed ?? []}
        feedCursor={battleData.feedCursor ?? null}
        feedHasMore={battleData.feedHasMore ?? false}
        charities={battleData.charities ?? []}
        charityTally={battleData.charityTally ?? []}
        charityChoice={battleData.charityChoice ?? null}
        charityTotal={battleData.charityTotal ?? 0}
      />

      {/* Mobile vote bar. Sits directly above the 64px tab bar and respects the
          home-indicator inset; long contender names truncate instead of
          forcing the two buttons to different heights. */}
      <div
        className="lg:hidden fixed bottom-16 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border
                   px-3 py-2.5 z-[52] flex gap-2"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      >
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => handleVoteClick(i)}
            className="pressable flex-1 min-w-0 cut-corner py-3 px-2 font-arcade font-bold text-[11px] xs:text-xs
                       shadow-lg flex items-center justify-center gap-1 uppercase"
            style={{
              backgroundColor: battleData.contenders[i].color,
              color: onBrand(battleData.contenders[i].color),
            }}
          >
            <span className="opacity-70 shrink-0">Vote</span>
            <span className="truncate">{battleData.contenders[i].name}</span>
          </button>
        ))}
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