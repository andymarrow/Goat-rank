"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const COOKIE = "gr_uid";

/**
 * Same identity scheme as upvotes: the account when signed in, otherwise a
 * cookie id. `allowCreate` is false during render, because only a Server
 * Action may write cookies.
 */
async function fingerprint(allowCreate: boolean): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return `u:${user.id}`;

  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return `a:${existing}`;
  if (!allowCreate) return null;

  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return `a:${id}`;
}

export type CharityTally = {
  charity_id: string;
  charity_name: string;
  logo_url: string | null;
  votes: number;
};

export async function getCharityPreference(roomId: string): Promise<{
  tally: CharityTally[];
  myChoice: string | null;
  total: number;
}> {
  const supabase = createAdminClient();

  const [{ data: tally }, fp] = await Promise.all([
    supabase
      .from("room_charity_tally")
      .select("charity_id, charity_name, logo_url, votes")
      .eq("room_id", roomId)
      .order("votes", { ascending: false }),
    fingerprint(false),
  ]);

  let myChoice: string | null = null;

  if (fp) {
    const { data } = await supabase
      .from("room_charity_votes")
      .select("charity_id")
      .eq("room_id", roomId)
      .eq("fingerprint", fp)
      .maybeSingle();

    myChoice = data?.charity_id ?? null;
  }

  const rows = (tally ?? []) as CharityTally[];

  return {
    tally: rows,
    myChoice,
    total: rows.reduce((sum, r) => sum + Number(r.votes || 0), 0),
  };
}

/** Cast or change this person's charity preference for a room. */
export async function setCharityPreference(
  roomId: string,
  charityId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const fp = await fingerprint(true);
    if (!fp) return { ok: false, error: "Could not identify you." };

    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from("rooms")
      .select("status, room_type")
      .eq("id", roomId)
      .single();

    if (!room) return { ok: false, error: "Arena not found." };
    if (room.status !== "active") {
      return { ok: false, error: "This arena has closed." };
    }

    const {
      data: { user },
    } = await (await createClient()).auth.getUser();

    // Upsert on the unique (room_id, fingerprint) index — changing your mind
    // replaces your preference instead of adding a second vote.
    const { error } = await supabase
      .from("room_charity_votes")
      .upsert(
        {
          room_id: roomId,
          charity_id: charityId,
          fingerprint: fp,
          voter_id: user?.id ?? null,
        },
        { onConflict: "room_id,fingerprint" }
      );

    if (error) throw error;

    revalidatePath(`/${room.room_type === "global" ? "global" : "battle"}/${roomId}`);
    return { ok: true };
  } catch (error) {
    console.error("setCharityPreference failed:", error);
    return { ok: false, error: "Could not record your choice." };
  }
}
