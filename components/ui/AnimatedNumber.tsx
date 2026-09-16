"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts to its new value instead of jumping.
 *
 * When a pledge lands while you are watching, a pool that snaps from $236 to
 * $286 reads as a re-render; one that runs up to it reads as money arriving.
 * That is the whole signal, and it is the cheapest "this is alive" cue there
 * is.
 *
 * Holds still under prefers-reduced-motion, and never animates the first
 * paint: a page that counts up from zero on load is a page that looks like it
 * is still loading.
 */
export default function AnimatedNumber({
  value,
  duration = 700,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
  className = "",
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = from.current;
    const delta = value - start;

    if (delta === 0) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Still a frame callback rather than a synchronous set: the value has
      // to land, but not by re-rendering from inside the effect body.
      from.current = value;
      frame.current = requestAnimationFrame(() => setShown(value));
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }

    const began = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - began) / duration);
      // Ease out: fast arrival, gentle settle, which reads as a tally landing.
      const eased = 1 - Math.pow(1 - t, 3);

      setShown(start + delta * eased);

      if (t < 1) frame.current = requestAnimationFrame(step);
      else from.current = value;
    };

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      from.current = value;
    };
  }, [value, duration]);

  return <span className={`tabular-nums ${className}`}>{format(shown)}</span>;
}
