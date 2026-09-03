import "server-only";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminIdentity = {
  id: string;
  username: string | null;
};

/**
 * Resolve the caller's admin identity, or null.
 *
 * Two clients on purpose:
 *  - the cookie-backed client establishes WHO is calling (never trust an id
 *    passed in from the browser),
 *  - the service-role client then reads the is_admin flag, so this works
 *    regardless of what SELECT policies exist on `profiles`.
 */
export async function getAdminUser(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await createAdminClient()
    .from("profiles")
    .select("id, username, is_admin, is_banned")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.is_admin || profile.is_banned) return null;

  return { id: profile.id, username: profile.username };
}

/**
 * Guard for every admin server action and page.
 *
 * Server Actions are public HTTP endpoints — knowing the URL is enough to call
 * one. Nothing in `actions/admin/*` may touch the service-role client before
 * awaiting this.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdminUser();

  if (!admin) {
    throw new Error("FORBIDDEN: admin privileges required.");
  }

  return admin;
}

/** Uniform failure shape for admin actions, so panels can render the message. */
export type AdminResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; error: string };

export function adminError(error: unknown, fallback: string): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : String(error);

  if (message.startsWith("FORBIDDEN")) {
    return { ok: false, error: "Not authorised." };
  }

  console.error(fallback, error);
  return { ok: false, error: fallback };
}
