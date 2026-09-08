import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OG_SIZE, OG_CONTENT_TYPE, ogFonts } from "@/lib/og";

export const alt = "GOAT Rank — settle the debate";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The card for any link that is not a specific arena. */
export default async function Image() {
  const [fonts, logo] = await Promise.all([
    ogFonts(),
    readFile(join(process.cwd(), "public", "image", "logo.png")).catch(() => null),
  ]);

  const logoSrc = logo ? `data:image/png;base64,${logo.toString("base64")}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
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
            background:
              "radial-gradient(760px 460px at 50% 0%, #FF7A0033 0%, #0A0A0A 68%)",
          }}
        />

        {logoSrc && <img src={logoSrc} width={150} height={173} style={{ objectFit: "contain" }} />}

        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color: "#FFFFFF", letterSpacing: -1 }}>
          GOAT RANK
        </div>

        <div style={{ display: "flex", fontSize: 34, color: "#B4B4BD", textAlign: "center", maxWidth: 880 }}>
          Back your pick with real money. The leaderboard everyone argues about, settled in public.
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
          {[
            { label: "60% POT", color: "#FF7A00" },
            { label: "30% CHARITY", color: "#10B981" },
            { label: "10% HOST", color: "#3B82F6" },
          ].map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                border: `2px solid ${chip.color}`,
                color: chip.color,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
