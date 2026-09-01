"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigUp } from "lucide-react";
import { addTestimonialUpvote } from "@/actions/upvote"; // <-- IMPORT ACTION

interface UpvoteButtonProps {
  initialCount: number;
  voteId: string; // <-- We need the DB ID of the vote to update it
}

export default function UpvoteButton({ initialCount, voteId }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [clicks, setClicks] = useState<{ id: number }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpvote = useCallback(async () => {
    // 1. Optimistic UI Update (Instant feedback for the user)
    setCount((prev) => prev + 1);
    
    const newClick = { id: Date.now() + Math.random() };
    setClicks((prev) => [...prev, newClick]);

    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
    }, 1000);

    // 2. Prevent spamming the server
    if (isUpdating) return;
    setIsUpdating(true);

    // 3. Call the Server Action in the background
    const result = await addTestimonialUpvote(voteId);
    
    // If the database rejected it (e.g., they already voted), revert the optimistic update
    if (!result.success) {
      setCount((prev) => prev - 1);
    }

    setIsUpdating(false);
  }, [voteId, isUpdating]);

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