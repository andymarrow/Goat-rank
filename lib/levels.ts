/**
 * The level curve.
 *
 * Shared by the server that awards and the client that draws a progress bar,
 * so both compute the same answer from the same numbers. Pure and
 * dependency-free for exactly that reason.
 *
 * Shape: each level costs more than the last, steeply enough that level 50
 * means something and gently enough that the first few arrive quickly. A
 * newcomer should see level 2 on their first visit.
 */
export const CURVE = { base: 60, exponent: 1.5 } as const;

export const MAX_LEVEL = 100;

/** Lifetime points needed to reach a level. Level 1 is free. */
export function pointsForLevel(level: number, curve = CURVE): number {
  if (level <= 1) return 0;
  return Math.round(curve.base * Math.pow(level - 1, curve.exponent));
}

/** The level a lifetime total buys. */
export function levelFromPoints(points: number, curve = CURVE): number {
  let level = 1;

  // The curve is monotonic and short, so walking it is clearer than inverting
  // it, and cheap enough at 100 steps.
  while (level < MAX_LEVEL && points >= pointsForLevel(level + 1, curve)) {
    level += 1;
  }

  return level;
}

export type LevelProgress = {
  level: number;
  /** Points banked inside the current level. */
  into: number;
  /** Points the current level spans. */
  span: number;
  /** 0 to 1, for a bar. */
  fraction: number;
  toNext: number;
  nextLevel: number | null;
};

export function levelProgress(lifetimePoints: number, curve = CURVE): LevelProgress {
  const level = levelFromPoints(lifetimePoints, curve);

  if (level >= MAX_LEVEL) {
    return { level, into: 0, span: 0, fraction: 1, toNext: 0, nextLevel: null };
  }

  const floor = pointsForLevel(level, curve);
  const ceiling = pointsForLevel(level + 1, curve);
  const span = Math.max(1, ceiling - floor);
  const into = Math.max(0, lifetimePoints - floor);

  return {
    level,
    into,
    span,
    fraction: Math.min(1, into / span),
    toNext: Math.max(0, ceiling - lifetimePoints),
    nextLevel: level + 1,
  };
}

export type Tier = "rookie" | "regular" | "backer" | "heavy" | "legend";

/**
 * Bands, for colour.
 *
 * A number alone does not read at a glance in a feed; a ring colour does. Five
 * bands because more than that is indistinguishable at 24px.
 */
export function tierOf(level: number): Tier {
  if (level >= 50) return "legend";
  if (level >= 25) return "heavy";
  if (level >= 10) return "backer";
  if (level >= 5) return "regular";
  return "rookie";
}

export const TIER_COLOUR: Record<Tier, string> = {
  rookie: "#8A8A93",
  regular: "#22C55E",
  backer: "#3B82F6",
  heavy: "#A855F7",
  legend: "#F59E0B",
};

export const TIER_LABEL: Record<Tier, string> = {
  rookie: "Rookie",
  regular: "Regular",
  backer: "Backer",
  heavy: "Heavyweight",
  legend: "Legend",
};
