"use client";

import { useState, useEffect } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat"; 
import VoteModal from "./VoteModal"; 
import { createClient } from "@/utils/supabase/client"; // <-- Import the client!
import { onBrand } from "@/lib/color";
import { MessageSquare, X } from "lucide-react";

export default function BattleClient({ initialBattleData }: { initialBattleData: any }) {
  const [battleData, setBattleData] = useState(initialBattleData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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

      {/* Mobile: the live feed has no room in the arena layout, so it opens as
          a slide-over instead of being hidden entirely below lg. */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="lg:hidden pressable fixed top-3 left-1/2 -translate-x-1/2 z-40 cut-corner
                   bg-card/90 backdrop-blur-md border border-border px-3 py-1.5
                   font-arcade text-[10px] font-bold uppercase tracking-widest
                   text-foreground/80 inline-flex items-center gap-1.5 shadow-lg"
      >
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        Live feed
        {(battleData.feed?.length ?? 0) > 0 && (
          <span className="cut-corner bg-primary text-primary-foreground px-1.5 text-[9px] tabular-nums">
            {battleData.feed.length}
          </span>
        )}
      </button>

      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <button
            aria-label="Close live feed"
            onClick={() => setChatOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-label="Live feed"
            className="relative ml-auto w-[88%] max-w-sm h-full bg-card border-l border-border
                       flex flex-col animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="font-arcade text-xs font-bold uppercase tracking-widest text-foreground">
                Live feed
              </span>
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Close"
                className="pressable text-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <BattleChat
                battle={battleData}
                onVoteClick={(i: number) => {
                  setChatOpen(false);
                  handleVoteClick(i);
                }}
              />
            </div>
          </aside>
        </div>
      )}

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