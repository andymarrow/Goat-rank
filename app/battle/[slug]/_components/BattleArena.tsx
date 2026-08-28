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
    <div className="relative w-full h-full min-h-[600px] flex flex-col justify-between overflow-hidden p-4 md:p-8">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* We use radial gradients to create a subtle spotlight behind each player based on their color */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-full opacity-10" 
        style={{ background: `radial-gradient(circle at center, ${battle.contenders[0].color} 0%, transparent 70%)` }}
      />
      <div 
        className="absolute top-0 right-0 w-1/2 h-full opacity-10" 
        style={{ background: `radial-gradient(circle at center, ${battle.contenders[1].color} 0%, transparent 70%)` }}
      />
      {/* A grid overlay to make it look like a tactical/sports HUD */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

      {/* --- TOP BAR (Nav & Timer) --- */}
      <div className="relative z-20 flex justify-between items-start">
        <Link href="/" className="cut-corner bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 flex items-center gap-2 font-arcade text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> ARENA
        </Link>
        
        <div className="flex flex-col items-end gap-2">
          <div className="cut-corner bg-black/60 border border-white/10 backdrop-blur-md px-6 py-2 flex items-center gap-3">
            <Timer className="w-5 h-5 text-primary" />
            <span className="font-arcade text-xl text-white tracking-widest">{battle.timeLeft}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-arcade text-white/60 bg-black/40 px-3 py-1 cut-corner">
            <HeartHandshake className="w-3 h-3 text-battle-pink" />
            Charity: {battle.charity}
          </div>
        </div>
      </div>

      {/* --- CENTER: THE CONTENDERS --- */}
      <div className="absolute inset-0 flex justify-between items-end pt-20 z-10 pointer-events-none">
        {/* Player 1 */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-1/2 h-[90%] flex items-end justify-start pl-4 md:pl-12"
        >
          <div className="relative w-full max-w-[400px] h-full">
            <Image src={battle.contenders[0].image} alt={battle.contenders[0].name} fill className="object-contain object-bottom" />
          </div>
        </motion.div>

        {/* Player 2 */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-1/2 h-[90%] flex items-end justify-end pr-4 md:pr-12"
        >
          <div className="relative w-full max-w-[400px] h-full">
            <Image src={battle.contenders[1].image} alt={battle.contenders[1].name} fill className="object-contain object-bottom" />
          </div>
        </motion.div>

        {/* "VS" Badge in the absolute center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="font-arcade text-4xl md:text-6xl font-black italic text-white opacity-20 transform -skew-x-12">
            VS
          </div>
        </div>
      </div>

      {/* --- BOTTOM: THE TUG OF WAR BAR --- */}
      <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col gap-4 mt-auto pb-4">
        
        {/* Names & Current Dollar Values */}
        <div className="flex justify-between items-end font-arcade text-white">
          <div className="flex flex-col items-start">
            <h2 className="text-3xl md:text-5xl font-black tracking-wider uppercase mb-1" style={{ color: battle.contenders[0].color }}>
              {battle.contenders[0].name}
            </h2>
            <span className="text-xl md:text-2xl">${battle.contenders[0].amount.toLocaleString()}</span>
          </div>

          <div className="flex flex-col items-end">
            <h2 className="text-3xl md:text-5xl font-black tracking-wider uppercase mb-1" style={{ color: battle.contenders[1].color }}>
              {battle.contenders[1].name}
            </h2>
            <span className="text-xl md:text-2xl">${battle.contenders[1].amount.toLocaleString()}</span>
          </div>
        </div>

        {/* The Massive Progress Bar */}
        <div className="w-full h-8 md:h-12 bg-[#121417] cut-corner flex overflow-hidden border-2 border-white/10 relative shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <motion.div 
            className="h-full relative flex items-center justify-end pr-4"
            style={{ backgroundColor: battle.contenders[0].color }}
            initial={{ width: "50%" }}
            animate={{ width: `${leftPercentage}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 1 }}
          />
          
          <motion.div 
            className="h-full relative flex items-center justify-start pl-4"
            style={{ backgroundColor: battle.contenders[1].color }}
            initial={{ width: "50%" }}
            animate={{ width: `${rightPercentage}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 1 }}
          />
          
          {/* Center Indicator Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white/30 z-10 skew-x-12" />
        </div>
      </div>

    </div>
  );
}