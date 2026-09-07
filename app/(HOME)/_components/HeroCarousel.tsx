"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Timer, ArrowUpRight, ImageOff, ChevronLeft, ChevronRight, Users, Trophy } from "lucide-react";
import type { LandingRoom } from "@/actions/getLanding";

const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US")}`;

function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ENDED";

  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;

  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} left`;
}

export default function HeroCarousel({ rooms }: { rooms: LandingRoom[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!rooms || rooms.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % rooms.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [rooms]);

  if (!rooms || rooms.length === 0) return null;

  const current = rooms[activeIndex] || rooms[0];
  const is1v1 = current.room_type === "1v1";
  const [leftContender, rightContender] = current.contenders || [];
  const href = `${is1v1 ? "/battle" : "/global"}/${current.id}`;

  const pool = is1v1
    ? (leftContender?.current_votes ?? 0) + (rightContender?.current_votes ?? 0)
    : current.total_pool;

  const leftVotes = leftContender?.current_votes ?? 0;
  const rightVotes = rightContender?.current_votes ?? 0;
  const totalVotes = leftVotes + rightVotes;
  const leftPct = totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 50;
  const rightPct = 100 - leftPct;
  const isLeftWinning = leftPct >= rightPct;

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % rooms.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + rooms.length) % rooms.length);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-end gap-4 mb-1">

        {/* Progress Indicator Dots & Chevrons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {rooms.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={prevSlide}
              aria-label="Previous featured arena"
              className="p-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next featured arena"
              className="p-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Spotlight Stage Card */}
      <div key={current.id} className="relative w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-stretch justify-between overflow-hidden hover:bg-white/[0.03] transition-colors duration-300">
        {/* Left Info Column - Streamlined & Minimal */}
        <div className="flex-1 flex flex-col justify-between py-2 gap-6 z-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {current.category}
              </span>
              <span className="text-muted-foreground/30">•</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-[10px] font-mono font-bold text-primary shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-snug">
              {current.title}
            </h1>
          </div>

          <div className="flex flex-col gap-5">
            {/* Inline Meta Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 font-bold text-base font-sans">{money(pool)}</span>
                <span className="text-[11px] text-muted-foreground">pool</span>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span className="font-semibold text-foreground">{current.vote_count || totalVotes}</span> votes
              </div>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>{countdown(current.expires_at)}</span>
              </div>
            </div>

            {/* Clean Action Button */}
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-sm group self-start"
            >
              <span>Enter Arena</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Visual Showcase Box */}
        <div className="lg:w-[480px] xl:w-[540px] shrink-0 flex flex-col justify-between gap-4 z-10">
          {is1v1 && leftContender && rightContender ? (
            /* 1v1 Contender Showcase Box */
            <div className="flex flex-col gap-4 h-full justify-between">
              <div className="relative w-full h-[200px] sm:h-[220px] rounded-2xl overflow-hidden bg-muted/60 border border-border/60 p-2 flex items-center gap-2">
                {/* Left Contender Image */}
                <div className="relative w-1/2 h-full rounded-xl overflow-hidden bg-black/40">
                  {leftContender.image_url ? (
                    <Image src={leftContender.image_url} alt={leftContender.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary">
                      {leftContender.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-black/90 border border-white/20 text-xs font-extrabold text-white z-10 shadow-lg tracking-widest">
                  VS
                </div>

                {/* Right Contender Image */}
                <div className="relative w-1/2 h-full rounded-xl overflow-hidden bg-black/40">
                  {rightContender.image_url ? (
                    <Image src={rightContender.image_url} alt={rightContender.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary">
                      {rightContender.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* 1v1 Progress Split */}
              <div className="w-full p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className={isLeftWinning ? "text-foreground font-semibold" : "text-muted-foreground"}>
                    {leftContender.name} <span className={isLeftWinning ? "text-primary font-bold" : ""}>({leftPct}%)</span>
                  </span>
                  <span className={!isLeftWinning ? "text-foreground font-semibold" : "text-muted-foreground"}>
                    <span className={!isLeftWinning ? "text-primary font-bold" : ""}>({rightPct}%)</span> {rightContender.name}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${isLeftWinning ? "bg-primary" : "bg-muted/80"}`}
                    style={{ width: `${leftPct}%` }}
                  />
                  <div
                    className={`h-full flex-1 transition-all duration-500 ${!isLeftWinning ? "bg-primary" : "bg-muted/80"}`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Global Leaderboard Cover Showcase Box */
            <div className="relative w-full h-[260px] sm:h-[280px] rounded-2xl overflow-hidden bg-muted/60 border border-border/60">
              {current.cover_image ? (
                <Image
                  src={current.cover_image}
                  alt={current.title}
                  fill
                  sizes="540px"
                  className="object-cover opacity-90"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <ImageOff className="w-12 h-12" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-primary font-bold text-xs border border-white/10 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Leaderboard Arena
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
