/**
 * Shared constants.
 *
 * Deliberately NOT in a "use server" file: those may only export async
 * functions, so a plain `export const` there silently strips every export
 * from the module.
 */

/** Creators must clear this balance before they can request a withdrawal. */
export const MIN_PAYOUT_USD = 25;

/** Minimum a single vote can pledge. */
export const MIN_VOTE_USD = 3;
