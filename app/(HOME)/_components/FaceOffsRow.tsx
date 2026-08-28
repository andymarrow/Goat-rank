"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Timer } from "lucide-react";

const FACE_OFFS = [
  { id: "b1", title: "The Ultimate GOAT", c1: { name: "Ronaldo", img: "/image/ronaldo.png", color: "#F9F8F3" }, c2: { name: "Messi", img: "/image/messi.png", color: "#3B82F6" }, pool: "$24.5K" },
  { id: "b2", title: "Next Gen Console", c1: { name: "PS5", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b3629?w=400&q=80", color: "#3B82F6" }, c2: { name: "Xbox", img: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80", color: "#00E676" }, pool: "$12.1K" },
  { id: "b3", title: "Code Editor War", c1: { name: "Cursor", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80", color: "#FF7A00" }, c2: { name: "VS Code", img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80", color: "#3B82F6" }, pool: "$8.2K" },
  { id: "b4", title: "Muscle Car King", c1: { name: "Mustang", img: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=400&q=80", color: "#FF4444" }, c2: { name: "Camaro", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80", color: "#FACC15" }, pool: "$5.9K" },
];

export default function FaceOffsRow() {
  return (
    <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-arcade font-bold text-foreground flex items-center gap-2 group cursor-pointer">
          Active Face-Offs <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
        </h2>
      </div>

      <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory">
        {FACE_OFFS.map((battle) => (
          <Link href={`/battle/${battle.id}`} key={battle.id} className="snap-start shrink-0 group">
            {/* Portrait Card */}
            <div className="relative w-[240px] md:w-[280px] h-[360px] md:h-[420px] cut-corner bg-black border border-border group-hover:border-primary/50 transition-all overflow-hidden flex flex-col">
              
              {/* Top Split (Contender 1) */}
              <div className="relative flex-1 w-full bg-[#111]">
                <Image src={battle.c1.img} alt={battle.c1.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                <span className="absolute bottom-4 left-4 font-arcade text-white text-lg font-bold z-10" style={{ color: battle.c1.color }}>{battle.c1.name}</span>
              </div>

              {/* Absolute Center VS Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black border border-white/20 cut-corner z-20 flex items-center justify-center font-arcade text-xs text-white/50 italic backdrop-blur-md">
                VS
              </div>

              {/* Bottom Split (Contender 2) */}
              <div className="relative flex-1 w-full bg-[#111]">
                <Image src={battle.c2.img} alt={battle.c2.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                <span className="absolute top-4 right-4 font-arcade text-white text-lg font-bold z-10 text-right" style={{ color: battle.c2.color }}>{battle.c2.name}</span>
                
                {/* Meta Info */}
                <div className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-end z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/50 font-arcade">POOL</span>
                    <span className="text-yellow-400 font-arcade font-bold">{battle.pool}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-[10px] font-arcade bg-primary/10 px-2 py-1 cut-corner border border-primary/20">
                    <Timer className="w-3 h-3" /> LIVE
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