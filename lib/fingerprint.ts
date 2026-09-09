import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const COOKIE = "gr_uid";

/**
 * A stable identity for deduplicating anonymous actions.
 *
 * Signed in: the account id, so the limit follows them across devices.
 * Anonymous: a random id pinned in an httpOnly cookie. Not unforgeable —
 * clearing cookies earns another vote — but it stops the actual problem,
 * which was that every click counted as a new person.
 *
 * Shared by testimonial upvotes and request upvotes so both dedupe against the
 * same identity: someone who has upvoted a battle cry is the same person on
 * the requests board.
 */
export async function getFingerprint(allowCreate: boolean): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return `u:${user.id}`;

  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return `a:${existing}`;

  // Only a Server Action may write cookies. During render we must not mint
  // one — an anonymous visitor with no cookie simply has no upvotes yet,
  // which is the correct answer.
  if (!allowCreate) return null;

  const id = crypto.randomUUID();

  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return `a:${id}`;
}
