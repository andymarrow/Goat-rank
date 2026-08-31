"use client";

import { ArrowLeft, ShieldAlert, CheckCircle2, Zap, Users } from "lucide-react";

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
  
  const is1v1 = formData.roomType === "1v1";
  const contenders = formData.contenders;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* --- LEFT: BATTLE PREVIEW --- */}
        <div>
          <h3 className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-4">DEPLOYMENT PREVIEW</h3>
          
          <div className="bg-card border border-border cut-corner p-6 relative shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-arcade text-[10px] px-2 py-1 font-bold cut-corner flex items-center gap-1">
              {is1v1 ? <Zap className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {is1v1 ? "1V1 FACE-OFF" : "GLOBAL ARENA"}
            </div>
            
            <h2 className="text-2xl font-arcade font-bold text-foreground mb-6 uppercase pr-24">
              {formData.title}
            </h2>
            
            {is1v1 ? (
              /* 1V1 Preview */
              <div className="flex items-center justify-between relative">
                <div className="flex flex-col items-start w-[40%]">
                  <div className="w-full h-2 mb-2 cut-corner" style={{ backgroundColor: contenders[0].color }} />
                  <span className="font-arcade text-foreground text-sm truncate w-full">{contenders[0].name}</span>
                </div>
                <span className="font-arcade text-foreground/30 italic text-xl">VS</span>
                <div className="flex flex-col items-end w-[40%]">
                  <div className="w-full h-2 mb-2 cut-corner" style={{ backgroundColor: contenders[1].color }} />
                  <span className="font-arcade text-foreground text-sm truncate w-full text-right">{contenders[1].name}</span>
                </div>
              </div>
            ) : (
              /* Global Preview */
              <div className="flex flex-col gap-2">
                {contenders.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-background border border-border cut-corner p-2 px-3" style={{ borderLeftColor: c.color, borderLeftWidth: '3px' }}>
                    <span className="font-arcade text-sm text-foreground">{c.name}</span>
                    <span className="font-arcade text-[10px] text-foreground/30">SEED #{i+1}</span>
                  </div>
                ))}
                <div className="text-center font-arcade text-[10px] text-primary mt-2">
                  + INFINITE SLOTS OPEN
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: TERMINAL RECEIPT --- */}
        {/* ... (The Receipt side remains exactly the same as before, just updated colors to theme vars) ... */}
        <div>
           <h3 className="text-foreground/60 font-arcade text-[10px] tracking-widest mb-4">AUTHORIZATION RECEIPT</h3>
           <div className="bg-background border border-border p-6 font-arcade text-sm flex flex-col gap-4 cut-corner">
              <div className="flex justify-between items-center text-foreground/80 border-b border-border pb-4">
                <span>CREATOR PASS (3 ROOMS)</span>
                <span>$10.00</span>
              </div>
              <div className="flex flex-col gap-2 text-xs text-foreground/50 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-battle-green">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>10% CREATOR COMMISSION ENABLED</span>
                </div>
                <div className="flex items-center gap-2 text-battle-pink">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>30% CHARITY SPLIT VERIFIED</span>
                </div>
                {!is1v1 && (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>FREE "ADD CONTENDER" ADMIN ACCESS</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-foreground/60">TOTAL DUE</span>
                <span className="text-3xl font-bold text-primary">$10.00</span>
              </div>
           </div>
        </div>

      </div>

      {/* --- NAVIGATION & CHECKOUT --- */}
      <div className="mt-auto flex justify-between items-center pt-4 border-t border-border">
        <button onClick={onPrev} disabled={isSubmitting} className="text-foreground/50 hover:text-foreground font-arcade text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <button onClick={onCheckout} disabled={isSubmitting} className="cut-corner px-8 py-4 font-arcade font-bold flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-x-1 transition-all disabled:opacity-50 disabled:cursor-wait group relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
          <ShieldAlert className="w-5 h-5" />
          <span>{isSubmitting ? "INITIATING UPLINK..." : "PAY $10 TO DEPLOY"}</span>
          {!isSubmitting && <Zap className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}