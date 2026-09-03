const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/**
 * Subtle film grain.
 *
 * Deliberately sits BELOW the fixed navigation (nav is z-40/z-50, this is
 * z-30). An earlier version rendered at z-[100] with a vignette on top, which
 * washed a grey gradient over the mobile tab bar and made it look disabled.
 * Grain belongs behind the chrome, not over it.
 */
export default function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay dark:opacity-[0.045]"
        style={{ backgroundImage: GRAIN_SVG }}
      />
    </div>
  );
}
