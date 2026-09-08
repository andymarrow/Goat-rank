import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

/**
 * Data and chrome for the social card of an arena.
 *
 * A link to an arena used to unfurl as the site title and nothing else, which
 * on X is indistinguishable from spam. These render the actual contest —
 * who is fighting, who is winning, what the pool is — so the card carries the
 * argument that makes someone click.
 *
 * Deliberately its own lean query rather than getBattleData: the card needs
 * six columns, not the feed, the charity tally and the viewer's upvotes.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgContender = {
  name: string;
  image: string | null;
  color: string;
  amount: number;
};

export type OgArena = {
  title: string;
  category: string;
  roomType: string;
  status: string;
  totalPool: number;
  expiresAt: string;
  charity: string | null;
  contenders: OgContender[];
};

/** Anon, cookie-free: a social card is public and has no viewer. */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getOgArena(roomId: string): Promise<OgArena | null> {
  try {
    const { data, error } = await publicClient()
      .from("rooms")
      .select(
        `title, category, room_type, status, total_pool, expires_at, charity_name,
         room_contenders ( current_votes, seed_index, entities ( name, image_url, brand_color ) )`
      )
      .eq("id", roomId)
      .single();

    if (error || !data) return null;

    const contenders = (data.room_contenders ?? [])
      .map((c) => {
        const e = c.entities as unknown as {
          name?: string;
          image_url?: string | null;
          brand_color?: string | null;
        } | null;

        return {
          name: e?.name ?? "Contender",
          image: e?.image_url ?? null,
          color: e?.brand_color ?? "#FF7A00",
          amount: Number(c.current_votes) || 0,
          seed: c.seed_index,
        };
      })
      .sort((a, b) => a.seed - b.seed);

    return {
      title: data.title,
      category: data.category,
      roomType: data.room_type,
      status: data.status,
      totalPool: Number(data.total_pool) || 0,
      expiresAt: data.expires_at,
      charity: data.charity_name,
      contenders,
    };
  } catch (error) {
    console.error("getOgArena failed:", error);
    return null;
  }
}

/**
 * Inter, vendored as TTF.
 *
 * Satori cannot read woff2 and next/og's default face has one weight, so the
 * files live in the repo rather than being fetched from Google at request
 * time — a card must not depend on a third party being up.
 */
export async function ogFonts() {
  const dir = join(process.cwd(), "assets", "fonts");

  const [regular, bold] = await Promise.all([
    readFile(join(dir, "Inter-Regular.ttf")),
    readFile(join(dir, "Inter-ExtraBold.ttf")),
  ]);

  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 800 as const, style: "normal" as const },
  ];
}

export const money = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

/** "3 days left" / "Closed" — a card is stale the moment it is cached. */
export function closesIn(iso: string, status: string): string {
  if (status === "settled") return "Settled";

  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "Closing now";

  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;

  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} left`;

  return `${Math.max(1, Math.floor(ms / 60_000))} min left`;
}

/**
 * The cause to name on the card.
 *
 * Rooms carry a placeholder until a charity is chosen — "Pending Charity" for
 * a real one, "Demo Arena" for a seeded one. Neither belongs on a public
 * preview, where it reads as a broken field.
 */
export function charityLabel(name: string | null | undefined): string {
  const value = name?.trim();
  if (!value || value === "Pending Charity" || value === "Demo Arena") return "charity";
  return value;
}

/** First letter, for a contender with no artwork. */
export const initial = (name: string) => (name || "?").trim().charAt(0).toUpperCase();


/**
 * Fetch a contender's artwork as a data URI the card renderer can draw.
 *
 * Satori will not decode WebP — which is exactly what the admin reframing tool
 * uploads — and cannot resolve a site-relative path like /image/messi.png at
 * all. Either case renders as an empty box with no way to fall back, so the
 * image is resolved, normalised to PNG and inlined here instead, and a failure
 * returns null so the card draws the initial tile.
 */
export async function ogImage(url: string | null, size: number): Promise<string | null> {
  if (!url) return null;

  try {
    let input: Buffer;

    if (url.startsWith("/")) {
      // A bundled asset: read it off disk rather than guessing our own origin.
      input = await readFile(join(process.cwd(), "public", url.replace(/^\/+/, "")));
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      input = Buffer.from(await res.arrayBuffer());
    }

    const png = await sharp(input)
      .resize(size, size, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    console.error("ogImage failed for", url, error);
    return null;
  }
}
