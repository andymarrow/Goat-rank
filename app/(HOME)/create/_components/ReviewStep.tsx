"use client";

import { ArrowLeft, ShieldAlert, CheckCircle2, Zap } from "lucide-react";

export default function ReviewStep({ 
  formData, 
  onPrev, 
  onCheckout,
  isSubmitting 
}: { 
  formData: any; 
  onPrev: () => void;
  onCheckout: () => void;
  isSubmitting: boolean;
}) {
  const c1 = formData.contenders[0];
  const c2 = formData.contenders[1];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* --- LEFT: BATTLE PREVIEW --- */}
        <div>
          <h3 className="text-white/60 font-arcade text-xs tracking-widest mb-4">DEPLOYMENT PREVIEW</h3>
          
          <div className="bg-black border border-white/10 cut-corner p-6 relative">
            <div className="absolute top-0 right-0 bg-primary text-black font-arcade text-[10px] px-2 py-1 font-bold cut-corner">
              {formData.category}
            </div>
            
            <h2 className="text-2xl font-arcade font-bold text-white mb-6 uppercase pr-10">
              {formData.title}
            </h2>
            
            <div className="flex items-center justify-between relative">
              {/* Contender 1 Mini-badge */}
              <div className="flex flex-col items-start w-[40%]">
                <div className="w-full h-2 mb-2 cut-corner" style={{ backgroundColor: c1.color }} />
                <span className="font-arcade text-white text-sm truncate w-full">{c1.name}</span>
              </div>
              
              <span className="font-arcade text-white/30 italic text-xl">VS</span>
              
              {/* Contender 2 Mini-badge */}
              <div className="flex flex-col items-end w-[40%]">
                <div className="w-full h-2 mb-2 cut-corner" style={{ backgroundColor: c2.color }} />
                <span className="font-arcade text-white text-sm truncate w-full text-right">{c2.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: TERMINAL RECEIPT --- */}
        <div>
           <h3 className="text-white/60 font-arcade text-xs tracking-widest mb-4">AUTHORIZATION RECEIPT</h3>
           
           <div className="bg-[#050505] border border-white/5 p-6 font-arcade text-sm flex flex-col gap-4">
              <div className="flex justify-between items-center text-white/80 border-b border-white/10 pb-4">
                <span>CREATOR PASS (3 ROOMS)</span>
                <span>$10.00</span>
              </div>
              
              <div className="flex flex-col gap-2 text-xs text-white/50 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>10% CREATOR COMMISSION ENABLED</span>
                </div>
                <div className="flex items-center gap-2 text-battle-pink">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>30% CHARITY SPLIT VERIFIED</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <span className="text-white/60">TOTAL DUE</span>
                <span className="text-3xl font-bold text-primary">$10.00</span>
              </div>
           </div>
        </div>

      </div>

      {/* --- NAVIGATION & CHECKOUT --- */}
      <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
        <button 
          onClick={onPrev} 
          disabled={isSubmitting}
          className="text-white/50 hover:text-white font-arcade text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        
        <button
          onClick={onCheckout}
          disabled={isSubmitting}
          className="cut-corner px-8 py-4 font-arcade font-bold flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-x-1 transition-all disabled:opacity-50 disabled:cursor-wait group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
          <ShieldAlert className="w-5 h-5" />
          <span>{isSubmitting ? "INITIATING UPLINK..." : "PAY $10 TO DEPLOY"}</span>
          {!isSubmitting && <Zap className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}