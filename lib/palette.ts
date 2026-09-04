/**
 * Contender colour palette.
 *
 * Six colours were duplicated across the create flow, the add-contender modal
 * and the admin seeder, which meant most arenas looked identical. These are
 * grouped by hue and tuned to stay legible on both the pitch-black and the
 * warm-paper theme — nothing so pale it disappears on light, nothing so dark
 * it vanishes on black.
 */

export type Swatch = { hex: string; name: string };

export const PALETTE: { group: string; colors: Swatch[] }[] = [
  {
    group: "Fire",
    colors: [
      { hex: "#FF3B30", name: "Signal" },
      { hex: "#FF5C5C", name: "Ember" },
      { hex: "#E5484D", name: "Crimson" },
      { hex: "#FF7A00", name: "Goat Orange" },
      { hex: "#FF9F0A", name: "Amber" },
      { hex: "#D6409F", name: "Magenta" },
    ],
  },
  {
    group: "Ice",
    colors: [
      { hex: "#3B82F6", name: "Cobalt" },
      { hex: "#0EA5E9", name: "Sky" },
      { hex: "#22D3EE", name: "Cyan" },
      { hex: "#2563EB", name: "Royal" },
      { hex: "#6366F1", name: "Indigo" },
      { hex: "#8B5CF6", name: "Violet" },
    ],
  },
  {
    group: "Venom",
    colors: [
      { hex: "#00E676", name: "Toxic" },
      { hex: "#10B981", name: "Emerald" },
      { hex: "#84CC16", name: "Lime" },
      { hex: "#14B8A6", name: "Teal" },
      { hex: "#A3E635", name: "Acid" },
      { hex: "#059669", name: "Pine" },
    ],
  },
  {
    group: "Gold",
    colors: [
      { hex: "#FACC15", name: "Gold" },
      { hex: "#FFD600", name: "Trophy" },
      { hex: "#EAB308", name: "Brass" },
      { hex: "#F59E0B", name: "Honey" },
      { hex: "#CA8A04", name: "Bronze" },
      { hex: "#B45309", name: "Rust" },
    ],
  },
  {
    group: "Steel",
    colors: [
      { hex: "#E5E7EB", name: "Chrome" },
      { hex: "#94A3B8", name: "Steel" },
      { hex: "#64748B", name: "Slate" },
      { hex: "#F9F8F3", name: "Bone" },
      { hex: "#A78BFA", name: "Orchid" },
      { hex: "#F472B6", name: "Rose" },
    ],
  },
];

/** Flat list, for defaults and cycling. */
export const PALETTE_FLAT: string[] = PALETTE.flatMap((g) => g.colors.map((c) => c.hex));

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Deterministic colour for a seed, so bulk-seeded arenas look varied. */
export function colorForIndex(index: number): string {
  return PALETTE_FLAT[index % PALETTE_FLAT.length];
}
