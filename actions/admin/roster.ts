"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type AdminEntity = {
  id: string;
  name: string;
  category: string;
  brand_color: string | null;
  image_url: string | null;
  lifetime_raised: number;
  total_battles: number;
  moderation_status: "approved" | "pending" | "rejected";
  submitted_by: string | null;
  submitted_at: string | null;
  created_at: string;
};

export async function listEntities(): Promise<AdminEntity[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("entities")
    .select(
      `id, name, category, brand_color, image_url, lifetime_raised,
       total_battles, moderation_status, submitted_by, submitted_at, created_at`
    )
    // Pending submissions first — that is the queue you actually work.
    .order("moderation_status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("listEntities failed:", error);
    return [];
  }

  return (data ?? []) as AdminEntity[];
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Fix a troll submission: replace the image, correct the name, adjust the
 * brand colour. Also the generic entity update used by the CRUD panel.
 */
export async function updateEntity(
  entityId: string,
  patch: {
    name?: string;
    category?: string;
    brand_color?: string;
    image_url?: string;
  }
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const clean: Record<string, string> = {};
    if (patch.name?.trim()) clean.name = patch.name.trim().slice(0, 80);
    if (patch.category?.trim()) clean.category = patch.category.trim().slice(0, 60);

    if (patch.brand_color?.trim()) {
      if (!HEX.test(patch.brand_color.trim())) {
        return { ok: false, error: "Brand colour must be a #RRGGBB hex value." };
      }
      clean.brand_color = patch.brand_color.trim();
    }

    if (patch.image_url?.trim()) {
      // next.config.ts only allow-lists images.unsplash.com and
      // api.dicebear.com — an off-list host renders as a broken image.
      let host: string;
      try {
        host = new URL(patch.image_url.trim()).hostname;
      } catch {
        return { ok: false, error: "Image URL is not a valid URL." };
      }

      const allowed = ["images.unsplash.com", "api.dicebear.com"];
      if (!allowed.includes(host)) {
        return {
          ok: false,
          error: `Host "${host}" is not in next.config.ts remotePatterns. Add it there first.`,
        };
      }

      clean.image_url = patch.image_url.trim();
    }

    if (Object.keys(clean).length === 0) return { ok: false, error: "Nothing to update." };

    const { error } = await createAdminClient().from("entities").update(clean).eq("id", entityId);
    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the contender.");
  }
}

/** Approve or reject a paid $5 contender injection. */
export async function setEntityModeration(
  entityId: string,
  status: "approved" | "pending" | "rejected"
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient()
      .from("entities")
      .update({ moderation_status: status })
      .eq("id", entityId);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not change the moderation status.");
  }
}

export async function createEntity(input: {
  name: string;
  category: string;
  brand_color?: string;
  image_url?: string;
}): Promise<AdminResult<{ id: string }>> {
  try {
    await requireAdmin();

    if (!input.name?.trim() || !input.category?.trim()) {
      return { ok: false, error: "Name and category are required." };
    }

    const { data, error } = await createAdminClient()
      .from("entities")
      .insert({
        name: input.name.trim().slice(0, 80),
        category: input.category.trim().slice(0, 60),
        brand_color: HEX.test(input.brand_color ?? "") ? input.brand_color : "#FFFFFF",
        image_url: input.image_url?.trim() || null,
        moderation_status: "approved",
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return adminError(error, "Could not create the contender.");
  }
}

/**
 * Delete an entity. Refuses while it is still seeded into any room — the
 * room_contenders FK would orphan a live battle.
 */
export async function deleteEntity(entityId: string): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { count, error: countError } = await supabase
      .from("room_contenders")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", entityId);

    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `Still seeded into ${count} arena(s). Reject it instead of deleting.`,
      };
    }

    const { error } = await supabase.from("entities").delete().eq("id", entityId);
    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the contender.");
  }
}
