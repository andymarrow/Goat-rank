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
      <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-5 md:p-6 pb-28 lg:pb-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Center Main Arena Column */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          <BattleArena battle={battleData} onVoteClick={handleVoteClick} />
        </div>

        {/* Right Sidebar Column */}
        <div className="hidden lg:flex w-full lg:w-[380px] xl:w-[420px] flex-col shrink-0 sticky top-20 h-[calc(100vh-100px)]">
          <BattleChat battle={battleData} onVoteClick={handleVoteClick} />
        </div>
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
      {/* Mobile vote bar */}
      <div
        className="lg:hidden fixed bottom-16 inset-x-0 bg-card/95 backdrop-blur-xl border-t border-border/80 px-3 py-2.5 z-[52] flex gap-2.5 shadow-2xl"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      >
        {[0, 1].map((i) => {
          const leftAmt = Number(battleData.contenders[0]?.amount) || 0;
          const rightAmt = Number(battleData.contenders[1]?.amount) || 0;
          const isWinning = i === 0 ? leftAmt >= rightAmt : rightAmt >= leftAmt;

          return (
            <button
              key={i}
              onClick={() => handleVoteClick(i)}
              className={`flex-1 min-w-0 rounded-xl py-3 px-2.5 font-arcade font-bold text-xs shadow-md flex items-center justify-center gap-1 uppercase transition-all active:scale-[0.98] cursor-pointer ${isWinning
                ? "bg-primary text-primary-foreground hover:opacity-95"
                : "bg-muted border border-border/60 text-foreground hover:bg-muted"
                }`}
            >
              <span className="opacity-90 shrink-0">Vote</span>
              <span className="truncate">{battleData.contenders[i].name}</span>
            </button>
          );
        })}
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