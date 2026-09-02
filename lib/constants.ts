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

/**
 * Homepage sort options.
 *
 * Lives here rather than in actions/getRooms.ts because the filter UI is a
 * client component: importing it from the action would drag next/headers and
 * the server Supabase client into the browser bundle.
 */
export const ROOM_SORTS = {
  hot: { label: "Hot", column: "total_pool", ascending: false },
  new: { label: "Latest", column: "created_at", ascending: false },
  closing: { label: "Ending soon", column: "expires_at", ascending: true },
  quiet: { label: "Underdogs", column: "total_pool", ascending: true },
} as const;

export type RoomSort = keyof typeof ROOM_SORTS;

export const isRoomSort = (v: string | undefined): v is RoomSort =>
  Boolean(v && v in ROOM_SORTS);
