"use client";

import Image from "next/image";
import Link from "next/link";
import { readableBrand } from "@/lib/color";
import { ChevronRight, Swords } from "lucide-react";

export default function FaceOffsRow({ liveBattles }: { liveBattles: any[] }) {
  if (!liveBattles || liveBattles.length === 0) {
    return (
      <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Swords className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">
            No active face-offs match this filter
          </p>
        </div>
      </section>
    );
  }

  const half = Math.ceil(liveBattles.length / 2);
  const row1 = liveBattles.slice(0, half);
  const row2 = liveBattles.slice(half);

  const renderCard = (battle: any) => {
    const sortedContenders =
      battle.room_contenders?.sort((a: any, b: any) => a.seed_index - b.seed_index) || [];
    const rc1 = sortedContenders[0];
    const rc2 = sortedContenders[1];
    const c1 = rc1?.entities;
    const c2 = rc2?.entities;

    if (!c1 || !c2) return null;

    const v1 = Number(rc1.current_votes) || 0;
    const v2 = Number(rc2.current_votes) || 0;
    const totalVotes = v1 + v2;
    const pct1 = totalVotes > 0 ? Math.round((v1 / totalVotes) * 100) : 50;
    const pct2 = 100 - pct1;

    const isC1Winning = pct1 >= pct2;

    return (
      <Link href={`/battle/${battle.id}`} key={battle.id} className="snap-start shrink-0 group">
        <div className="relative w-[300px] sm:w-[330px] md:w-[350px] h-[230px] md:h-[240px] rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 flex flex-col justify-between hover:bg-white/[0.03] transition-all duration-200 ease-out group-hover:-translate-y-0.5 shadow-xs">
          {/* Top Visual Box with 2 Contender Images */}
          <div className="relative w-full h-[120px] md:h-[130px] rounded-xl overflow-hidden bg-muted/40 border border-border/50 flex flex-row items-center justify-between p-1 gap-1">
            {/* Left Image Frame */}
            <div className="relative w-1/2 h-full rounded-lg overflow-hidden bg-black/40">
              {c1.image_url ? (
                <Image src={c1.image_url} alt={c1.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs" style={{ color: c1.brand_color }}>
                  {c1.name.charAt(0)}
                </div>
              )}
            </div>

            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card border border-border/80 text-[9px] font-mono font-bold text-muted-foreground z-10 flex items-center justify-center shadow-md tracking-wider select-none">
              VS
            </div>

            {/* Right Image Frame */}
            <div className="relative w-1/2 h-full rounded-lg overflow-hidden bg-black/40">
              {c2.image_url ? (
                <Image src={c2.image_url} alt={c2.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs" style={{ color: c2.brand_color }}>
                  {c2.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Middle Info & Progress Bar */}
          <div className="flex flex-col gap-1.5 my-0.5">
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1 tracking-tight">
                {c1.name} <span className="text-muted-foreground font-normal text-[11px]">vs</span> {c2.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground shrink-0">
                {battle.category}
              </span>
            </div>

            {/* Minimal Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${isC1Winning ? "bg-primary" : "bg-muted/80"}`}
                style={{ width: `${pct1}%` }}
              />
              <div
                className={`h-full flex-1 transition-all duration-500 ${!isC1Winning ? "bg-primary" : "bg-muted/80"}`}
              />
            </div>
          </div>

          {/* Bottom Footer Metadata */}
          <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2 font-mono">
            <span className="font-bold text-foreground text-xs">
              {(battle.total_pool || 0).toLocaleString()}{" "}
              <span className="font-normal text-muted-foreground text-[10px]">pool</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              {totalVotes.toLocaleString()} votes
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="w-full py-2">
      <div className="flex flex-col gap-3 sm:gap-3.5 pt-2 pb-2">
        <div className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {row1.map(renderCard)}
        </div>

        {row2.length > 0 && (
          <div className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {row2.map(renderCard)}
          </div>
        )}
      </div>
    </section>
  );
}