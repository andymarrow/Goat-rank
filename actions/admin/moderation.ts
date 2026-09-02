"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type AdminVote = {
  id: string;
  room_id: string;
  amount: number;
  voter_name: string;
  voter_avatar: string | null;
  message: string | null;
  message_hidden: boolean;
  refunded: boolean;
  upvote_count: number;
  created_at: string;
  rooms: { title: string } | null;
};

export type AdminProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  total_earned: number;
  is_admin: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  created_at: string;
};

/** Live feed of paid battle cries, newest first. */
export async function listRecentVotes(limit = 60): Promise<AdminVote[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("votes")
    .select(
      `id, room_id, amount, voter_name, voter_avatar, message, message_hidden,
       refunded, upvote_count, created_at, rooms ( title )`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listRecentVotes failed:", error);
    return [];
  }

  return (data ?? []) as unknown as AdminVote[];
}

export async function listProfiles(): Promise<AdminProfile[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select(
      `id, username, avatar_url, wallet_balance, total_earned,
       is_admin, is_banned, banned_reason, created_at`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listProfiles failed:", error);
    return [];
  }

  return (data ?? []) as AdminProfile[];
}

/**
 * Nuke an offensive battle cry.
 *
 * Hides the words, keeps the money. The row is never deleted and `amount` is
 * never touched, so the pool, the creator's 10% and the charity accrual are
 * all exactly as they were — the voter paid, and that stays true.
 */
export async function nukeMessage(voteId: string, hidden = true): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();

    const { data: vote, error: readError } = await createAdminClient()
      .from("votes")
      .select("room_id")
      .eq("id", voteId)
      .single();

    if (readError) throw readError;

    const { error } = await createAdminClient()
      .from("votes")
      .update({
        message_hidden: hidden,
        hidden_at: hidden ? new Date().toISOString() : null,
        hidden_by: hidden ? admin.id : null,
      })
      .eq("id", voteId);

    if (error) throw error;

    revalidatePath("/admin");
    if (vote?.room_id) revalidatePath(`/battle/${vote.room_id}`);
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not moderate that message.");
  }
}

/**
 * Send a user to jail: they can no longer deploy arenas or withdraw funds.
 * Their existing votes and pool contributions are left alone.
 */
export async function setUserBanned(
  profileId: string,
  banned: boolean,
  reason?: string
): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();

    if (profileId === admin.id) {
      return { ok: false, error: "You cannot ban yourself." };
    }

    const supabase = createAdminClient();

    const { data: target, error: readError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", profileId)
      .single();

    if (readError) throw readError;
    if (target?.is_admin) {
      return { ok: false, error: "Revoke admin before banning this account." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: banned,
        banned_at: banned ? new Date().toISOString() : null,
        banned_reason: banned ? (reason?.trim().slice(0, 300) || "Terms violation") : null,
      })
      .eq("id", profileId);

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update that account.");
  }
}

/** Grant or revoke admin. Guarded so the last admin can't lock everyone out. */
export async function setUserAdmin(profileId: string, makeAdmin: boolean): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminClient();

    if (!makeAdmin) {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true);

      if ((count ?? 0) <= 1) {
        return { ok: false, error: "You are the last admin — promote someone else first." };
      }

      if (profileId === admin.id) {
        return { ok: false, error: "Have another admin revoke your access." };
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: makeAdmin })
      .eq("id", profileId);

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not change admin rights.");
  }
}
