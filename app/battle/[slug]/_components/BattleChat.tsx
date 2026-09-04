"use client";

import { motion } from "framer-motion";
import { MessageSquare, Flame, Zap, ChevronRight } from "lucide-react";
import { onBrand } from "@/lib/color";
import { useState } from "react";
import FeedList from "@/components/ui/FeedList";
import CharityVote from "@/components/ui/CharityVote";
import Image from "next/image";

export default function BattleChat({ 
  battle, 
  onVoteClick 
}: { 
  battle: any;
  onVoteClick: (index: number) => void;
}) {
  const [tab, setTab] = useState<"feed" | "charity">("feed");
  

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border relative">
      
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-background flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-arcade text-sm text-foreground font-bold tracking-wider">LIVE FEED</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-arcade text-green-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Tabs: the sidebar is the only spare surface in a 1v1, so the charity
          vote lives alongside the feed rather than competing with the arena. */}
      <div className="flex border-b border-border shrink-0">
        {(["feed", "charity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={`flex-1 py-2.5 font-arcade text-[10px] font-bold uppercase tracking-widest
              transition-colors ${
                tab === t
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
          >
            {t === "feed" ? "Battle cries" : "Charity"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-hide bg-card">
        {tab === "feed" ? (
          <FeedList
            roomId={battle.id}
            initialItems={battle.feed ?? []}
            initialCursor={battle.feedCursor ?? null}
            initialHasMore={battle.feedHasMore ?? false}
            compact
            emptyMessage="Be the first to speak"
          />
        ) : (
          <CharityVote
            roomId={battle.id}
            charities={battle.charities ?? []}
            tally={battle.charityTally ?? []}
            myChoice={battle.charityChoice ?? null}
            total={battle.charityTotal ?? 0}
          />
        )}
      </div>

      {/* STICKY VOTE ACTIONS */}
      <div className="shrink-0 border-t border-border bg-background p-3 md:p-4">
        <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/40 block mb-2 text-center">
          Back your contender
        </span>
        <div className="flex flex-col gap-2">
          <button onClick={() => onVoteClick(0)} className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-110 shadow-md" style={{ backgroundColor: battle.contenders[0].color, color: onBrand(battle.contenders[0].color) }}>
            <span>VOTE {battle.contenders[0].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button onClick={() => onVoteClick(1)} className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-110 shadow-md" style={{ backgroundColor: battle.contenders[1].color, color: onBrand(battle.contenders[1].color) }}>
            <span>VOTE {battle.contenders[1].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}