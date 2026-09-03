"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type AvatarOption = {
  id: string;
  name: string;
  image_url: string;
};

/** The curated avatar library, for the profile picker. */
export async function listAvatarOptions(): Promise<AvatarOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("avatars")
    .select("id, name, image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    // Table may not exist yet on an un-migrated database — degrade quietly.
    console.error("listAvatarOptions failed:", error);
    return [];
  }

  return (data ?? []) as AvatarOption[];
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

/**
 * Update the signed-in user's display name and avatar.
 *
 * Identity comes from the session, never from an id passed in, so this can
 * only ever edit the caller's own profile.
 */
export async function updateProfile(input: {
  username?: string;
  avatarUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in." };

  const patch: Record<string, string> = {};

  if (input.username !== undefined) {
    const username = input.username.trim();

    if (!USERNAME_RE.test(username)) {
      return {
        ok: false,
        error: "Use 3–24 characters: letters, numbers, dot, dash or underscore.",
      };
    }

    patch.username = username;
  }

  if (input.avatarUrl !== undefined) {
    const url = input.avatarUrl.trim();

    // next.config.ts only renders these hosts, so anything else would save
    // successfully and then show as a broken image everywhere.
    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      return { ok: false, error: "That avatar URL is not valid." };
    }

    const allowed =
      host === "api.dicebear.com" ||
      host === "images.unsplash.com" ||
      host.endsWith(".supabase.co");

    if (!allowed) return { ok: false, error: "That image host is not allowed." };

    patch.avatar_url = url;
  }

  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(patch).eq("id", user.id);

  if (error) {
    // profiles.username is unique.
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, error: "That name is already taken." };
    }
    console.error("updateProfile failed:", error);
    return { ok: false, error: "Could not save your profile." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}
