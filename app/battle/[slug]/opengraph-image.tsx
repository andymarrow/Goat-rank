import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, getOgArena, ogFonts, ogImage, money, closesIn, initial, charityLabel,
} from "@/lib/og";

export const alt = "A 1v1 arena on GOAT Rank";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [arena, fonts] = await Promise.all([getOgArena(slug), ogFonts()]);

  const left = arena?.contenders[0];
  const right = arena?.contenders[1];

  // Resolved to inline PNG up front: a URL satori cannot decode would
  // otherwise draw as an empty frame with no fallback.
  const [leftArt, rightArt] = await Promise.all([
    ogImage(left?.image ?? null, 260),
    ogImage(right?.image ?? null, 260),
  ]);

  const leftAmount = left?.amount ?? 0;
  const rightAmount = right?.amount ?? 0;
  const total = leftAmount + rightAmount;

  // A fresh arena is a genuine 50/50, not a 0/0.
  const leftPct = total > 0 ? Math.round((leftAmount / total) * 100) : 50;
  const rightPct = 100 - leftPct;

  const side = (
    c: { name: string; color: string } | undefined,
    art: string | null,
    pct: number,
    amount: number,
    winning: boolean
  ) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: "0 24px",
      }}
    >
      {art ? (
        <img
          src={art}
          width={190}
          height={190}
          style={{
            width: 190,
            height: 190,
            borderRadius: 28,
            objectFit: "cover",
            border: `4px solid ${winning ? c?.color ?? "#FF7A00" : "#26262B"}`,
          }}
        />
      ) : (
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: c?.color ?? "#FF7A00",
            color: "#0A0A0A",
            fontSize: 96,
            fontWeight: 800,
          }}
        >
          {initial(c?.name ?? "?")}
        </div>
      )}

      <div
        style={{
          fontSize: 40,
          fontWeight: 800,
          color: "#FFFFFF",
          maxWidth: 420,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {(c?.name ?? "Contender").slice(0, 22)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          color: winning ? c?.color ?? "#FF7A00" : "#8A8A93",
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 800 }}>{pct}%</span>
        <span style={{ fontSize: 26 }}>{money(amount)}</span>
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0A0A0A",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Each side washed in its contender's colour, as on the arena page. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `linear-gradient(115deg, ${left?.color ?? "#FF7A00"}2E 0%, #0A0A0A 42%, #0A0A0A 58%, ${right?.color ?? "#3B82F6"}2E 100%)`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "34px 48px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#FF7A00",
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: 1 }}>
              GOAT RANK
            </span>
            <span style={{ fontSize: 22, color: "#8A8A93" }}>
              · {(arena?.category ?? "Arena").toUpperCase()}
            </span>
          </div>

          <span style={{ fontSize: 22, color: "#8A8A93" }}>
            {arena ? closesIn(arena.expiresAt, arena.status) : "Live"}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            padding: "18px 48px 0",
            fontSize: 46,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            maxHeight: 120,
            overflow: "hidden",
          }}
        >
          {(arena?.title ?? "Settle the debate").slice(0, 72)}
        </div>

        {/* Stage */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 24px" }}>
          {side(left, leftArt, leftPct, leftAmount, leftAmount >= rightAmount)}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 110,
              height: 110,
              borderRadius: 999,
              background: "#141418",
              border: "4px solid #FF7A00",
              color: "#FF7A00",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            VS
          </div>

          {side(right, rightArt, rightPct, rightAmount, rightAmount >= leftAmount)}
        </div>

        {/* Split bar */}
        <div style={{ display: "flex", height: 12, width: "100%" }}>
          <div style={{ width: `${leftPct}%`, background: left?.color ?? "#FF7A00" }} />
          <div style={{ width: `${rightPct}%`, background: right?.color ?? "#3B82F6" }} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "26px 48px 34px",
            background: "#0A0A0A",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>
              {money(arena?.totalPool ?? 0)}
            </span>
            <span style={{ fontSize: 30, color: "#8A8A93" }}>in the pool</span>
          </div>

          <span style={{ fontSize: 24, color: "#8A8A93" }}>
            30% to {charityLabel(arena?.charity)}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
