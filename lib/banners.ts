/**
 * Curated Unsplash banners.
 *
 * Entity profiles and global arenas both used one hardcoded stadium photo, so
 * every profile on the site shared the same header. These are picked by
 * category, then deterministically by id, so a given contender always gets the
 * same banner (no flicker between renders) while the roster as a whole varies.
 *
 * All ids are on images.unsplash.com, which next.config.ts already allow-lists.
 */

const UNSPLASH = "https://images.unsplash.com";

const BY_CATEGORY: Record<string, string[]> = {
  soccer: [
    "photo-1518605368461-1ee7e1634b6e",
    "photo-1574629810360-7efbb6b0807e",
    "photo-1522778119026-d647f0596c20",
  ],
  sports: [
    "photo-1546519638-68e109498ffc",
    "photo-1518605368461-1ee7e1634b6e",
    "photo-1461896836934-ffe607ba8211",
  ],
  basketball: ["photo-1546519638-68e109498ffc", "photo-1504450758481-7338eba7524a"],
  racing: ["photo-1532938911079-1b06ac7ceec7", "photo-1552519507-da3b142c6e3d"],
  cars: ["photo-1552519507-da3b142c6e3d", "photo-1503376780353-7e6692767b70"],
  movies: ["photo-1536440136628-849c177e76a1", "photo-1489599849927-2ee91cede3ba"],
  tech: ["photo-1555066931-4365d14bab8c", "photo-1620712943543-bcc4688e7485"],
  gaming: ["photo-1511512578047-dfb367046420", "photo-1542751371-adc38448a05e"],
  music: ["photo-1470225620780-dba8ba36b745", "photo-1493225457124-a3eb161ffa5f"],
  countries: ["photo-1500530855697-b586d89ba3ee", "photo-1476514525535-07fb3b4ae5f1"],
};

// Landscapes that suit anything — used when a category has no dedicated set.
const NEUTRAL = [
  "photo-1500530855697-b586d89ba3ee",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1441974231531-c6227db76b6e",
  "photo-1506905925346-21bda4d32df4",
  "photo-1447752875215-b2761acb3c5d",
];

/** Stable non-negative hash, so the same id always maps to the same photo. */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function bannerFor(
  category: string | null | undefined,
  seed: string,
  width = 1600
): string {
  const key = (category ?? "").trim().toLowerCase();
  const pool = BY_CATEGORY[key] ?? NEUTRAL;
  const photo = pool[hash(seed) % pool.length];

  return `${UNSPLASH}/${photo}?w=${width}&q=80&auto=format&fit=crop`;
}
