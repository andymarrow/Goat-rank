import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

/**
 * Every public URL, refreshed hourly.
 *
 * Arenas and contender profiles are the pages worth ranking: they carry the
 * names people actually search. A static list of five marketing routes would
 * leave the entire catalogue undiscovered except by internal linking.
 *
 * `changeFrequency` is a hint, not a promise, but a live arena genuinely does
 * change hourly while its pool moves, and a settled one never changes again.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/profile`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/requests`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/create`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/legal/money`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    // Anon, cookie-free: a sitemap is public and has no viewer.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const [{ data: rooms }, { data: entities }] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, room_type, status, created_at, expires_at")
        .in("status", ["active", "settled"])
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("entities")
        .select("id, name")
        .eq("moderation_status", "approved")
        .order("lifetime_raised", { ascending: false })
        .limit(2000),
    ]);

    const arenaRoutes: MetadataRoute.Sitemap = (rooms ?? []).map((room) => {
      const live = room.status === "active";

      return {
        url: `${SITE_URL}/${room.room_type === "global" ? "global" : "battle"}/${room.id}`,
        lastModified: new Date(room.created_at),
        changeFrequency: live ? ("hourly" as const) : ("yearly" as const),
        priority: live ? 0.9 : 0.4,
      };
    });

    const contenderRoutes: MetadataRoute.Sitemap = (entities ?? []).map((entity) => ({
      url: `${SITE_URL}/profile/${entity.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [...staticRoutes, ...arenaRoutes, ...contenderRoutes];
  } catch (error) {
    // A sitemap that 500s is worse than a short one: crawlers back off the
    // whole file rather than retrying the missing half.
    console.error("sitemap generation failed:", error);
    return staticRoutes;
  }
}
