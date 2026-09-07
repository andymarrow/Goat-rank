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
 * Segmented Countdown Timer
 *
 * Displays days, hours, minutes, and seconds in modern, sleek glass containers
 * with tabular monospace typography and color-coded urgency states.
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
    sm: {
      box: "px-1.5 py-0.5 min-w-[28px] rounded-md",
      num: "text-xs font-bold tracking-tight",
      lab: "text-[7px] font-semibold tracking-wider",
      colon: "text-xs -mt-2",
    },
    md: {
      box: "px-2 py-1 min-w-[36px] rounded-lg",
      num: "text-sm font-bold tracking-tight",
      lab: "text-[8px] font-semibold tracking-wider",
      colon: "text-sm -mt-2.5",
    },
    lg: {
      box: "px-3 py-1.5 min-w-[48px] rounded-xl",
      num: "text-lg md:text-xl font-bold tracking-tight",
      lab: "text-[9px] font-semibold tracking-wider",
      colon: "text-base md:text-lg -mt-3",
    },
    auto: {
      box: "px-1.5 py-0.5 min-w-[28px] sm:px-2 sm:py-1 sm:min-w-[34px] md:px-2.5 md:py-1 md:min-w-[38px] rounded-lg md:rounded-xl",
      num: "text-xs sm:text-sm md:text-base font-bold tracking-tight",
      lab: "text-[7px] sm:text-[8px] font-semibold tracking-wider",
      colon: "text-xs sm:text-sm md:text-base -mt-2.5",
    },
  }[size];

  if (parts.done) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Closed
      </span>
    );
  }

  // Under an hour is the danger zone; under a day is a warning.
  const urgent = parts.days === 0 && parts.hours === 0;
  const soon = parts.days === 0 && !urgent;

  const tone = urgent
    ? "border-red-500/40 bg-red-500/10 text-red-400 shadow-xs shadow-red-500/10"
    : soon
    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
    : "border-border/70 bg-card/60 text-foreground";

  const labelTone = urgent
    ? "text-red-400/80"
    : soon
    ? "text-amber-400/80"
    : "text-muted-foreground/70";

  const cells: [number, string][] = [
    ...(parts.days > 0 ? ([[parts.days, "DAYS"]] as [number, string][]) : []),
    [parts.hours, "HRS"],
    [parts.minutes, "MIN"],
    [parts.seconds, "SEC"],
  ];

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 ${urgent ? "animate-pulse" : ""}`}
      title={`Closes ${formatAbsolute(target)}`}
      aria-label={`Closes in ${parts.days}d ${parts.hours}h ${parts.minutes}m`}
    >
      {cells.map(([value, label], i) => (
        <span key={label} className="inline-flex items-center gap-1 sm:gap-1.5">
          <span
            className={`border flex flex-col items-center justify-center leading-none transition-colors ${scale.box} ${tone}`}
          >
            <span className={`tabular-nums ${scale.num}`}>{pad(value)}</span>
            <span className={`uppercase opacity-75 ${scale.lab} ${labelTone}`}>
              {label}
            </span>
          </span>
          {i < cells.length - 1 && (
            <span className={`text-muted-foreground/40 select-none font-bold ${scale.colon}`}>:</span>
          )}
        </span>
      ))}
    </span>
  );
}

