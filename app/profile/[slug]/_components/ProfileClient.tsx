"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flame, Trophy, HeartHandshake, Swords, MessageSquare, Zap } from "lucide-react";
import UpvoteButton from "@/components/ui/UpvoteButton";

// REMOVED MOCK DATA!

export default function ProfileClient({ initialProfileData }: { initialProfileData: any }) {
  const profileData = initialProfileData;

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8">
      
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary font-arcade text-xs transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> RETURN HOME
      </Link>

      {/* --- HERO BANNER --- */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-card border border-border cut-corner-lg overflow-hidden flex items-end shadow-xl mb-8">
        <div className="absolute inset-0">
          <Image src={profileData.banner} alt="Banner" fill className="object-cover opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 justify-between">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 md:w-48 md:h-48 cut-corner bg-background border-b-4 relative overflow-hidden" style={{ borderColor: profileData.color }}>
              <Image src={profileData.image} alt={profileData.name} fill className="object-cover object-top" />
            </div>
            
            <div className="flex flex-col pb-2">
              <span className="cut-corner px-3 py-1 bg-background text-foreground border border-border font-arcade text-[10px] font-bold w-fit mb-3">
                {profileData.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-arcade font-black text-foreground uppercase tracking-wider leading-none">
                {profileData.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end pb-2">
            <span className="font-arcade text-foreground/50 text-xs tracking-widest mb-1">GLOBAL RANK</span>
            <span className="text-5xl md:text-6xl font-arcade font-black striped-text" style={{ filter: `drop-shadow(0 0 10px ${profileData.color}40)`}}>
              #{profileData.rank}
            </span>
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-card border border-border cut-corner p-5 flex flex-col gap-2">
          <Flame className="w-5 h-5 text-battle-yellow mb-1" />
          <span className="font-arcade text-foreground/50 text-[10px] tracking-widest">ALL-TIME RAISED</span>
          <span className="font-arcade text-2xl font-bold text-battle-yellow">${profileData.totalRaised.toLocaleString()}</span>
        </div>
        
        <div className="bg-card border border-border cut-corner p-5 flex flex-col gap-2">
          <Trophy className="w-5 h-5 text-battle-green mb-1" />
          <span className="font-arcade text-foreground/50 text-[10px] tracking-widest">WIN RATE</span>
          <span className="font-arcade text-2xl font-bold text-foreground">{profileData.winRate}</span>
        </div>

        <div className="bg-card border border-border cut-corner p-5 flex flex-col gap-2">
          <Swords className="w-5 h-5 text-primary mb-1" />
          <span className="font-arcade text-foreground/50 text-[10px] tracking-widest">TOTAL BATTLES</span>
          <span className="font-arcade text-2xl font-bold text-foreground">{profileData.battles}</span>
        </div>

        <div className="bg-card border border-border cut-corner p-5 flex flex-col gap-2">
          <HeartHandshake className="w-5 h-5 text-battle-pink mb-1" />
          <span className="font-arcade text-foreground/50 text-[10px] tracking-widest">TOP CHARITY</span>
          <span className="font-sans text-sm font-bold text-foreground truncate">{profileData.topCharity}</span>
        </div>
      </div>

      {/* --- TESTIMONIALS WALL --- */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-arcade text-foreground/50 tracking-widest text-sm uppercase">Wall of Fame (Paid Backing)</h3>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profileData.testimonials.map((t: any) => {
            const isWhale = t.amount >= 50;
            return (
              <div key={t.id} className={`bg-card border cut-corner p-6 flex flex-col gap-4 relative overflow-hidden ${isWhale ? 'border-battle-yellow shadow-[0_0_15px_rgba(255,214,0,0.05)]' : 'border-border'}`}>
                {isWhale && <div className="absolute top-0 right-0 w-16 h-16 bg-battle-yellow/10 rounded-full blur-xl pointer-events-none" />}
                
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-background border border-border cut-corner overflow-hidden">
                      <Image src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${t.user}`} alt={t.user} width={32} height={32} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-arcade text-sm font-bold text-foreground">{t.user}</span>
                      <span className="font-sans text-[10px] text-foreground/40">{t.date}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 font-arcade text-xs px-3 py-1 cut-corner ${isWhale ? 'bg-battle-yellow text-black' : 'bg-background text-foreground border border-border'}`}>
                    <Zap className="w-3 h-3" /> ${t.amount}
                  </div>
                </div>

                <p className="font-sans text-sm text-foreground/80 leading-relaxed italic z-10">
                  "{t.text}"
                </p>

                {/* Free Arcade Upvote Button */}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-4 z-10">
                  <span className="font-arcade text-[10px] text-foreground/30 uppercase tracking-widest">COMMUNITY RATING</span>
                  <UpvoteButton initialCount={t.upvotes} />
                </div>
              </div>
            );
          })}
          
          {profileData.testimonials.length === 0 && (
             <div className="col-span-1 md:col-span-2 text-center py-12 text-foreground/40 font-arcade text-sm bg-card border border-border cut-corner">
                NO TESTIMONIALS YET. BACK THEM IN AN ARENA TO LEAVE ONE!
             </div>
          )}
        </div>
      </div>

    </div>
  );
}