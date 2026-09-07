"use client";

import { ArrowRight, Coins, HeartHandshake, Swords } from "lucide-react";

export default function BriefingStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full font-sans">
      <div className="mb-8">
        <h3 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 uppercase tracking-tight">
          Become a <span className="text-primary">Creator</span>
        </h3>
        <p className="text-muted-foreground text-sm font-sans max-w-xl leading-relaxed">
          For $10, you unlock the ability to host up to 3 custom battles. Set the rules, choose the contenders, and earn real money when the community votes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Card 1 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-all shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Swords className="w-5 h-5" />
          </div>
          <h4 className="text-foreground text-xs font-bold uppercase tracking-wider">3 BATTLES</h4>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            Your $10 access pass lets you deploy up to 3 highly customized 1v1 arenas or global tier lists.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-amber-500/50 transition-all shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <h4 className="text-foreground text-xs font-bold uppercase tracking-wider">10% COMMISSION</h4>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            You earn a 10% cut of every single vote placed in your active rooms. Paid directly to your wallet.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-rose-500/50 transition-all shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h4 className="text-foreground text-xs font-bold uppercase tracking-wider">30% CHARITY</h4>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            The winning contender secures 30% of the total pool for a charity of their choice. You drive the impact.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto flex justify-end">
        <button
          onClick={onNext}
          className="rounded-xl bg-primary text-primary-foreground px-6 py-3.5 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>ACCEPT TERMS & CONTINUE</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}