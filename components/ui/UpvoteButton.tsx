"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigUp } from "lucide-react";

interface UpvoteButtonProps {
  initialCount: number;
}

export default function UpvoteButton({ initialCount }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [clicks, setClicks] = useState<{ id: number }[]>([]);

  const handleUpvote = useCallback(() => {
    setCount((prev) => prev + 1);
    
    // Create a unique ID for the floating +1 animation
    const newClick = { id: Date.now() + Math.random() };
    setClicks((prev) => [...prev, newClick]);

    // Remove the floating number from the DOM after animation finishes (1 second)
    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
    }, 1000);
  }, []);

  return (
    <div className="relative flex items-center">
      {/* Floating "+1" Animations */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 font-arcade font-bold text-primary text-lg drop-shadow-md"
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* The Button */}
      <motion.button
        whileTap={{ scale: 0.9, y: 2 }}
        onClick={handleUpvote}
        className="flex items-center gap-2 px-3 py-1.5 cut-corner bg-background border border-border hover:border-primary hover:text-primary text-foreground/60 transition-colors group select-none"
      >
        <ArrowBigUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        <span className="font-arcade text-sm font-bold">{count}</span>
      </motion.button>
    </div>
  );
}