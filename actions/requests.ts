"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getFingerprint } from "@/lib/fingerprint";

const UNIQUE_VIOLATION = "23505";

export type RequestKind = "feature" | "charity";
export type RequestStatus = "open" | "planned" | "shipped" | "declined";

export type PublicRequest = {
  id: string;
  kind: RequestKind;
  title: string;
  detail: string | null;
  link: string | null;
  status: RequestStatus;
  admin_note: string | null;
  upvote_count: number;
  created_at: string;
  author: string | null;
  upvoted: boolean;
};

/**
 * The public board.
 *
 * Ranked by backing, not by recency: the point of the board is to show what
 * people actually want, and a fresh idea nobody has backed should not sit
 * above one fifty people asked for.
 */
export async function listRequests(kind?: RequestKind): Promise<PublicRequest[]> {
  const supabase = await createClient();

  let query = supabase
    .from("requests")
    .select(
      "id, kind, title, detail, link, status, admin_note, upvote_count, created_at, profiles ( username )"
    )
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;

  if (error) {
    console.error("listRequests failed:", error.message);
    return [];
  }

  const rows = data ?? [];
  const mine = new Set(await myUpvotes(rows.map((r) => r.id)));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as RequestKind,
    title: r.title,
    detail: r.detail,
    link: r.link,
    status: r.status as RequestStatus,
    admin_note: r.admin_note,
    upvote_count: Number(r.upvote_count) || 0,
    created_at: r.created_at,
    author: (r.profiles as unknown as { username?: string } | null)?.username ?? null,
    upvoted: mine.has(r.id),
  }));
}

/** Which of these the caller has already backed, so the button renders right. */
async function myUpvotes(requestIds: string[]): Promise<string[]> {
  if (requestIds.length === 0) return [];

  // Never mints a cookie: this runs during render, where writing one throws.
  const fingerprint = await getFingerprint(false);
  if (!fingerprint) return [];

  const { data } = await createAdminClient()
    .from("request_upvotes")
    .select("request_id")
    .eq("user_fingerprint", fingerprint)
    .in("request_id", requestIds);

  return (data ?? []).map((r) => r.request_id);
}

export type SubmitResult = { ok: boolean; error?: string };

/**
 * Post a request.
 *
 * Anyone can post — requiring an account on a suggestion box is how a
 * suggestion box stays empty. A signed-in author is credited; an anonymous one
 * is not, and either way the row is written with the service key rather than
 * an insert policy, so there is nothing client-side to abuse.
 */
export async function submitRequest(input: {
  kind: RequestKind;
  title: string;
  detail?: string;
  link?: string;
}): Promise<SubmitResult> {
  try {
    const title = input.title?.trim();

    if (!title || title.length < 3) {
      return { ok: false, error: "Give it a title of at least three characters." };
    }
    if (title.length > 120) {
      return { ok: false, error: "Keep the title under 120 characters." };
    }
    if (input.kind !== "feature" && input.kind !== "charity") {
      return { ok: false, error: "Pick what kind of request this is." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // One post per person per minute, which is enough to stop a bored visitor
    // filling the board without getting in a real person's way.
    const fingerprint = await getFingerprint(true);
    const admin = createAdminClient();

    if (fingerprint?.startsWith("u:")) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await admin
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("submitted_by", user?.id ?? "")
        .gte("created_at", since);

      if ((count ?? 0) > 0) {
        return { ok: false, error: "One request a minute — give the last one a moment." };
      }
    }

    const { error } = await admin.from("requests").insert({
      kind: input.kind,
      title: title.slice(0, 120),
      detail: input.detail?.trim().slice(0, 1000) || null,
      link: input.link?.trim().slice(0, 300) || null,
      submitted_by: user?.id ?? null,
    });

    if (error) throw error;

    revalidatePath("/requests");
    return { ok: true };
  } catch (error) {
    console.error("submitRequest failed:", error);
    return { ok: false, error: "Could not post that request." };
  }
}

export type RequestUpvoteResult = { ok: boolean; upvoted?: boolean; error?: string };

/** Toggle the caller's backing of a request. */
export async function toggleRequestUpvote(requestId: string): Promise<RequestUpvoteResult> {
  try {
    const fingerprint = await getFingerprint(true);
    if (!fingerprint) return { ok: false, error: "Could not identify you." };

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("request_upvotes")
      .select("id")
      .eq("request_id", requestId)
      .eq("user_fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("request_upvotes").delete().eq("id", existing.id);
      if (error) throw error;

      revalidatePath("/requests");
      return { ok: true, upvoted: false };
    }

    const { error } = await supabase.from("request_upvotes").insert({
      request_id: requestId,
      user_fingerprint: fingerprint,
    });

    // The unique index is the real guarantee; a raced double-click lands here
    // and is already the state the caller wanted.
    if (error && error.code !== UNIQUE_VIOLATION) throw error;

    revalidatePath("/requests");
    return { ok: true, upvoted: true };
  } catch (error) {
    console.error("toggleRequestUpvote failed:", error);
    return { ok: false, error: "Could not record that." };
  }
}
