/**
 * Feed types and tuning.
 *
 * Deliberately NOT in the "use server" action file: those may only export
 * async functions, and a stray `export const` there breaks the server
 * boundary — Next then pulls the whole server module into the client bundle.
 */

export const FEED_PAGE_SIZE = 25;

export type FeedItem = {
  id: string;
  amount: number;
  voter_name: string;
  voter_avatar: string | null;
  voter_id: string | null;
  message: string | null;
  upvote_count: number;
  created_at: string;
  backing: string | null;
  /** Whether the current viewer has already upvoted this one. */
  upvoted?: boolean;
};

export type FeedPage = {
  items: FeedItem[];
  /** created_at of the last row — pass back as `before` for the next page. */
  nextCursor: string | null;
  hasMore: boolean;
};
