"use client";

import { ArrowRight, Coins, HeartHandshake, Swords } from "lucide-react";

export default function BriefingStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h3 className="text-3xl md:text-4xl font-arcade font-bold text-white mb-2 uppercase">
          Become a <span className="text-primary">Creator</span>
        </h3>
        <p className="text-white/60 font-sans max-w-xl">
          For $10, you unlock the ability to host up to 3 custom battles. Set the rules, choose the contenders, and earn real money when the community votes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Card 1 */}
        <div className="bg-black/50 border border-white/10 cut-corner p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors">
          <div className="w-10 h-10 bg-primary/20 flex items-center justify-center cut-corner text-primary">
            <Swords className="w-5 h-5" />
          </div>
          <h4 className="text-white font-arcade text-sm font-bold">3 BATTLES</h4>
          <p className="text-xs text-white/50 font-sans leading-relaxed">
            Your $10 access pass lets you deploy up to 3 highly customized 1v1 arenas or global tier lists.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-black/50 border border-white/10 cut-corner p-5 flex flex-col gap-3 hover:border-yellow-400/50 transition-colors">
          <div className="w-10 h-10 bg-yellow-400/20 flex items-center justify-center cut-corner text-yellow-400">
            <Coins className="w-5 h-5" />
          </div>
          <h4 className="text-white font-arcade text-sm font-bold">10% COMMISSION</h4>
          <p className="text-xs text-white/50 font-sans leading-relaxed">
            You earn a 10% cut of every single vote placed in your active rooms. Paid directly to your wallet.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-black/50 border border-white/10 cut-corner p-5 flex flex-col gap-3 hover:border-battle-pink/50 transition-colors">
          <div className="w-10 h-10 bg-battle-pink/20 flex items-center justify-center cut-corner text-battle-pink">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h4 className="text-white font-arcade text-sm font-bold">30% CHARITY</h4>
          <p className="text-xs text-white/50 font-sans leading-relaxed">
            The winning contender secures 30% of the total pool for a charity of their choice. You drive the impact.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto flex justify-end">
        <button
          onClick={onNext}
          className="cut-corner bg-primary text-primary-foreground px-8 py-4 font-arcade font-bold flex items-center gap-3 hover:bg-primary/90 transition-all hover:translate-x-1"
        >
          <span>ACCEPT TERMS & CONTINUE</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}