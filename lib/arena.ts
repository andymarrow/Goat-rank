/**
 * When an arena is over.
 *
 * `status` only becomes "settled" once something settles it, but the deadline
 * passes on its own. Anything that asks "can this still take money?" has to
 * treat an expired arena as closed, or a contest that visibly says CLOSED goes
 * on accepting pledges.
 */
export function isArenaClosed(
  expiresAt: string | null | undefined,
  status: string | null | undefined
): boolean {
  if (status === "settled") return true;
  if (!expiresAt) return false;

  const ends = new Date(expiresAt).getTime();
  return Number.isFinite(ends) && ends <= Date.now();
}

export type Standing = {
  name: string;
  amount: number;
  image?: string | null;
  color?: string | null;
  entityId?: string | null;
};

/**
 * Final order, highest first.
 *
 * A tie is left in the order it arrived rather than broken arbitrarily: two
 * contenders on the same money genuinely did draw, and inventing a winner
 * would misreport the contest.
 */
export function finalStanding<T extends Standing>(contenders: T[]): T[] {
  return [...contenders].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
}

export function isDraw(contenders: Standing[]): boolean {
  const ranked = finalStanding(contenders);
  if (ranked.length < 2) return false;

  const top = Number(ranked[0].amount) || 0;
  return top > 0 && top === (Number(ranked[1].amount) || 0);
}

/** Share of the pool, as a rounded percentage. */
export function shareOf(amount: number, total: number): number {
  if (!total) return 0;
  return Math.round(((Number(amount) || 0) / total) * 100);
}
