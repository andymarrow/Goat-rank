"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const MARGIN = 8;

/**
 * Positioned wrapper for a dropdown menu that cannot leave the screen.
 *
 * Every menu here was `absolute right-0 w-52` hung off its own trigger, which
 * is only safe while that trigger sits near the right edge. On a phone the
 * toolbars wrap and the trigger moves, so a right-aligned panel started off
 * the left side of the screen — the same bug in the home filters and in the
 * arena sort menu.
 *
 * This measures the panel once it opens and nudges it back inside with a
 * transform on the wrapper, so the child is free to animate its own. The
 * wrapper stays mounted while closed, so an AnimatePresence child keeps its
 * exit animation.
 */
export default function DropdownPanel({
  open,
  align = "right",
  className = "",
  children,
}: {
  open: boolean;
  /** Which edge the panel hangs from before clamping. */
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;

    // Writing the DOM directly rather than through state: this is a
    // measurement of the rendered box, and a re-render would re-measure the
    // already-shifted panel.
    const clamp = () => {
      el.style.transform = "";
      const box = el.getBoundingClientRect();
      if (box.width === 0) return;

      const overLeft = MARGIN - box.left;
      const overRight = box.right - (window.innerWidth - MARGIN);

      if (overLeft > 0) el.style.transform = `translateX(${overLeft}px)`;
      else if (overRight > 0) el.style.transform = `translateX(${-overRight}px)`;
    };

    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-2 z-50 ${align === "right" ? "right-0" : "left-0"} ${
        open ? "" : "pointer-events-none"
      } ${className}`}
    >
      {children}
    </div>
  );
}
