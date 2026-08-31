"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Timer, ArrowLeft, HeartHandshake } from "lucide-react";
import Link from "next/link";

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
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-[0.02] pointer-events-none mix-blend-overlay" />

      {/* --- TOP BAR (Nav & Timer) --- */}
      <div className="relative z-30 flex justify-between items-start p-4 md:p-8">
        <Link href="/" className="cut-corner bg-card/80 backdrop-blur-md border border-border hover:bg-card/100 text-foreground px-4 py-2 flex items-center gap-2 font-arcade text-sm transition-all shadow-lg">
          <ArrowLeft className="w-4 h-4" /> ARENA
        </Link>
        
        <div className="flex flex-col items-end gap-2">
          <div className="cut-corner bg-card/90 border border-border backdrop-blur-md px-6 py-2 flex items-center gap-3 shadow-xl">
            <Timer className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-arcade text-xl text-foreground tracking-widest">{battle.timeLeft}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-arcade text-foreground/70 bg-background/80 px-3 py-1 cut-corner border border-border">
            <HeartHandshake className="w-3 h-3 text-battle-pink" />
            Charity: {battle.charity}
          </div>
        </div>
      </div>

      {/* --- CENTER: THE CONTENDERS & VS --- */}
      <div className="absolute inset-0 z-10 flex justify-between items-end pointer-events-none">
        
        {/* Massive Background VS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <div className="font-arcade text-8xl md:text-[150px] font-black italic text-foreground opacity-[0.03] dark:opacity-[0.05] transform -skew-x-12 select-none">
            VS
          </div>
        </div>

        {/* Player 1 */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-1/2 h-[85%] flex items-end justify-start pl-4 md:pl-16 z-10"
        >
          {/* maskImage creates a smooth fade at the bottom so they don't clip harshly into the HUD */}
          <div className="relative w-full max-w-[500px] h-full" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
            <Image src={battle.contenders[0].image} alt={battle.contenders[0].name} fill className="object-contain object-bottom drop-shadow-2xl" />
          </div>
        </motion.div>

        {/* Player 2 */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-1/2 h-[85%] flex items-end justify-end pr-4 md:pr-16 z-10"
        >
          <div className="relative w-full max-w-[500px] h-full" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
            <Image src={battle.contenders[1].image} alt={battle.contenders[1].name} fill className="object-contain object-bottom drop-shadow-2xl" />
          </div>
        </motion.div>
      </div>

      {/* --- BOTTOM: THE HUD (Heads Up Display) --- */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-4 pb-8 md:pb-12 mt-auto">
        
        {/* The Glass Panel */}
        <div className="bg-card/80 dark:bg-[#0A0A0C]/80 backdrop-blur-xl border border-border cut-corner-lg p-6 shadow-2xl flex flex-col gap-6">
          
          {/* Stats Row */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col items-start">
              <h2 className="text-3xl md:text-5xl font-arcade font-black tracking-wider uppercase mb-1 drop-shadow-md" style={{ color: battle.contenders[0].color }}>
                {battle.contenders[0].name}
              </h2>
              <span className="text-xl md:text-3xl font-arcade font-bold text-foreground drop-shadow-md">
                ${battle.contenders[0].amount.toLocaleString()}
              </span>
            </div>

            {/* Center VS Indicator for the panel */}
            <div className="hidden md:flex flex-col items-center justify-center pb-2">
              <span className="font-arcade text-xs text-foreground/40 tracking-widest mb-1">TOTAL POOL</span>
              <span className="font-arcade text-xl text-primary font-bold">${totalPool.toLocaleString()}</span>
            </div>

            <div className="flex flex-col items-end">
              <h2 className="text-3xl md:text-5xl font-arcade font-black tracking-wider uppercase mb-1 drop-shadow-md text-right" style={{ color: battle.contenders[1].color }}>
                {battle.contenders[1].name}
              </h2>
              <span className="text-xl md:text-3xl font-arcade font-bold text-foreground drop-shadow-md">
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
            
            {/* Center Divider Line (Skewed for motion) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-full bg-foreground z-10 skew-x-12" />
          </div>

        </div>
      </div>

    </div>
  );
}