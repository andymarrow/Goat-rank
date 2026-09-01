"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Users, Flame } from "lucide-react";

const FILTERS = ["All", "Sports", "Gaming", "Tech", "Music"];

const GLOBAL_ROOMS = [
  { id: "g1", rank: 1, title: "The Soccer GOAT", pool: "$240.5K", users: "14.2K", image: "https://images.unsplash.com/photo-1518605368461-1ee7e1634b6e?w=800&q=80", category: "Sports" },
  { id: "g2", rank: 2, title: "Best Sci-Fi Movie", pool: "$182.1K", users: "9.8K", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80", category: "Movies" },
  { id: "g3", rank: 3, title: "Top Code Editor", pool: "$95.0K", users: "5.1K", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80", category: "Tech" },
  { id: "g4", rank: 4, title: "Greatest F1 Driver", pool: "$64.2K", users: "3.2K", image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80", category: "Sports" },
];

export default function GlobalLeaderboardsRow() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
        <h2 className="text-2xl md:text-3xl font-arcade font-bold text-foreground flex items-center gap-2 group cursor-pointer">
          Global Arenas <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
        </h2>
        
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
          {FILTERS.map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`pressable px-4 py-1.5 rounded-full text-xs font-arcade transition-colors whitespace-nowrap border ${
                activeFilter === f 
                  ? "bg-primary text-black border-primary" 
                  : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory">
        {GLOBAL_ROOMS.map((room) => (
          <Link href={`/global/${room.id}`} key={room.id} className="pressable hover-lift snap-start shrink-0 group">
            <div className="corner-ticks relative w-[300px] md:w-[400px] aspect-[16/9] cut-corner overflow-hidden bg-black border border-border group-hover:border-primary/50 transition-colors">
              
              <Image src={room.image} alt={room.title} fill className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="tex-scanlines absolute inset-0 pointer-events-none" />

              {/* Top Right Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <Flame className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Info with Striped Number */}
              <div className="absolute bottom-0 left-0 p-4 flex items-end gap-3 w-full">
                <span className="text-6xl md:text-7xl font-arcade font-black striped-text leading-none select-none">
                  {room.rank}
                </span>
                
                <div className="flex flex-col pb-1">
                  <h3 className="text-lg font-arcade font-bold text-white leading-tight mb-1">{room.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-arcade text-white/70">
                    <span className="text-yellow-400">{room.pool} Pool</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.users}</span>
                  </div>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}