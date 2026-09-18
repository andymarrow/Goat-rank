"use client";

import { tierOf, TIER_COLOUR, TIER_LABEL } from "@/lib/levels";

/**
 * A level, worn.
 *
 * Two shapes for two jobs. `ring` wraps an avatar in the tier colour with the
 * number tucked into the corner, which is what appears beside a name in a feed
 * and has to read at 24px. `chip` is the standalone badge for a profile
 * header, where there is room to say what the tier is called.
 *
 * Colour carries the tier and the number carries the detail: at small sizes
 * people read the colour, and the number is there when they look closer.
 */
export default function LevelBadge({
  level,
  variant = "chip",
  size = 40,
  className = "",
  children,
}: {
  level: number;
  variant?: "chip" | "ring" | "dot";
  /** Only for `ring`: the size of the avatar it wraps. */
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const tier = tierOf(level);
  const colour = TIER_COLOUR[tier];

  if (variant === "ring") {
    // The number scales with the avatar, down to a floor where it stops being
    // legible and the ring alone does the work.
    const badge = Math.max(14, Math.round(size * 0.38));
    const readable = size >= 32;

    return (
      <span
        className={`relative inline-flex shrink-0 ${className}`}
        title={`Level ${level} · ${TIER_LABEL[tier]}`}
      >
        <span
          className="rounded-[inherit] p-[2px]"
          style={{ background: `linear-gradient(140deg, ${colour}, ${colour}55)` }}
        >
          {children}
        </span>

        {readable && (
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full
                       font-bold tabular-nums text-black shadow-sm"
            style={{
              width: badge,
              height: badge,
              background: colour,
              fontSize: Math.max(8, Math.round(badge * 0.5)),
            }}
          >
            {level}
          </span>
        )}
      </span>
    );
  }

  if (variant === "dot") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums
                    text-black ${className}`}
        style={{ background: colour, width: 18, height: 18, fontSize: 9 }}
        title={`Level ${level} · ${TIER_LABEL[tier]}`}
      >
        {level}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono
                  text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{ borderColor: `${colour}66`, background: `${colour}1A`, color: colour }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full text-black tabular-nums"
        style={{ background: colour, width: 16, height: 16, fontSize: 9 }}
      >
        {level}
      </span>
      {TIER_LABEL[tier]}
    </span>
  );
}
