/**
 * Hosts next/image is allowed to render.
 *
 * Must stay in step with `images.remotePatterns` in next.config.ts. It drifted
 * once already: uploads land on Supabase Storage, but the entity validator
 * only listed Unsplash and DiceBear, so every uploaded contender image was
 * rejected with a confusing "not in remotePatterns" error.
 */
export function isAllowedImageHost(url: string): { ok: true } | { ok: false; error: string } {
  let host: string;

  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, error: "That image URL is not valid." };
  }

  const allowed =
    host === "images.unsplash.com" ||
    host === "api.dicebear.com" ||
    host.endsWith(".supabase.co");

  if (!allowed) {
    return {
      ok: false,
      error: `Images can't be loaded from "${host}". Upload the file instead, or use an Unsplash link.`,
    };
  }

  return { ok: true };
}
