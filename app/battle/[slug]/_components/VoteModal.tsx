"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, HeartHandshake, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { createVoteCheckout } from "@/actions/checkout";
import { readableBrand, onBrand } from "@/lib/color";
import { useIsDark } from "@/lib/useIsDark";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  battle: any;
  contenderIndex: number;
}

const VOTE_TIERS = [
  { amount: 5, label: "STRIKE" },
  { amount: 20, label: "BLAST" },
  { amount: 50, label: "NUKE" },
];

// Keep in sync with MIN_VOTE_USD in actions/checkout.ts
const MIN_VOTE = 3;

export default function VoteModal({ isOpen, onClose, battle, contenderIndex }: VoteModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = useIsDark();

  if (!isOpen) return null;

  const contender = battle.contenders[contenderIndex];
  const charityCut = (amount * 0.30).toFixed(2); // 30% goes to charity

  // The placeholder used to name Messi in every arena on the platform, which
  // reads as a bug in a room about anything else. In a head-to-head it taunts
  // the other side by name; on a leaderboard there is no single other side,
  // so it asks the question instead.
  const rival = battle.contenders?.length === 2
    ? battle.contenders[contenderIndex === 0 ? 1 : 0]
    : null;

  const cryPlaceholder = rival
    ? `"${rival.name} could never."`
    : `"Why ${contender?.name ?? "them"}? Make the case."`;

  // The custom amount input can be emptied (NaN) or typed below the floor.
  const isValidAmount = Number.isFinite(amount) && amount >= MIN_VOTE;

  const handleCheckout = async () => {
    if (!isValidAmount || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call our secure Server Action. The DB ids travel to Stripe as checkout
      // session metadata and come back on the webhook, so they never round-trip
      // through the browser.
      const res = await createVoteCheckout({
        amount,
        roomId: battle.id,
        contenderId: contender.id,
        message: message || "Settle the debate!",
        // Signed in, the action replaces this with the profile's username.
        voterName: "",
      });

      if (res.url) {
        // Hand off to Stripe's hosted checkout
        window.location.href = res.url;
        return; // Leave the button disabled while the browser navigates away
      }

      setError(res.error ?? "Checkout failed. Please try again.");
    } catch (err) {
      // A thrown Server Action would otherwise strand the button on "INITIATING..."
      console.error("Checkout Error:", err);
      setError("Could not reach the payment terminal. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-card border-2 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden z-10"
          style={{ borderColor: contender.color }}
        >

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-border/80 pb-4">
            <div className="relative w-14 h-14 bg-muted rounded-2xl border border-border/60 overflow-hidden shrink-0">
              <Image src={contender.image} alt={contender.name} fill className="object-cover object-top" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground font-arcade text-[10px] tracking-widest uppercase">BACKING CONTENDER</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-arcade font-extrabold uppercase truncate text-primary">
                {contender.name}
              </h2>
            </div>
          </div>

          {/* Voting Power (Amount) */}
          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground font-arcade text-xs tracking-widest block">SELECT FIREPOWER</label>
            <div className="grid grid-cols-3 gap-2.5">
              {VOTE_TIERS.map((tier) => {
                const selected = amount === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => setAmount(tier.amount)}
                    className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all border cursor-pointer select-none ${
                      selected 
                        ? "bg-primary text-primary-foreground font-bold shadow-md scale-[1.02] border-primary" 
                        : "bg-background/60 text-muted-foreground border-border/60 hover:bg-muted/30 hover:text-foreground"
                    }`}
                  >
                    <span className="font-sans text-lg font-extrabold">${tier.amount}</span>
                    <span className="text-[10px] font-arcade tracking-wider font-semibold">{tier.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Custom Amount */}
            <div className="mt-1 flex items-center bg-background/60 border border-border/60 rounded-2xl px-4 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="font-sans font-bold text-muted-foreground mr-2.5 text-sm">$</span>
              <input 
                type="number" 
                min="3"
                placeholder="Custom Amount (Min $3)" 
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent outline-none text-foreground font-sans font-semibold text-sm placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Battle Cry / Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground font-arcade text-xs tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>BATTLE CRY (PUBLIC)</span>
            </label>
            <textarea 
              rows={2}
              maxLength={150}
              placeholder={cryPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-background/60 border border-border/60 rounded-2xl p-3 text-foreground font-sans text-xs sm:text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/50"
            />
            <div className="text-right text-[10px] font-sans text-muted-foreground">
              {message.length}/150
            </div>
          </div>

          {/* Charity Impact Info */}
          <div className="bg-muted/30 border border-border/60 p-3 rounded-2xl flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              <strong className="text-foreground font-semibold">Impact:</strong> ${charityCut} of this vote goes directly to <strong className="text-foreground font-semibold">{battle.charity}</strong>. No refunds on battle votes.
            </p>
          </div>

          {/* Checkout Error */}
          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-sans text-red-500 font-medium"
            >
              {error}
            </p>
          )}

          {/* Checkout Button */}
          <button 
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting || !isValidAmount}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-arcade font-extrabold text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{isSubmitting ? "INITIATING..." : `AUTHORIZE $${amount || 0} STRIKE`}</span>
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}