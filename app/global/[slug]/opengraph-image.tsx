import { ImageResponse } from "next/og";
import {
  OG_SIZE, OG_CONTENT_TYPE, getOgArena, ogFonts, ogImage, money, closesIn, initial, charityLabel,
} from "@/lib/og";

export const alt = "A global ranking arena on GOAT Rank";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [arena, fonts] = await Promise.all([getOgArena(slug), ogFonts()]);

  // A leaderboard's argument is its standing, so the card is the podium
  // rather than the whole field.
  const ranked = [...(arena?.contenders ?? [])].sort((a, b) => b.amount - a.amount);
  const podium = ranked.slice(0, 3);
  const rest = Math.max(0, ranked.length - podium.length);
  const top = podium[0]?.amount ?? 0;

  // Inlined as PNG: satori cannot decode the WebP the reframing tool uploads.
  const art = await Promise.all(podium.map((c) => ogImage(c.image, 128)));

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `radial-gradient(900px 500px at 80% 0%, ${podium[0]?.color ?? "#FF7A00"}30 0%, #0A0A0A 70%)`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "34px 52px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#FF7A00" }} />
            <span style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: 1 }}>
              GOAT RANK
            </span>
            <span style={{ fontSize: 22, color: "#8A8A93" }}>
              · {(arena?.category ?? "Global").toUpperCase()} LEADERBOARD
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
            padding: "16px 52px 22px",
            fontSize: 52,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.1,
            maxHeight: 130,
            overflow: "hidden",
          }}
        >
          {(arena?.title ?? "Settle the debate").slice(0, 64)}
        </div>

        {/* Standing */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "0 52px",
          }}
        >
          {podium.map((c, i) => {
            const width = top > 0 ? Math.max(8, Math.round((c.amount / top) * 100)) : 8;

            return (
              <div
                key={c.name + i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "16px 22px",
                  borderRadius: 20,
                  background: i === 0 ? "#17171C" : "#111116",
                  border: `2px solid ${i === 0 ? c.color : "#212127"}`,
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: i === 0 ? c.color : "#5F5F68",
                    width: 46,
                  }}
                >
                  {i + 1}
                </span>

                {art[i] ? (
                  <img
                    src={art[i]!}
                    width={64}
                    height={64}
                    style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: c.color,
                      color: "#0A0A0A",
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    {initial(c.name)}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#FFFFFF" }}>
                    {c.name.slice(0, 30)}
                  </span>
                  <div style={{ display: "flex", height: 8, width: "100%", background: "#212127", borderRadius: 999 }}>
                    <div style={{ width: `${width}%`, background: c.color, borderRadius: 999 }} />
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: i === 0 ? "#FFFFFF" : "#8A8A93",
                  }}
                >
                  {money(c.amount)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 52px 34px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>
              {money(arena?.totalPool ?? 0)}
            </span>
            <span style={{ fontSize: 30, color: "#8A8A93" }}>in the pool</span>
          </div>

          <span style={{ fontSize: 24, color: "#8A8A93" }}>
            {rest > 0 ? `+${rest} more contenders · ` : ""}
            30% to {charityLabel(arena?.charity)}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
