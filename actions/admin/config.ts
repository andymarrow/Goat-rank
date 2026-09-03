"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type Category = {
  id: string;
  slug: string;
  label: string;
  accent: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Charity = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  payout_reference: string | null;
  description: string | null;
  is_active: boolean;
};

export type SiteBanner = {
  id: string;
  message: string;
  href: string | null;
  variant: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

// ---------------------------------------------------------------- categories

export async function listCategories(): Promise<Category[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("categories")
    .select("id, slug, label, accent, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listCategories failed:", error);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function upsertCategory(input: {
  id?: string;
  label: string;
  accent?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<AdminResult> {
  try {
    await requireAdmin();

    const label = input.label?.trim();
    if (!label) return { ok: false, error: "Label is required." };

    const row = {
      label: label.slice(0, 60),
      slug: slugify(label),
      accent: /^#[0-9a-fA-F]{6}$/.test(input.accent ?? "") ? input.accent : "#FF7A00",
      sort_order: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 100,
      is_active: input.isActive ?? true,
    };

    const supabase = createAdminClient();
    const { error } = input.id
      ? await supabase.from("categories").update(row).eq("id", input.id)
      : await supabase.from("categories").insert(row);

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: `"${label}" already exists.` };
      }
      throw error;
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not save the category.");
  }
}

export async function deleteCategory(id: string): Promise<AdminResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("categories").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the category.");
  }
}

// ----------------------------------------------------------------- charities

export async function listCharities(): Promise<Charity[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("charities")
    .select("id, name, logo_url, website_url, payout_reference, description, is_active")
    .order("name", { ascending: true });

  if (error) {
    console.error("listCharities failed:", error);
    return [];
  }
  return (data ?? []) as Charity[];
}

export async function upsertCharity(input: {
  id?: string;
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  payoutReference?: string;
  description?: string;
  isActive?: boolean;
}): Promise<AdminResult> {
  try {
    await requireAdmin();

    const name = input.name?.trim();
    if (!name) return { ok: false, error: "Charity name is required." };

    const row = {
      name: name.slice(0, 120),
      logo_url: input.logoUrl?.trim() || null,
      website_url: input.websiteUrl?.trim() || null,
      payout_reference: input.payoutReference?.trim().slice(0, 200) || null,
      description: input.description?.trim().slice(0, 500) || null,
      is_active: input.isActive ?? true,
    };

    const supabase = createAdminClient();
    const { error } = input.id
      ? await supabase.from("charities").update(row).eq("id", input.id)
      : await supabase.from("charities").insert(row);

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: `"${name}" is already registered.` };
      }
      throw error;
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not save the charity.");
  }
}

export async function deleteCharity(id: string): Promise<AdminResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { count } = await supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("charity_id", id);

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `${count} arena(s) reference this charity. Deactivate it instead.`,
      };
    }

    const { error } = await supabase.from("charities").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not delete the charity.");
  }
}

// -------------------------------------------------------------------- banner

export async function listBanners(): Promise<SiteBanner[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("site_banners")
    .select("id, message, href, variant, is_active, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("listBanners failed:", error);
    return [];
  }
  return (data ?? []) as SiteBanner[];
}

/**
 * Push the megaphone. Only one banner is ever live: publishing deactivates
 * every other row first, so the public query can just take the newest active.
 */
export async function publishBanner(input: {
  message: string;
  href?: string;
  variant?: "info" | "alert" | "hype";
  endsAt?: string;
}): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();

    const message = input.message?.trim();
    if (!message) return { ok: false, error: "Banner message is required." };

    const supabase = createAdminClient();

    await supabase.from("site_banners").update({ is_active: false }).eq("is_active", true);

    const { error } = await supabase.from("site_banners").insert({
      message: message.slice(0, 300),
      href: input.href?.trim() || null,
      variant: input.variant ?? "info",
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: input.endsAt || null,
      created_by: admin.id,
    });

    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not publish the banner.");
  }
}

/** Pull every banner down. */
export async function clearBanners(): Promise<AdminResult> {
  try {
    await requireAdmin();

    const { error } = await createAdminClient()
      .from("site_banners")
      .update({ is_active: false })
      .eq("is_active", true);

    if (error) throw error;

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not clear the banner.");
  }
}
