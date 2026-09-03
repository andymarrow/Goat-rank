/**
 * Brand-colour contrast helpers.
 *
 * Contender colours are author-chosen and stored per-entity, and several were
 * picked against the pitch-black dark theme — Ronaldo's #F9F8F3 is effectively
 * white. Painted as text on the light theme's warm paper it disappears.
 *
 * These clamp a brand colour into a readable range for the active theme while
 * keeping its hue, so a contender still reads as "the white one" or "the blue
 * one" in both themes.
 */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;

  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");

  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const toHex = ({ r, g, b }: Rgb) =>
  "#" + [r, g, b].map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0")).join("");

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;

  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function mix(hex: string, target: Rgb, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return toHex({
    r: rgb.r + (target.r - rgb.r) * amount,
    g: rgb.g + (target.g - rgb.g) * amount,
    b: rgb.b + (target.b - rgb.b) * amount,
  });
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/**
 * Return a version of `hex` that stays legible as text on the current theme's
 * background. Colours already in a comfortable range are returned untouched.
 *
 * @param isDark whether the dark theme is active
 */
export function readableBrand(hex: string | null | undefined, isDark: boolean): string {
  const fallback = isDark ? "#FAFAFA" : "#111111";
  if (!hex || !hexToRgb(hex)) return fallback;

  const l = luminance(hex);

  if (isDark) {
    // Very dark brand colours vanish on #030303 — lift them toward white.
    if (l < 0.06) return mix(hex, WHITE, 0.55);
    return hex;
  }

  // Light theme: anything near-white is unreadable on #F4F3ED. Darken hard
  // enough to clear body-text contrast, more so the lighter it started.
  if (l > 0.7) return mix(hex, BLACK, 0.62);
  if (l > 0.45) return mix(hex, BLACK, 0.34);
  return hex;
}

/**
 * Pick black or white for text sitting ON a brand-coloured fill.
 * Uses the 0.45 luminance crossover, which tracks perceived brightness better
 * than a midpoint on the raw channel values.
 */
export function onBrand(hex: string | null | undefined): string {
  if (!hex) return "#000000";
  return luminance(hex) > 0.45 ? "#000000" : "#FFFFFF";
}
