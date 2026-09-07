"use client";

import { motion } from "framer-motion";
import { MessageSquare, Heart, Crown } from "lucide-react";
import FeedList from "@/components/ui/FeedList";
import CharityVote from "@/components/ui/CharityVote";

export default function BattleChat({
  battle,
  onVoteClick
}: {
  battle: any;
  onVoteClick?: (index: number) => void;
}) {
  const leftAmount = Number(battle.contenders?.[0]?.amount) || 0;
  const rightAmount = Number(battle.contenders?.[1]?.amount) || 0;
  const totalPool = battle.totalPool ?? (leftAmount + rightAmount);

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden font-sans">

      {/* 1. LIVE ARENA FEED CARD (Expands to take available height) */}
      <div className="w-full flex-1 min-h-[220px] rounded-2xl bg-card border border-border/80 p-4 shadow-xl flex flex-col gap-3 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-xs md:text-sm text-foreground font-bold tracking-wider uppercase">
              LIVE ARENA FEED
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-[10px] font-bold text-primary shadow-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Live Feed List - Fills all available vertical height */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <FeedList
            roomId={battle.id}
            initialItems={battle.feed ?? []}
            initialCursor={battle.feedCursor ?? null}
            initialHasMore={battle.feedHasMore ?? false}
            compact
            emptyMessage="Be the first to speak in this battle"
          />
        </div>
      </div>

      {/* 2 & 3. STICKY BOTTOM CONTAINER FOR CHARITY & POOL SUMMARY */}
      <div className="shrink-0 flex flex-col gap-4">
        {/* CHARITY ALLOCATION CARD */}
        {battle.charities && battle.charities.length > 0 && (
          <div className="w-full rounded-2xl bg-card border border-border/80 p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Heart className="w-4 h-4 text-primary fill-primary/20" />
              <h4 className="text-xs md:text-sm font-bold text-foreground uppercase tracking-wider">
                CHARITY ALLOCATION
              </h4>
            </div>

            <CharityVote
              roomId={battle.id}
              charities={battle.charities ?? []}
              tally={battle.charityTally ?? []}
              myChoice={battle.charityChoice ?? null}
              total={battle.charityTotal ?? 0}
            />
          </div>
        )}
      </div>

    </div>
  );
}