import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

/**
 * Site-wide megaphone, pushed from the admin Config panel.
 *
 * Reads through the anon client, not the service-role one: the
 * "active banner is public" RLS policy already scopes this to a live,
 * in-window banner, so anonymous visitors see it without any elevated key.
 */
export default async function SiteBanner() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_banners")
    .select("message, href, variant")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // A missing table (migration not run yet) must not take down every page.
  if (error || !data) return null;

  const tones: Record<string, string> = {
    hype: "bg-primary text-primary-foreground",
    alert: "bg-battle-red text-white",
    info: "bg-card text-foreground border-b border-border",
  };

  const body = (
    <span className="font-arcade text-[11px] font-bold uppercase tracking-widest text-center">
      {data.message}
    </span>
  );

  return (
    <div
      className={`relative z-40 w-full px-4 py-2 flex items-center justify-center ${
        tones[data.variant] ?? tones.info
      }`}
    >
      <div className="tex-scanlines absolute inset-0 pointer-events-none opacity-30" />
      {data.href ? (
        <Link href={data.href} className="relative hover:underline underline-offset-4">
          {body}
        </Link>
      ) : (
        <span className="relative">{body}</span>
      )}
    </div>
  );
}
