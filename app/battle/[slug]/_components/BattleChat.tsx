"use client";

import { motion } from "framer-motion";
import { MessageSquare, Flame, Zap, ChevronRight } from "lucide-react";
import { onBrand } from "@/lib/color";
import FeedList from "@/components/ui/FeedList";
import Image from "next/image";

export default function BattleChat({ 
  battle, 
  onVoteClick 
}: { 
  battle: any;
  onVoteClick: (index: number) => void;
}) {
  
  const getMessageStyle = (amount: number) => {
    if (amount >= 50) return `border-l-4 border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-100`; 
    if (amount >= 15) return `border-l-4 bg-foreground/5`; 
    return `border-l-2 bg-transparent opacity-80`; 
  };

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

      {/* CHAT SCROLL AREA — paged rather than unbounded. */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-hide bg-card">
        <FeedList
          roomId={battle.id}
          initialItems={battle.feed ?? []}
          initialCursor={battle.feedCursor ?? null}
          initialHasMore={battle.feedHasMore ?? false}
          compact
          emptyMessage="Be the first to speak"
        />
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