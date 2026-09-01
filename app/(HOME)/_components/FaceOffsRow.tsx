"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Timer } from "lucide-react";

export default function FaceOffsRow({ liveBattles }: { liveBattles: any[] }) {
  
  if (!liveBattles || liveBattles.length === 0) return null;

  return (
    <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-arcade font-bold text-foreground flex items-center gap-2 group cursor-pointer">
          Active Face-Offs <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
        </h2>
      </div>

      <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory">
        {liveBattles.map((battle) => {
          
          // Format data from Supabase
          // Supabase returns an array of contenders. We sort them by seed_index so Left is always Left.
          const sortedContenders = battle.room_contenders.sort((a: any, b: any) => a.seed_index - b.seed_index);
          const c1 = sortedContenders[0]?.entities;
          const c2 = sortedContenders[1]?.entities;

          if (!c1 || !c2) return null;

          return (
            <Link href={`/battle/${battle.id}`} key={battle.id} className="pressable hover-lift snap-start shrink-0 group">
              <div className="corner-ticks relative w-[240px] md:w-[280px] h-[360px] md:h-[420px] cut-corner bg-black border border-border group-hover:border-primary/50 transition-all overflow-hidden flex flex-col">
                {/* Board texture over both halves, under the VS badge (z-20)
                    and the meta row (z-10). */}
                <div className="tex-dots absolute inset-0 z-[5] pointer-events-none" />
                
                {/* Top Split (Contender 1) */}
                <div className="relative flex-1 w-full bg-[#111]">
                  <Image src={c1.image_url} alt={c1.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                  <span className="absolute bottom-4 left-4 font-arcade text-white text-lg font-bold z-10" style={{ color: c1.brand_color }}>{c1.name}</span>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black border border-white/20 cut-corner z-20 flex items-center justify-center font-arcade text-xs text-white/50 italic backdrop-blur-md">
                  VS
                </div>

                {/* Bottom Split (Contender 2) */}
                <div className="relative flex-1 w-full bg-[#111]">
                  <Image src={c2.image_url} alt={c2.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                  <span className="absolute top-4 right-4 font-arcade text-white text-lg font-bold z-10 text-right" style={{ color: c2.brand_color }}>{c2.name}</span>
                  
                  {/* Meta Info */}
                  <div className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-end z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/50 font-arcade">POOL</span>
                      <span className="text-yellow-400 font-arcade font-bold">${battle.total_pool.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary text-[10px] font-arcade bg-primary/10 px-2 py-1 cut-corner border border-primary/20">
                      <Timer className="w-3 h-3" /> LIVE
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}