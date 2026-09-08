"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { stripe, toCents, metadata } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

// Mirrors the minimum enforced by the VoteModal input. A Server Action is a
// public HTTP endpoint, so the client-side `min` attribute proves nothing.
const MIN_VOTE_USD = 3;

// Keeps a pasted essay out of the checkout payload and the DB. Also Stripe's
// own ceiling for a metadata value.
const MAX_CUSTOM_VALUE = 500;

// Lemon Squeezy held these in product variants. Stripe Checkout takes an
// inline price, so the two passes are priced here — keep them in step with the
// copy in CreateClient and AddContenderModal.
const CREATOR_PASS_USD = 10;
const CONTENDER_PASS_USD = 5;

/**
 * Checkout runs on our own domain, so we can rebuild the absolute redirect URL
 * from the incoming request instead of depending on NEXT_PUBLIC_SITE_URL.
 * An explicit env var still wins when set (useful behind a proxy).
 */
async function resolveOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function createVoteCheckout(data: {
  amount: number;
  roomId: string;
  contenderId: string;
  message: string;
  voterName: string;
}): Promise<{ url?: string; error?: string }> {
  if (!Number.isFinite(data.amount) || data.amount < MIN_VOTE_USD) {
    return { error: `Minimum vote is $${MIN_VOTE_USD}.` };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing.");
    return { error: "Payment terminal is not configured." };
  }

  try {
    // Resolve the room server-side. VoteModal is shared by 1v1 battles and
    // global arenas, and the two live on different routes — hardcoding
    // /battle sent every global voter to the wrong page after paying.
    // Looked up rather than passed in, so the browser cannot mis-state it.
    const supabase = await createClient();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, room_type, status")
      .eq("id", data.roomId)
      .single();

    if (roomError || !room) {
      console.error("createVoteCheckout: room lookup failed", roomError);
      return { error: "Arena not found." };
    }

    // Never take money for a contest that has already closed.
    if (room.status !== "active") {
      return { error: "This arena is no longer accepting votes." };
    }

    // Attribute the vote to the signed-in account. The browser previously
    // invented a random alias ("Ridge"/"Willow"/...), so paid battle cries
    // carried a fake name and could not link back to anyone.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let voterId = "";
    let voterName = data.voterName?.trim() || "Anonymous";

    if (user) {
      voterId = user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      voterName = profile?.username || user.email?.split("@")[0] || voterName;
    }

    const roomPath = room.room_type === "global" ? "global" : "battle";
    const origin = await resolveOrigin();

    // Pay-what-you-want: an inline price rather than a catalogue one, so the
    // backer's chosen amount is the amount charged.
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toCents(data.amount),
            product_data: {
              name: "Arena Vote",
              description: "Backs your contender and grows the arena pool.",
            },
          },
        },
      ],
      success_url: `${origin}/${roomPath}/${data.roomId}?success=true`,
      cancel_url: `${origin}/${roomPath}/${data.roomId}?cancelled=true`,

      // Our database ids ride along so the webhook can attribute the vote
      // without ever trusting the browser for them. Copied onto the payment
      // intent as well: a refund reconciliation reads the intent, not the
      // session, and the session expires after 24 hours.
      metadata: metadata({
        type: "battle_vote",
        room_id: data.roomId,
        contender_id: data.contenderId,
        message: data.message.slice(0, MAX_CUSTOM_VALUE),
        voter_name: voterName.slice(0, MAX_CUSTOM_VALUE),
        voter_id: voterId,
      }),
      payment_intent_data: {
        metadata: metadata({
          type: "battle_vote",
          room_id: data.roomId,
          contender_id: data.contenderId,
        }),
      },
    });

    if (!session.url) return { error: "Stripe did not return a checkout URL." };

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return { error: "Failed to initialize payment terminal." };
  }
}

export async function createRoomCheckout(data: {
  title: string;
  category: string;
  roomType: string;
  contenders: any[];
}): Promise<{ url?: string; error?: string; usedCredit?: boolean; roomId?: string; creditsLeft?: number }> {
  
  // 1. Verify the user is actually logged in before creating the checkout!
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to deploy an arena." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Payment terminal is not configured." };
  }

  try {
    const supabase = createAdminClient();

    // A $10 pass grants 5 deployments. Spend one before falling back to
    // checkout, otherwise creators are charged $10 every single time —
    // exactly what the pass is supposed to prevent.
    // consume_room_credit decrements conditionally in one statement, so two
    // concurrent deploys cannot both spend the same last credit.
    const { data: creditSpent } = await supabase.rpc("consume_room_credit", {
      uid: user.id,
    });

    // 2. Use the verified user.id as the creator_id!
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        title: data.title.slice(0, 100),
        category: data.category,
        room_type: data.roomType,
        status: creditSpent ? "active" : "pending_payment",
        charity_name: "Pending Charity",
        creator_id: user.id, // <--- Securely links the 10% commission to them!
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (roomError || !room) {
      console.error("DB Room Creation Error:", roomError);
      return { error: "Failed to initialize arena in database." };
    }

    // 2. Link the contenders.
    for (let i = 0; i < data.contenders.length; i++) {
      const c = data.contenders[i];

      // Reuse an existing contender wherever possible. This block used to
      // insert unconditionally despite claiming otherwise, which is why
      // picking "Ronaldo" again minted a second Ronaldo every time.
      let entityId: string | null = c.entityId ?? null;

      if (!entityId && c.name) {
        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .ilike("name", c.name.trim())
          .eq("moderation_status", "approved")
          .limit(1)
          .maybeSingle();

        entityId = existing?.id ?? null;
      }

      if (entityId) {
        await supabase.from("room_contenders").insert({
          room_id: room.id,
          entity_id: entityId,
          seed_index: i,
        });
        continue;
      }

      const { data: entity } = await supabase
        .from("entities")
        .insert({
          name: c.name,
          category: data.category,
          brand_color: c.color,
          image_url: c.image,
        })
        .select("id")
        .single();

      if (entity) {
        // Link Entity to Room
        await supabase.from("room_contenders").insert({
          room_id: room.id,
          entity_id: entity.id,
          seed_index: i,
        });
      }
    }

    // Credit already paid for this deployment — skip checkout entirely.
    if (creditSpent) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("room_credits")
        .eq("id", user.id)
        .single();

      revalidatePath("/dashboard");
      revalidatePath("/");

      return {
        usedCredit: true,
        roomId: room.id,
        creditsLeft: profile?.room_credits ?? 0,
        url: `/${data.roomType === "global" ? "global" : "battle"}/${room.id}?deployed=true`,
      };
    }

    // 3. Request a Stripe Checkout session
    const origin = await resolveOrigin();
    const roomPath = data.roomType === "global" ? "global" : "battle";

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toCents(CREATOR_PASS_USD),
            product_data: {
              name: "Creator Pass",
              description: `Deploys "${data.title}" and 4 more arenas. 10% of every pledge is yours.`,
            },
          },
        },
      ],
      // Land the creator in the arena they just paid for, not on the
      // dashboard. 1v1 and global rooms live on different routes.
      success_url: `${origin}/${roomPath}/${room.id}?success=true`,
      cancel_url: `${origin}/create?cancelled=true`,
      metadata: metadata({ type: "creator_pass", room_id: room.id }),
      payment_intent_data: {
        metadata: metadata({ type: "creator_pass", room_id: room.id }),
      },
    });

    if (!session.url) return { error: "Stripe did not return a checkout URL." };
    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return { error: "System failure." };
  }
}

/**
 * $5 contender injection into an existing global arena.
 *
 * The entity is created immediately with moderation_status 'pending' so it is
 * invisible on the public board, and only linked into the room by the webhook
 * once the payment actually clears. That ordering means an abandoned checkout
 * leaves an unreviewed entity behind, never a free contender on the board.
 */
export async function createContenderCheckout(data: {
  roomId: string;
  name: string;
  color: string;
  imageUrl?: string;
}): Promise<{ url?: string; error?: string }> {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "You must be logged in to add a contender." };

  const name = data.name?.trim();
  if (!name) return { error: "Contender name is required." };

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Payment terminal is not configured." };
  }

  try {
    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, title, category, status, room_type")
      .eq("id", data.roomId)
      .single();

    if (roomError || !room) return { error: "Arena not found." };
    if (room.status !== "active") return { error: "This arena is not accepting contenders." };
    if (room.room_type !== "global") return { error: "Contenders can only be added to global arenas." };

    const { data: creditSpent } = await supabase.rpc("consume_contender_credit", {
      uid: user.id,
    });

    const { data: entity, error: entityError } = await supabase
      .from("entities")
      .insert({
        name: name.slice(0, 80),
        category: room.category,
        brand_color: /^#[0-9a-fA-F]{6}$/.test(data.color) ? data.color : "#FFFFFF",
        image_url: data.imageUrl?.trim() || null,
        moderation_status: "pending",
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (entityError || !entity) {
      console.error("Contender entity insert failed:", entityError);
      return { error: "Failed to stage the contender." };
    }

    // Prepaid injection — link it in now and skip checkout.
    if (creditSpent) {
      const { count } = await supabase
        .from("room_contenders")
        .select("id", { count: "exact", head: true })
        .eq("room_id", data.roomId);

      const { error: linkError } = await supabase.from("room_contenders").insert({
        room_id: data.roomId,
        entity_id: entity.id,
        seed_index: count ?? 0,
      });

      if (linkError) {
        console.error("Prepaid contender link failed:", linkError);
        return { error: "Could not add the contender." };
      }

      revalidatePath(`/global/${data.roomId}`);
      return { url: `/global/${data.roomId}?added=true` };
    }

    const origin = await resolveOrigin();

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toCents(CONTENDER_PASS_USD),
            product_data: {
              name: "Add Contender",
              description: `Adds ${name} to "${room.title}", plus 4 more injections.`,
            },
          },
        },
      ],
      success_url: `${origin}/global/${data.roomId}?success=true`,
      cancel_url: `${origin}/global/${data.roomId}?cancelled=true`,
      metadata: metadata({
        type: "contender_add",
        room_id: data.roomId,
        entity_id: entity.id,
        buyer_id: user.id,
      }),
      payment_intent_data: {
        metadata: metadata({
          type: "contender_add",
          room_id: data.roomId,
          entity_id: entity.id,
        }),
      },
    });

    if (!session.url) return { error: "Stripe did not return a checkout URL." };
    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return { error: "System failure." };
  }
}
