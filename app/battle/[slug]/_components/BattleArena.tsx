"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Countdown from "@/components/ui/Countdown";

export default function BattleArena({
  battle,
  onVoteClick
}: {
  battle: any;
  onVoteClick?: (index: number) => void;
}) {
  const leftAmount = Number(battle.contenders?.[0]?.amount) || 0;
  const rightAmount = Number(battle.contenders?.[1]?.amount) || 0;
  const totalPool = battle.totalPool ?? (leftAmount + rightAmount);

  const leftPercentage = totalPool > 0 ? (leftAmount / totalPool) * 100 : 50;
  const rightPercentage = totalPool > 0 ? (rightAmount / totalPool) * 100 : 50;

  const leftContender = battle.contenders?.[0] || { name: "Contender 1", amount: leftAmount };
  const rightContender = battle.contenders?.[1] || { name: "Contender 2", amount: rightAmount };

  const isLeftWinning = leftAmount >= rightAmount;
  const isRightWinning = rightAmount >= leftAmount;

  return (
    <div className="w-full flex flex-col gap-6 font-sans">

      {/* =========================================================================
          1. TOP BAR HEADER (Navigation & Battle Countdown)
      ========================================================================= */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Back to Lobby Link */}
        <Link
          href="/"
          className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card hover:bg-card/80 border border-border/80 text-foreground text-xs font-bold tracking-wider transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
          <span>Back to Lobby</span>
        </Link>

        {/* Countdown Timer Header Box */}
        <div className="flex flex-col items-center gap-1 bg-card/80 border border-border/80 px-4 py-2 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            BATTLE STARTS IN
          </span>
          <Countdown target={battle.expiresAt} size="auto" />
        </div>
      </div>

      {/* =========================================================================
          2. HERO VS BATTLE CARD (Real Arena Data)
      ========================================================================= */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full rounded-3xl bg-card border border-border/80 p-4 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden"
      >
        {/* Card Header Title */}
        <div className="flex flex-col items-center text-center">
          <span className="text-primary text-xs font-semibold uppercase tracking-[0.25em]">
            {battle.category ? battle.category.toUpperCase() : "LIVE ARENA"}
          </span>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight uppercase mt-0.5">
            {battle.title || "BATTLE ARENA"}
          </h1>
        </div>

        {/* Split Contenders Matchup Stage */}
        {/* Each half is washed in its contender's brand colour, so the stage
            reads as a matchup rather than the flat grey slab it was. */}
        <div className="relative w-full h-[300px] xs:h-[360px] sm:h-[420px] md:h-[480px] rounded-2xl overflow-hidden border border-border/50 flex flex-row items-stretch justify-between gap-1 p-1.5 sm:p-2 bg-neutral-950">
          
          {/* Glowing Center Vertical Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-amber-500/40 to-transparent z-10 pointer-events-none" />

          {/* Center Floating VS Circle Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted border-2 border-amber-500/80 text-amber-500 font-extrabold text-base sm:text-xl z-20 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.35)] select-none">
            VS
          </div>

          {/* Left Contender Section */}
          <Link
            href={`/profile/${leftContender.entityId || "1"}`}
            aria-label={`View ${leftContender.name}'s profile`}
            className="relative w-1/2 h-full rounded-xl overflow-hidden block group/left"
            style={{
              background: `radial-gradient(120% 90% at 30% 100%, ${leftContender.color ?? "#FF7A00"}55 0%, ${leftContender.color ?? "#FF7A00"}18 45%, transparent 75%)`,
            }}
          >
            {isLeftWinning && (
              <span
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: `inset 0 0 60px ${leftContender.color ?? "#FF7A00"}55` }}
              />
            )}
            {leftContender.image ? (
              <Image
                src={leftContender.image}
                alt={leftContender.name}
                fill
                priority
                className="object-contain object-bottom group-hover/left:scale-105 transition-transform duration-500"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-black text-5xl sm:text-7xl"
                style={{ color: `${leftContender.color ?? "#FF7A00"}66` }}
              >
                {leftContender.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

            {/* Left Contender Name & Subtitle Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col">
              <span className="font-extrabold text-lg sm:text-2xl md:text-3xl text-foreground uppercase tracking-tight leading-tight truncate max-w-[180px] sm:max-w-[240px]">
                {leftContender.name}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5 ${
                isLeftWinning ? "text-primary" : "text-muted-foreground"
              }`}>
                {isLeftWinning ? "👑 LEADER" : "CONTENDER #1"}
              </span>
            </div>

            {/* Left Contender Vote Button Overlay */}
            <div className="hidden lg:block absolute bottom-3 left-3 right-3 sm:right-6 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoteClick?.(0);
                }}
                className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 z-20 ${
                  isLeftWinning
                    ? "bg-primary hover:opacity-90 text-primary-foreground"
                    : "bg-muted hover:bg-muted border border-border/60 text-foreground"
                }`}
              >
                <span>Vote {leftContender.name.split(" ")[0]}</span>
              </button>
            </div>
          </Link>

          {/* Right Contender Section */}
          <Link
            href={`/profile/${rightContender.entityId || "2"}`}
            aria-label={`View ${rightContender.name}'s profile`}
            className="relative w-1/2 h-full rounded-xl overflow-hidden block group/right"
            style={{
              background: `radial-gradient(120% 90% at 70% 100%, ${rightContender.color ?? "#3B82F6"}55 0%, ${rightContender.color ?? "#3B82F6"}18 45%, transparent 75%)`,
            }}
          >
            {isRightWinning && (
              <span
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: `inset 0 0 60px ${rightContender.color ?? "#3B82F6"}55` }}
              />
            )}
            {rightContender.image ? (
              <Image
                src={rightContender.image}
                alt={rightContender.name}
                fill
                priority
                className="object-contain object-bottom group-hover/right:scale-105 transition-transform duration-500"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-black text-5xl sm:text-7xl"
                style={{ color: `${rightContender.color ?? "#3B82F6"}66` }}
              >
                {rightContender.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

            {/* Right Contender Name & Subtitle Overlay */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end text-right">
              <span className="font-extrabold text-lg sm:text-2xl md:text-3xl text-foreground uppercase tracking-tight leading-tight truncate max-w-[180px] sm:max-w-[240px]">
                {rightContender.name}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5 ${
                isRightWinning ? "text-primary" : "text-muted-foreground"
              }`}>
                {isRightWinning ? "👑 LEADER" : "CONTENDER #2"}
              </span>
            </div>

            {/* Right Contender Vote Button Overlay */}
            <div className="hidden lg:block absolute bottom-3 left-3 sm:left-6 right-3 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoteClick?.(1);
                }}
                className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 z-20 ${
                  isRightWinning
                    ? "bg-primary hover:opacity-90 text-primary-foreground"
                    : "bg-muted hover:bg-muted border border-border/60 text-foreground"
                }`}
              >
                <span>Vote {rightContender.name.split(" ")[0]}</span>
              </button>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* =========================================================================
          3. VOTING & PROGRESS BAR SECTION (Choose Your Side)
      ========================================================================= */}
      <div className="w-full rounded-2xl bg-card border border-border/80 p-4 sm:p-6 shadow-xl flex flex-col gap-4">
        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-center">
          CHOOSE YOUR CONTENDER
        </span>

        {/* Voting Row */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Contender Stats */}
          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-sm sm:text-base uppercase truncate ${
              isLeftWinning ? "text-primary" : "text-muted-foreground"
            }`}>
              {leftContender.name}
            </span>
            <span className={`text-3xl sm:text-3xl md:text-4xl font-extrabold tabular-nums leading-none ${
              isLeftWinning ? "text-primary" : "text-muted-foreground"
            }`}>
              {Math.round(leftPercentage)}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {leftAmount.toLocaleString()} votes
            </span>
          </div>

          {/* Desktop only: on mobile these collided with the percentages and
              duplicated the fixed bottom vote bar. */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onVoteClick?.(0)}
              className={`px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer ${
                isLeftWinning
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted hover:bg-muted border border-border/60 text-foreground"
              }`}
            >
              Vote {leftContender.name.split(" ")[0]}
            </button>
            <button
              type="button"
              onClick={() => onVoteClick?.(1)}
              className={`px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer ${
                isRightWinning
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted hover:bg-muted border border-border/60 text-foreground"
              }`}
            >
              Vote {rightContender.name.split(" ")[0]}
            </button>
          </div>

          {/* Right Contender Stats */}
          <div className="flex flex-col items-end text-right min-w-0">
            <span className={`font-bold text-sm sm:text-base uppercase truncate ${
              isRightWinning ? "text-primary" : "text-muted-foreground"
            }`}>
              {rightContender.name}
            </span>
            <span className={`text-3xl sm:text-3xl md:text-4xl font-extrabold tabular-nums leading-none ${
              isRightWinning ? "text-primary" : "text-muted-foreground"
            }`}>
              {Math.round(rightPercentage)}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {rightAmount.toLocaleString()} votes
            </span>
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex border border-border/50 relative">
          <motion.div
            className={`h-full relative transition-all duration-500 ${isLeftWinning ? "bg-primary" : "bg-muted"}`}
            initial={{ width: "50%" }}
            animate={{ width: `${leftPercentage}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
          />
          <motion.div
            className={`h-full flex-1 transition-all duration-500 ${isRightWinning ? "bg-primary" : "bg-muted"}`}
            initial={{ width: "50%" }}
            animate={{ width: `${rightPercentage}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
          />
        </div>
      </div>

    </div>
  );
}