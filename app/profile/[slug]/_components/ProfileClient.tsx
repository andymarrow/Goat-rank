"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flame, Trophy, HeartHandshake, Swords, MessageSquare, Zap } from "lucide-react";
import UpvoteButton from "@/components/ui/UpvoteButton";

export default function ProfileClient({ initialProfileData }: { initialProfileData: any }) {
  const profileData = initialProfileData;

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 font-sans">

      {/* Back Button */}
      <Link
        href="/"
        className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card hover:bg-card/80 border border-border/80 text-foreground text-xs font-bold tracking-wider transition-all shadow-xs mb-6"
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
        <span>BACK TO LOBBY</span>
      </Link>

      {/* --- HERO BANNER --- */}
      <div className="relative w-full rounded-3xl bg-card border border-border/80 overflow-hidden shadow-2xl mb-8">
        {/* Background Image & Ambient Blur Overlay */}
        <div className="relative w-full h-[220px] sm:h-[280px] md:h-[340px] overflow-hidden">
          <Image
            src={profileData.banner}
            alt="Banner"
            fill
            priority
            className="object-cover opacity-30 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>

        {/* Content Bar */}
        <div className="relative z-10 w-full p-6 md:p-8 -mt-20 sm:-mt-24 md:-mt-28 flex flex-col md:flex-row md:items-end gap-6 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Contender Avatar Frame */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl bg-zinc-900 border-4 border-card relative overflow-hidden shadow-2xl shrink-0"
              style={{ boxShadow: `0 10px 30px -10px ${profileData.color || '#3b82f6'}40` }}
            >
              {profileData.image ? (
                <Image
                  src={profileData.image}
                  alt={profileData.name}
                  fill
                  priority
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-muted-foreground bg-zinc-900">
                  {profileData.name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-col pb-1">
              <span className="px-3 py-1 rounded-lg bg-card/90 border border-border/80 text-primary text-[11px] font-bold uppercase tracking-widest w-fit mb-2 shadow-xs backdrop-blur-md">
                {profileData.category || "CONTENDER"}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground uppercase tracking-tight leading-none">
                {profileData.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end pb-1 border-t md:border-t-0 border-border/40 pt-4 md:pt-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">GLOBAL RANK</span>
            <span
              className="text-4xl sm:text-5xl md:text-6xl font-black text-primary tracking-tight tabular-nums"
              style={{ filter: `drop-shadow(0 0 15px ${profileData.color || '#3b82f6'}50)` }}
            >
              #{profileData.rank}
            </span>
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:border-border transition-all">
          <Flame className="w-5 h-5 text-amber-500 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">ALL-TIME RAISED</span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-400 tabular-nums">${profileData.totalRaised.toLocaleString()}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:border-border transition-all">
          <Trophy className="w-5 h-5 text-emerald-500 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">WIN RATE</span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{profileData.winRate}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:border-border transition-all">
          <Swords className="w-5 h-5 text-primary mb-1" />
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">TOTAL BATTLES</span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{profileData.battles}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:border-border transition-all">
          <HeartHandshake className="w-5 h-5 text-rose-500 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">TOP CHARITY</span>
          <span className="text-sm font-bold text-foreground truncate">{profileData.topCharity}</span>
        </div>
      </div>

      {/* --- TESTIMONIALS WALL --- */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Wall of Fame (Paid Backing)
          </h3>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profileData.testimonials.map((t: any) => {
            const isWhale = t.amount >= 50;
            return (
              <div
                key={t.id}
                className={`bg-card border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${isWhale
                  ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                  : 'border-border/80 shadow-xs hover:border-border'
                  }`}
              >
                {isWhale && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-border/80 overflow-hidden flex items-center justify-center">
                      <Image src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${t.user}`} alt={t.user} width={36} height={36} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{t.user}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">{t.date}</span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl ${isWhale
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : 'bg-zinc-800/80 text-foreground border border-border/60'
                      }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> ${t.amount}
                  </div>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed font-sans z-10">
                  "{t.text}"
                </p>

                {/* Upvote Button Row */}
                <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-4 z-10">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    COMMUNITY RATING
                  </span>
                  <UpvoteButton initialCount={t.upvotes} voteId={t.id} />
                </div>
              </div>
            );
          })}

          {profileData.testimonials.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground text-sm font-medium bg-card border border-border/80 rounded-2xl shadow-xs">
              NO TESTIMONIALS YET. BACK THEM IN AN ARENA TO LEAVE ONE!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}