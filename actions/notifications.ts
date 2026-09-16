"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type NotificationKind = "overtaken" | "settled" | "backed" | "closing" | "system";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
};

/** The signed-in reader's inbox. Empty for a signed-out visitor, by design. */
export async function listNotifications(limit = 20): Promise<Notification[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await createAdminClient()
      .from("notifications")
      .select("id, kind, title, body, href, read_at, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // The table arrives with migration 0013; an inbox that does not exist yet
    // is an empty inbox, not a broken navbar.
    if (error) return [];

    return (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind as NotificationKind,
      title: n.title,
      body: n.body,
      href: n.href,
      read: Boolean(n.read_at),
      createdAt: n.created_at,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationsRead(ids?: string[]): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false };

    let query = createAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .is("read_at", null);

    if (ids?.length) query = query.in("id", ids);

    await query;
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
