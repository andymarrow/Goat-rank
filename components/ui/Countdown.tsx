"use client";

import { useEffect, useState } from "react";
import { formatAbsolute } from "@/lib/time";

type Parts = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function split(target: string | Date | null | undefined): Parts {
  const ms = target ? new Date(target).getTime() - Date.now() : 0;
  if (!target || Number.isNaN(ms) || ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    done: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Segmented countdown.
 *
 * "6d 23h" reads like a shipping estimate. Splitting the units and always
 * showing live seconds makes a closing arena feel like it is closing, and the
 * final hour turns red so urgency is visible rather than implied.
 */
export default function Countdown({
  target,
  size = "md",
}: {
  target: string | Date | null | undefined;
  /** "auto" scales with the viewport — use it anywhere space is tight. */
  size?: "sm" | "md" | "lg" | "auto";
}) {
  const [parts, setParts] = useState<Parts>(() => split(target));

  useEffect(() => {
    setParts(split(target));
    if (!target || split(target).done) return;

    const id = setInterval(() => {
      const next = split(target);
      setParts(next);
      if (next.done) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  const scale = {
    sm: { box: "px-1.5 py-1 min-w-[30px]", num: "text-sm", lab: "text-[7px]" },
    md: { box: "px-2 py-1.5 min-w-[40px]", num: "text-lg", lab: "text-[8px]" },
    lg: { box: "px-3 py-2 min-w-[54px]", num: "text-2xl md:text-3xl", lab: "text-[9px]" },
    // Narrow phones cannot fit four md cells plus separators without
    // overflowing the viewport, so start small and grow.
    auto: {
      box: "px-1 py-0.5 min-w-[26px] sm:px-1.5 sm:py-1 sm:min-w-[32px] md:px-2 md:py-1.5 md:min-w-[40px]",
      num: "text-xs sm:text-sm md:text-lg",
      lab: "text-[6px] sm:text-[7px] md:text-[8px]",
    },
  }[size];

  if (parts.done) {
    return (
      <span className="font-arcade text-xs uppercase tracking-widest text-foreground/40">
        Closed
      </span>
    );
  }

  // Under an hour is the danger zone; under a day is a warning.
  const urgent = parts.days === 0 && parts.hours === 0;
  const soon = parts.days === 0 && !urgent;

  const tone = urgent
    ? "border-battle-red/50 bg-battle-red/10 text-battle-red"
    : soon
    ? "border-battle-yellow/50 bg-battle-yellow/10 text-battle-yellow"
    : "border-border bg-background text-foreground";

  const cells: [number, string][] = [
    ...(parts.days > 0 ? ([[parts.days, "days"]] as [number, string][]) : []),
    [parts.hours, "hrs"],
    [parts.minutes, "min"],
    [parts.seconds, "sec"],
  ];

  return (
    <span
      className={`inline-flex items-center gap-1 ${urgent ? "animate-pulse" : ""}`}
      title={`Closes ${formatAbsolute(target)}`}
      aria-label={`Closes in ${parts.days}d ${parts.hours}h ${parts.minutes}m`}
    >
      {cells.map(([value, label], i) => (
        <span key={label} className="inline-flex items-center gap-1">
          <span
            className={`cut-corner border flex flex-col items-center leading-none ${scale.box} ${tone}`}
          >
            <span className={`font-arcade font-black tabular-nums ${scale.num}`}>{pad(value)}</span>
            <span className={`font-arcade uppercase tracking-widest opacity-50 ${scale.lab}`}>
              {label}
            </span>
          </span>
          {i < cells.length - 1 && (
            <span className="font-arcade opacity-25 -mt-2">:</span>
          )}
        </span>
      ))}
    </span>
  );
}
