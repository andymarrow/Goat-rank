/**
 * Avatar URL helpers.
 *
 * next/image refuses to optimise SVG unless dangerouslyAllowSVG is set, and
 * every generated avatar was a DiceBear ".../svg?seed=..." URL — so all of
 * them rendered as broken images showing alt text. DiceBear serves the same
 * art as PNG, which sidesteps the security trade-off entirely.
 */

const DICEBEAR = "api.dicebear.com";

/** Rewrite a DiceBear SVG endpoint to PNG. Other URLs pass through. */
export function normalizeAvatar(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== DICEBEAR) return url;

    // .../7.x/<style>/svg?seed=x  ->  .../7.x/<style>/png?seed=x
    parsed.pathname = parsed.pathname.replace(/\/svg$/, "/png");
    if (!parsed.searchParams.has("size")) parsed.searchParams.set("size", "128");

    return parsed.toString();
  } catch {
    return url;
  }
}

/** A fresh DiceBear avatar for a seed, already PNG. */
export function generatedAvatar(seed: string): string {
  return `https://${DICEBEAR}/7.x/pixel-art/png?seed=${encodeURIComponent(seed)}&size=128`;
}
