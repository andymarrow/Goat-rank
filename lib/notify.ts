import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

export type NotifyInput = {
  profileId: string;
  kind: "overtaken" | "settled" | "backed" | "closing" | "system";
  title: string;
  body?: string | null;
  href?: string | null;
  roomId?: string | null;
  /**
   * Minutes within which the same person will not be told the same kind of
   * thing about the same arena twice. A notification per pledge is how a bell
   * teaches people to ignore it.
   */
  dedupeMinutes?: number;
};

/**
 * Write one notification, server-side only.
 *
 * Never throws: a notification is a courtesy, and failing to send one must not
 * fail the webhook that was recording someone's money.
 */
export async function notify(input: NotifyInput): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    if (input.dedupeMinutes && input.roomId) {
      const since = new Date(Date.now() - input.dedupeMinutes * 60_000).toISOString();

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", input.profileId)
        .eq("room_id", input.roomId)
        .eq("kind", input.kind)
        .gte("created_at", since);

      if ((count ?? 0) > 0) return false;
    }

    const { error } = await supabase.from("notifications").insert({
      profile_id: input.profileId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      room_id: input.roomId ?? null,
    });

    if (error) {
      console.error("notify failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("notify threw:", error);
    return false;
  }
}

/** Fan out to many people at once, skipping the one who caused the event. */
export async function notifyMany(
  profileIds: string[],
  build: (profileId: string) => Omit<NotifyInput, "profileId">,
  exclude?: string | null
): Promise<number> {
  const targets = [...new Set(profileIds)].filter((id) => id && id !== exclude);

  const results = await Promise.all(
    targets.map((id) => notify({ profileId: id, ...build(id) }))
  );

  return results.filter(Boolean).length;
}
