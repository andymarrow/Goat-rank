"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type AdminAvatar = {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export async function listAdminAvatars(): Promise<AdminAvatar[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("avatars")
    .select("id, name, image_url, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listAdminAvatars failed:", error);
    return [];
  }

  return (data ?? []) as AdminAvatar[];
}

/**
 * Register an uploaded image in the avatar library.
 *
 * The file itself is uploaded straight to Storage from the browser; this only
 * records the resulting public URL so new signups can be assigned it.
 */
export async function addAvatar(input: {
  name: string;
  imageUrl: string;
}): Promise<AdminResult> {
  try {
    await requireAdmin();

    const name = input.name?.trim();
    const url = input.imageUrl?.trim();

    if (!name || !url) return { ok: false, error: "Name and image are both required." };

    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      return { ok: false, error: "That image URL is not valid." };
    }

    const allowed =
      host.endsWith(".supabase.co") ||
      host === "api.dicebear.com" ||
      host === "images.unsplash.com";

    if (!allowed) {
      return { ok: false, error: `Host "${host}" is not in next.config.ts remotePatterns.` };
    }

    const supabase = createAdminClient();

    const { data: last } = await supabase
      .from("avatars")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("avatars").insert({
      name: name.slice(0, 60),
      image_url: url,
      sort_order: (last?.sort_order ?? 0) + 10,
    });

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not add the avatar.");
  }
}

export async function setAvatarActive(id: string, active: boolean): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient()
      .from("avatars")
      .update({ is_active: active })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the avatar.");
  }
}

/**
 * Remove an avatar from the library.
 *
 * Profiles already using it keep their avatar_url — the image stays in
 * Storage, so nobody's picture breaks because you tidied the picker.
 */
export async function deleteAvatar(id: string): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient().from("avatars").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the avatar.");
  }
}

/** Give every profile without a library avatar a random one. */
export async function reassignAvatars(): Promise<AdminResult<{ updated: number }>> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: avatars } = await supabase
      .from("avatars")
      .select("image_url")
      .eq("is_active", true);

    if (!avatars?.length) return { ok: false, error: "The library is empty." };

    const urls = avatars.map((a) => a.image_url);
    const libraryUrls = new Set(urls);

    const { data: profiles } = await supabase.from("profiles").select("id, avatar_url");

    // Only touch profiles still on a generated fallback, never someone's
    // own uploaded picture or a library avatar they deliberately chose.
    const targets = (profiles ?? []).filter(
      (p) => !p.avatar_url || !libraryUrls.has(p.avatar_url)
    );

    let updated = 0;
    for (const profile of targets) {
      const pick = urls[Math.floor(Math.random() * urls.length)];
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: pick })
        .eq("id", profile.id);

      if (!error) updated += 1;
    }

    revalidatePath("/admin");
    return { ok: true, data: { updated } };
  } catch (error) {
    return adminError(error, "Could not reassign avatars.");
  }
}
