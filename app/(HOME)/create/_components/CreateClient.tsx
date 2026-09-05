"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BriefingStep from "./BriefingStep";
import ContenderStep from "./ContenderStep";
import ReviewStep from "./ReviewStep"; // <-- ADD IMPORT
import { createRoomCheckout } from "@/actions/checkout";

export default function CreateClient({ categories }: { categories: string[] }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    roomType: "1v1", // <-- Add this! "1v1" or "global"
    category: "Soccer",
    title: "",
    contenders: [],
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // Simulated Checkout Handler
   const handleCheckout = async () => {
    setIsSubmitting(true);
    
    // Call our secure Server Action
    const res = await createRoomCheckout({
      title: formData.title,
      category: formData.category,
      roomType: formData.roomType,
      contenders: formData.contenders,
      // creatorId: "..." // We will pass the logged-in user ID here in the final Auth phase!
    });

    if (res.url) {
      window.location.href = res.url;
    } else {
      setError(res.error || "Checkout failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card border border-border cut-corner-lg shadow-2xl relative overflow-hidden min-h-0 md:min-h-[600px] flex flex-col">
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between p-6 border-b border-border z-10">
        <h2 className="font-arcade text-xl text-foreground font-bold tracking-widest">HOST BATTLE</h2>
        <div className="flex items-center gap-2 font-arcade text-xs text-foreground/50 hidden md:flex">
          <span className={step >= 1 ? "text-primary" : ""}>01. BRIEFING</span>
          <span className="opacity-30">/</span>
          <span className={step >= 2 ? "text-primary" : ""}>02. LOADOUT</span>
          <span className="opacity-30">/</span>
          <span className={step >= 3 ? "text-primary" : ""}>03. DEPLOY</span>
        </div>
        <div className="md:hidden font-arcade text-xs text-primary">STEP 0{step}/03</div>
      </div>

      <div className="flex-1 relative p-4 sm:p-6 md:p-10 z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BriefingStep onNext={nextStep} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <ContenderStep formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} categories={categories} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              {/* RENDER REVIEW STEP HERE */}
              <ReviewStep 
                formData={formData} 
                onPrev={prevStep} 
                onCheckout={handleCheckout} 
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}