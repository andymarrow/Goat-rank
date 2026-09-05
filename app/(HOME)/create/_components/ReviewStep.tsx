"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ShieldAlert, CheckCircle2, Zap, Users, ImageOff } from "lucide-react";
import { readableBrand, onBrand } from "@/lib/color";
import { useIsDark } from "@/lib/useIsDark";

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
  
  const isDark = useIsDark();
  const [accepted, setAccepted] = useState(false);
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
              <div className="flex items-stretch justify-between gap-3 relative">
                {[0, 1].map((i) => (
                  <div key={i} className={`flex flex-col w-[42%] ${i === 1 ? "items-end" : "items-start"}`}>
                    {/* Portrait preview — this is the image that will front the arena */}
                    <div
                      className="relative w-full aspect-[3/4] bg-background border border-border cut-corner overflow-hidden mb-2"
                      style={{ borderColor: `${contenders[i].color}55` }}
                    >
                      {contenders[i].image ? (
                        <Image
                          src={contenders[i].image}
                          alt={contenders[i].name || `Contender ${i + 1}`}
                          fill
                          sizes="(max-width: 768px) 40vw, 180px"
                          className="object-contain object-bottom"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-foreground/25">
                          <ImageOff className="w-5 h-5" />
                          <span className="font-arcade text-[9px] uppercase tracking-widest">No image</span>
                        </div>
                      )}
                      <span
                        className="absolute bottom-0 inset-x-0 h-1.5"
                        style={{ backgroundColor: contenders[i].color }}
                      />
                    </div>

                    <span
                      className={`font-arcade text-sm font-bold truncate w-full ${i === 1 ? "text-right" : ""}`}
                      style={{ color: readableBrand(contenders[i].color, isDark) }}
                    >
                      {contenders[i].name || "Unnamed"}
                    </span>
                  </div>
                ))}

                <span className="absolute top-1/3 left-1/2 -translate-x-1/2 font-arcade text-foreground/30 italic text-xl select-none">
                  VS
                </span>
              </div>
            ) : (
              /* Global Preview */
              <div className="flex flex-col gap-2">
                {contenders.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-background border border-border cut-corner p-2 px-3"
                    style={{ borderLeftColor: c.color, borderLeftWidth: "3px" }}
                  >
                    <div className="relative w-9 h-9 shrink-0 bg-card border border-border cut-corner overflow-hidden">
                      {c.image ? (
                        <Image
                          src={c.image}
                          alt={c.name || `Contender ${i + 1}`}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <span
                          className="w-full h-full flex items-center justify-center font-arcade text-[11px] font-bold"
                          style={{ backgroundColor: c.color, color: onBrand(c.color) }}
                        >
                          {(c.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="font-arcade text-sm text-foreground truncate flex-1">
                      {c.name || "Unnamed"}
                    </span>
                    <span className="font-arcade text-[10px] text-foreground/30 shrink-0">
                      SEED #{i + 1}
                    </span>
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

      {/* Consent. Real links, and the button stays disabled until it is ticked —
          people are about to pay, and votes in their arena are non-refundable. */}
      <label className="mt-auto flex items-start gap-3 pt-4 cursor-pointer group/terms">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--primary)] cursor-pointer"
        />
        <span className="text-xs text-foreground/60 font-sans leading-relaxed">
          I have read and accept the{" "}
          <Link
            href="/legal/terms"
            target="_blank"
            className="text-primary underline underline-offset-2 hover:brightness-125"
          >
            Terms
          </Link>
          ,{" "}
          <Link
            href="/legal/privacy"
            target="_blank"
            className="text-primary underline underline-offset-2 hover:brightness-125"
          >
            Privacy policy
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/money"
            target="_blank"
            className="text-primary underline underline-offset-2 hover:brightness-125"
          >
            where the money goes
          </Link>
          . I understand votes placed in my arena are non-refundable and that 30% of the pool goes
          to charity.
        </span>
      </label>

      {/* --- NAVIGATION & CHECKOUT --- */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <button onClick={onPrev} disabled={isSubmitting} className="text-foreground/50 hover:text-foreground font-arcade text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <button onClick={onCheckout} disabled={isSubmitting || !accepted} title={!accepted ? "Accept the terms to continue" : undefined} className="pressable cut-corner px-8 py-4 font-arcade font-bold flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-x-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 group relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
          <ShieldAlert className="w-5 h-5" />
          <span>{isSubmitting ? "INITIATING UPLINK..." : "PAY $10 TO DEPLOY"}</span>
          {!isSubmitting && <Zap className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}