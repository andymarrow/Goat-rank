"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, HeartHandshake, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { createVoteCheckout } from "@/actions/checkout";

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

  if (!isOpen) return null;

  const contender = battle.contenders[contenderIndex];
  const charityCut = (amount * 0.30).toFixed(2); // 30% goes to charity

  // The custom amount input can be emptied (NaN) or typed below the floor.
  const isValidAmount = Number.isFinite(amount) && amount >= MIN_VOTE;

  const handleCheckout = async () => {
    if (!isValidAmount || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Generate a random guest name for now (Phase 10 will link real auth)
    const randomGuest = ["Ridge", "Willow", "Thorn", "Fell"][Math.floor(Math.random() * 4)];

    try {
      // Call our secure Server Action. The DB ids travel to Lemon Squeezy as
      // checkout custom data and come back on the webhook, so they never
      // round-trip through the browser.
      const res = await createVoteCheckout({
        amount,
        roomId: battle.id,
        contenderId: contender.id,
        message: message || "Settle the debate!",
        voterName: randomGuest,
      });

      if (res.url) {
        // Hand off to Lemon Squeezy's hosted checkout
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="corner-ticks relative w-full max-w-lg bg-[#0A0A0C] border-2 cut-corner-lg p-6 shadow-2xl flex flex-col gap-6"
          style={{ borderColor: contender.color, boxShadow: `0 0 40px ${contender.color}20` }}
        >
          {/* Panel texture. Behind every control — the modal's own children
              stack above it in DOM order. */}
          <div className="tex-dots absolute inset-0 pointer-events-none" />
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="relative w-16 h-16 bg-black cut-corner border border-white/20 overflow-hidden">
              <Image src={contender.image} alt={contender.name} fill className="object-cover object-top" />
            </div>
            <div>
              <h3 className="text-white/60 font-arcade text-xs tracking-widest">BACKING CONTENDER</h3>
              <h2 className="text-2xl md:text-3xl font-arcade font-bold uppercase" style={{ color: contender.color }}>
                {contender.name}
              </h2>
            </div>
          </div>

          {/* Voting Power (Amount) */}
          <div>
            <label className="text-white/60 font-arcade text-xs tracking-widest mb-2 block">SELECT FIREPOWER</label>
            <div className="grid grid-cols-3 gap-3">
              {VOTE_TIERS.map((tier) => (
                <button
                  key={tier.amount}
                  onClick={() => setAmount(tier.amount)}
                  className={`pressable cut-corner py-3 flex flex-col items-center justify-center gap-1 transition-all border ${
                    amount === tier.amount 
                      ? "bg-white/10 text-white shadow-lg" 
                      : "bg-black text-white/50 border-white/10 hover:bg-white/5"
                  }`}
                  style={{ borderColor: amount === tier.amount ? contender.color : '' }}
                >
                  <span className="font-arcade text-xl font-bold">${tier.amount}</span>
                  <span className="text-[10px] font-arcade tracking-wider">{tier.label}</span>
                </button>
              ))}
            </div>
            
            {/* Custom Amount */}
            <div className="mt-3 flex items-center bg-black border border-white/10 cut-corner px-4 py-2 focus-within:border-white/40 transition-colors">
              <span className="font-arcade text-white/50 mr-2">$</span>
              <input 
                type="number" 
                min="3"
                placeholder="Custom Amount (Min $3)" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent outline-none text-white font-arcade placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Battle Cry / Message */}
          <div>
            <label className="text-white/60 font-arcade text-xs tracking-widest mb-2 block flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" />
              BATTLE CRY (PUBLIC)
            </label>
            <textarea 
              rows={3}
              maxLength={150}
              placeholder={`"Messi could never!"`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black border border-white/10 cut-corner p-3 text-white font-sans text-sm outline-none focus:border-white/40 transition-colors resize-none"
            />
            <div className="text-right mt-1 text-[10px] font-arcade text-white/40">
              {message.length}/150
            </div>
          </div>

          {/* Charity Impact Info */}
          <div className="bg-black/40 border border-white/5 p-3 cut-corner flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-battle-pink shrink-0 mt-0.5" />
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              <strong className="text-white">Impact:</strong> ${charityCut} of this vote goes directly to <strong className="text-white">{battle.charity}</strong>. No refunds on battle votes.
            </p>
          </div>

          {/* Checkout Error — inline, so the failure stays inside the modal
              the user is already looking at rather than in an OS alert. */}
          {error && (
            <p
              role="alert"
              className="cut-corner border border-battle-red/40 bg-battle-red/10 px-3 py-2 text-xs font-arcade text-battle-red"
            >
              {error}
            </p>
          )}

          {/* Checkout Button */}
          <button 
            onClick={handleCheckout} // <-- Trigger the real function
            disabled={isSubmitting || !isValidAmount} // <-- Disable while loading
            className="sheen pressable w-full cut-corner py-4 flex items-center justify-center gap-3 font-arcade font-bold text-lg hover:brightness-125 transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-wait"
            style={{ backgroundColor: contender.color, color: "#000" }}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>{isSubmitting ? "INITIATING..." : `AUTHORIZE $${amount} STRIKE`}</span>
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}