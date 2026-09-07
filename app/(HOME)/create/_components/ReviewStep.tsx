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
    <div className="flex flex-col h-full animate-in fade-in duration-500 font-sans">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* --- LEFT: BATTLE PREVIEW --- */}
        <div>
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">DEPLOYMENT PREVIEW</h3>
          
          <div className="bg-card border border-border/80 rounded-2xl p-6 relative shadow-lg">
            <div className="absolute top-4 right-4 bg-primary/10 border border-primary/30 text-primary text-[10px] px-2.5 py-1 font-bold rounded-lg flex items-center gap-1">
              {is1v1 ? <Zap className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              <span>{is1v1 ? "1V1 FACE-OFF" : "GLOBAL ARENA"}</span>
            </div>
            
            <h2 className="text-xl font-extrabold text-foreground mb-6 uppercase tracking-tight pr-28">
              {formData.title}
            </h2>
            
            {is1v1 ? (
              /* 1V1 Preview */
              <div className="flex items-stretch justify-between gap-3 relative">
                {[0, 1].map((i) => (
                  <div key={i} className={`flex flex-col w-[42%] ${i === 1 ? "items-end" : "items-start"}`}>
                    <div
                      className="relative w-full aspect-[3/4] bg-zinc-900 border border-border/80 rounded-xl overflow-hidden mb-2 shadow-xs"
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
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <ImageOff className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">No image</span>
                        </div>
                      )}
                      <span
                        className="absolute bottom-0 inset-x-0 h-1.5"
                        style={{ backgroundColor: contenders[i].color }}
                      />
                    </div>

                    <span
                      className={`text-sm font-bold truncate w-full ${i === 1 ? "text-right" : ""}`}
                      style={{ color: readableBrand(contenders[i].color, isDark) }}
                    >
                      {contenders[i].name || "Unnamed"}
                    </span>
                  </div>
                ))}

                <span className="absolute top-1/3 left-1/2 -translate-x-1/2 text-muted-foreground font-extrabold text-lg select-none">
                  VS
                </span>
              </div>
            ) : (
              /* Global Preview */
              <div className="flex flex-col gap-2">
                {contenders.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-zinc-900/60 border border-border/60 rounded-xl p-2 px-3"
                    style={{ borderLeftColor: c.color, borderLeftWidth: "3px" }}
                  >
                    <div className="relative w-9 h-9 shrink-0 bg-zinc-900 border border-border/80 rounded-lg overflow-hidden">
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
                          className="w-full h-full flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: c.color, color: onBrand(c.color) }}
                        >
                          {(c.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-bold text-foreground truncate flex-1">
                      {c.name || "Unnamed"}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-wider">
                      SEED #{i + 1}
                    </span>
                  </div>
                ))}
                <div className="text-center text-[10px] font-bold text-primary mt-2 uppercase tracking-wider">
                  + INFINITE SLOTS OPEN
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: TERMINAL RECEIPT --- */}
        <div>
           <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">AUTHORIZATION RECEIPT</h3>
           <div className="bg-zinc-900/60 border border-border/80 p-6 rounded-2xl text-sm flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center text-foreground font-semibold border-b border-border/60 pb-4">
                <span>CREATOR PASS (3 ROOMS)</span>
                <span className="font-extrabold tabular-nums">$10.00</span>
              </div>
              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>10% CREATOR COMMISSION ENABLED</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>30% CHARITY SPLIT VERIFIED</span>
                </div>
                {!is1v1 && (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>FREE "ADD CONTENDER" ADMIN ACCESS</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">TOTAL DUE</span>
                <span className="text-3xl font-black text-primary tabular-nums">$10.00</span>
              </div>
           </div>
        </div>

      </div>

      {/* Consent Checkbox */}
      <label className="mt-auto flex items-start gap-3 pt-4 cursor-pointer group/terms">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--primary)] cursor-pointer"
        />
        <span className="text-xs text-muted-foreground font-sans leading-relaxed">
          I have read and accept the{" "}
          <Link
            href="/legal/terms"
            target="_blank"
            className="text-primary font-semibold underline underline-offset-2 hover:brightness-125"
          >
            Terms
          </Link>
          ,{" "}
          <Link
            href="/legal/privacy"
            target="_blank"
            className="text-primary font-semibold underline underline-offset-2 hover:brightness-125"
          >
            Privacy policy
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/money"
            target="_blank"
            className="text-primary font-semibold underline underline-offset-2 hover:brightness-125"
          >
            where the money goes
          </Link>
          . I understand votes placed in my arena are non-refundable and that 30% of the pool goes
          to charity.
        </span>
      </label>

      {/* --- NAVIGATION & CHECKOUT --- */}
      <div className="flex justify-between items-center pt-6 mt-4 border-t border-border/80">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>
        <button
          onClick={onCheckout}
          disabled={isSubmitting || !accepted}
          title={!accepted ? "Accept the terms to continue" : undefined}
          className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group relative overflow-hidden"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isSubmitting ? "INITIATING UPLINK..." : "PAY $10 TO DEPLOY"}</span>
          {!isSubmitting && <Zap className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}