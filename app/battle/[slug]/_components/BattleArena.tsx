"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Timer, ArrowLeft, HeartHandshake } from "lucide-react";
import Link from "next/link";
import Countdown from "@/components/ui/Countdown";

export default function BattleArena({ battle }: { battle: any }) {
  const totalPool = battle.contenders[0].amount + battle.contenders[1].amount;
  const leftPercentage = (battle.contenders[0].amount / totalPool) * 100;
  const rightPercentage = (battle.contenders[1].amount / totalPool) * 100;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 z-0 flex">
        {/* Left Side Glow */}
        <div className="w-1/2 h-full opacity-10 dark:opacity-20 transition-colors duration-1000" 
             style={{ background: `radial-gradient(circle at 30% 50%, ${battle.contenders[0].color} 0%, transparent 60%)` }} />
        {/* Right Side Glow */}
        <div className="w-1/2 h-full opacity-10 dark:opacity-20 transition-colors duration-1000" 
             style={{ background: `radial-gradient(circle at 70% 50%, ${battle.contenders[1].color} 0%, transparent 60%)` }} />
      </div>
      
      {/* Arena floor. Was a remote transparenttextures.com PNG on every
          load — now CSS-generated, so it costs no request and can't 404. */}
      <div className="absolute inset-0 z-0 pointer-events-none tex-grid" />
      <div className="absolute inset-0 z-0 pointer-events-none tex-hatch" />

      {/* --- TOP BAR (Nav & Timer) --- */}
      <div className="relative z-30 flex items-start justify-between gap-2 p-3 md:p-8">
        <Link
          href="/"
          className="pressable cut-corner bg-card/80 backdrop-blur-md border border-border hover:bg-card/100
                     text-foreground px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-1.5 shrink-0
                     font-arcade text-xs md:text-sm transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">ARENA</span>
        </Link>

        <div className="flex flex-col items-end gap-1.5 min-w-0">
          <div className="cut-corner bg-card/90 border border-border backdrop-blur-md px-2 py-1.5 md:px-6 md:py-2
                          flex items-center gap-1.5 md:gap-3 shadow-xl max-w-full">
            <Timer className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse shrink-0" />
            <Countdown target={battle.expiresAt} size="auto" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-arcade text-foreground/70
                          bg-background/80 px-2 py-1 md:px-3 cut-corner border border-border max-w-[60vw] md:max-w-none">
            <HeartHandshake className="w-3 h-3 text-battle-pink shrink-0" />
            <span className="truncate">{battle.charity}</span>
          </div>
        </div>
      </div>

      {/* --- CENTER: THE CONTENDERS & VS --- */}
      {/* Portraits stop above the HUD on phones. Previously this layer was
          inset-0, so the tall mobile HUD covered everything below the
          foreheads. */}
      <div className="absolute inset-x-0 top-16 bottom-[46%] sm:bottom-[40%] md:inset-0 md:top-0
                      z-10 flex justify-between items-end pointer-events-none">
        
        {/* Massive Background VS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <div className="font-arcade text-5xl sm:text-7xl md:text-[150px] font-black italic text-foreground opacity-[0.03] dark:opacity-[0.05] transform -skew-x-12 select-none">
            VS
          </div>
        </div>

        {/* Player 1 */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-[46%] md:w-1/2 h-full md:h-[85%] flex items-end justify-start pl-1 md:pl-16 z-10"
        >
          {/* maskImage creates a smooth fade at the bottom so they don't clip harshly into the HUD */}
          <Link
            href={`/profile/${battle.contenders[0].entityId}`}
            aria-label={`View ${battle.contenders[0].name}'s profile`}
            className="pointer-events-auto relative w-full max-w-[500px] h-full block group/contender"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
          >
            <Image
              src={battle.contenders[0].image}
              alt={battle.contenders[0].name}
              fill
              className="object-contain object-bottom drop-shadow-2xl transition-transform duration-300 group-hover/contender:scale-[1.03]"
            />
          </Link>
        </motion.div>

        {/* Player 2 */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-[46%] md:w-1/2 h-full md:h-[85%] flex items-end justify-end pr-1 md:pr-16 z-10"
        >
          <Link
            href={`/profile/${battle.contenders[1].entityId}`}
            aria-label={`View ${battle.contenders[1].name}'s profile`}
            className="pointer-events-auto relative w-full max-w-[500px] h-full block group/contender"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
          >
            <Image
              src={battle.contenders[1].image}
              alt={battle.contenders[1].name}
              fill
              className="object-contain object-bottom drop-shadow-2xl transition-transform duration-300 group-hover/contender:scale-[1.03]"
            />
          </Link>
        </motion.div>
      </div>

      {/* --- BOTTOM: THE HUD (Heads Up Display) --- */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-3 md:px-4 pb-24 lg:pb-12 mt-auto">
        
        {/* The Glass Panel */}
        <div className="corner-ticks bg-card/95 dark:bg-[#0A0A0C]/85 backdrop-blur-xl border border-border
                        cut-corner-lg p-4 md:p-6 shadow-2xl flex flex-col gap-3 md:gap-6">

          {/* Total pool. Was hidden below md, so the headline number the whole
              arena is about simply vanished on phones. */}
          <div className="flex md:hidden items-center justify-center gap-2 pb-1 border-b border-border/60">
            <span className="font-arcade text-[9px] text-foreground/40 tracking-widest">TOTAL POOL</span>
            <span className="font-arcade text-base text-primary font-bold tabular-nums">
              ${totalPool.toLocaleString()}
            </span>
          </div>

          {/* Stats Row. min-w-0 + truncate are what stop the two names running
              together into "RONALDOMESSI" on a narrow screen. */}
          <div className="flex justify-between items-end gap-3 md:gap-6">
            <div className="flex flex-col items-start min-w-0 flex-1">
              <h2
                className="brand-text w-full truncate text-lg sm:text-2xl md:text-5xl font-arcade
                           font-black tracking-wide md:tracking-wider uppercase mb-0.5 md:mb-1"
                style={{ "--brand": battle.contenders[0].color } as React.CSSProperties}
              >
                {battle.contenders[0].name}
              </h2>
              <span className="text-base sm:text-xl md:text-3xl font-arcade font-bold text-foreground tabular-nums">
                ${battle.contenders[0].amount.toLocaleString()}
              </span>
            </div>

            {/* Center VS Indicator for the panel */}
            <div className="hidden md:flex flex-col items-center justify-center pb-2 shrink-0">
              <span className="font-arcade text-xs text-foreground/40 tracking-widest mb-1">TOTAL POOL</span>
              <span className="font-arcade text-xl text-primary font-bold tabular-nums">
                ${totalPool.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col items-end min-w-0 flex-1">
              <h2
                className="brand-text w-full truncate text-right text-lg sm:text-2xl md:text-5xl font-arcade
                           font-black tracking-wide md:tracking-wider uppercase mb-0.5 md:mb-1"
                style={{ "--brand": battle.contenders[1].color } as React.CSSProperties}
              >
                {battle.contenders[1].name}
              </h2>
              <span className="text-base sm:text-xl md:text-3xl font-arcade font-bold text-foreground tabular-nums">
                ${battle.contenders[1].amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* The Sleek Energy Bar */}
          <div className="w-full h-4 md:h-6 bg-background cut-corner flex overflow-hidden border border-border relative">
            
            {/* Left Bar */}
            <motion.div 
              className="h-full relative shadow-[0_0_15px_currentColor]"
              style={{ backgroundColor: battle.contenders[0].color }}
              initial={{ width: "50%" }}
              animate={{ width: `${leftPercentage}%` }}
              transition={{ type: "spring", bounce: 0.2, duration: 1 }}
            />
            
            {/* Right Bar */}
            <motion.div 
              className="h-full relative shadow-[0_0_15px_currentColor]"
              style={{ backgroundColor: battle.contenders[1].color }}
              initial={{ width: "50%" }}
              animate={{ width: `${rightPercentage}%` }}
              transition={{ type: "spring", bounce: 0.2, duration: 1 }}
            />
            
            {/* Scanlines over the fills, so the bar reads as a lit HUD
                element rather than two flat blocks of colour. */}
            <div className="tex-scanlines absolute inset-0 z-10 pointer-events-none" />

            {/* Center Divider Line (Skewed for motion) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-full bg-foreground z-10 skew-x-12" />
          </div>

        </div>
      </div>

    </div>
  );
}