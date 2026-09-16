import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, ogFonts, ogImage, money, initial,
} from "@/lib/og";
import { getPledgeByPaymentId } from "@/actions/getPledge";

export const alt = "A pledge on GOAT Rank";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The card a backer shares.
 *
 * Built around the person, not the platform: their name, their money, their
 * words, and the contender they put it behind. A card that led with a logo
 * would be an advert; this one is a statement someone wants to post, which is
 * the only kind that travels.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pledge, fonts] = await Promise.all([getPledgeByPaymentId(id), ogFonts()]);

  const colour = pledge?.contender.color ?? "#FF7A00";
  const art = await ogImage(pledge?.contender.image ?? null, 320);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0A0A0A",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Their contender's colour washes the whole card. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `radial-gradient(900px 600px at 78% 50%, ${colour}40 0%, #0A0A0A 72%)`,
          }}
        />

        {/* Left: the statement */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            padding: "56px 0 56px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#FF7A00" }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", letterSpacing: 1 }}>
              GOAT RANK
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 26, color: "#B4B4BD" }}>
              {pledge?.voterName ?? "Someone"} put
            </span>

            <span style={{ fontSize: 96, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
              {money(pledge?.amount ?? 0)}
            </span>

            <span style={{ fontSize: 26, color: "#B4B4BD" }}>behind</span>

            <span
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: colour,
                lineHeight: 1.1,
                maxWidth: 560,
              }}
            >
              {(pledge?.contender.name ?? "their pick").slice(0, 34)}
            </span>
          </div>

          {pledge?.message && (
            <div
              style={{
                display: "flex",
                maxWidth: 560,
                padding: "14px 18px",
                borderRadius: 18,
                border: "2px solid #26262B",
                background: "#121216",
                fontSize: 24,
                color: "#E6E6EA",
                lineHeight: 1.35,
              }}
            >
              {`"${pledge.message.slice(0, 90)}"`}
            </div>
          )}

          <span style={{ fontSize: 22, color: "#8A8A93", maxWidth: 560 }}>
            {pledge?.arena.title
              ? `${pledge.arena.title.slice(0, 54)} · 30% goes to charity`
              : "Back your pick. 30% goes to charity."}
          </span>
        </div>

        {/* Right: who they backed */}
        <div
          style={{
            width: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            padding: 40,
          }}
        >
          {art ? (
            <img
              src={art}
              width={300}
              height={300}
              style={{
                width: 300,
                height: 300,
                borderRadius: 40,
                objectFit: "cover",
                border: `6px solid ${colour}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colour,
                color: "#0A0A0A",
                fontSize: 150,
                fontWeight: 800,
              }}
            >
              {initial(pledge?.contender.name ?? "?")}
            </div>
          )}

          {pledge?.standing.leading ? (
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: colour,
                color: "#0A0A0A",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              NOW LEADING
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                border: `2px solid ${colour}`,
                color: colour,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {pledge ? `${pledge.standing.share}% OF THE POOL` : "JOIN THE ARGUMENT"}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
