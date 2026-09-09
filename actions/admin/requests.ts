"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";
import { upsertCharity } from "./config";
import type { RequestKind, RequestStatus } from "@/actions/requests";

export type AdminRequest = {
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
  author_id: string | null;
};

/** Every request, most-backed first. Admin-only: it carries author ids. */
export async function listAdminRequests(): Promise<AdminRequest[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("requests")
    .select(
      `id, kind, title, detail, link, status, admin_note, upvote_count, created_at,
       submitted_by, profiles ( username )`
    )
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("listAdminRequests failed:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
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
    author_id: r.submitted_by,
  }));
}

/**
 * Move a request along, with a note the requester can read.
 *
 * The note is the whole point of a status: "planned" with no word about what
 * that means is barely better than silence, and this board is public.
 */
export async function setRequestStatus(
  requestId: string,
  status: RequestStatus,
  note?: string
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const patch: Record<string, string | null> = { status };
    if (note !== undefined) patch.admin_note = note.trim().slice(0, 500) || null;

    const { error } = await createAdminClient()
      .from("requests")
      .update(patch)
      .eq("id", requestId);

    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath("/requests");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update that request.");
  }
}

/** Remove a request outright — spam, duplicates, abuse. */
export async function deleteRequest(requestId: string): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient().from("requests").delete().eq("id", requestId);
    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath("/requests");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete that request.");
  }
}

/**
 * Turn a charity nomination into a registered charity in one step.
 *
 * Retyping a name and URL that are already sitting in front of you is exactly
 * where a backlog stops being processed, so the nomination becomes the
 * registry row and the request is marked shipped with a note saying so.
 */
export async function promoteCharityRequest(
  requestId: string
): Promise<AdminResult<{ name: string }>> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: request } = await supabase
      .from("requests")
      .select("id, kind, title, detail, link")
      .eq("id", requestId)
      .maybeSingle();

    if (!request) return { ok: false, error: "Request not found." };
    if (request.kind !== "charity") {
      return { ok: false, error: "Only a charity nomination can be registered." };
    }

    const created = await upsertCharity({
      name: request.title,
      websiteUrl: request.link ?? undefined,
      description: request.detail ?? undefined,
      isActive: true,
    });

    if (!created.ok) return created;

    await supabase
      .from("requests")
      .update({
        status: "shipped",
        admin_note: `Registered as a charity — arenas can raise for ${request.title} now.`,
      })
      .eq("id", requestId);

    revalidatePath("/admin", "layout");
    revalidatePath("/requests");
    return { ok: true, data: { name: request.title } };
  } catch (error) {
    return adminError(error, "Could not register that charity.");
  }
}
