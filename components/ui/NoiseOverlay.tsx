const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/**
 * Global film-grain treatment. Renders above everything (modals included)
 * so the grain reads as one continuous layer over the whole app rather
 * than stopping at the edge of a dialog. Every layer is pointer-events-none,
 * so nothing here can intercept a click.
 */
export default function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      {/* Grain. Oversized by 2% on each edge so the drift animation never
          pulls a bare edge into the viewport. */}
      <div
        className="absolute -inset-[2%] opacity-[0.035] mix-blend-overlay dark:opacity-[0.055]"
        style={{
          backgroundImage: GRAIN_SVG,
          animation: "grain-drift 8s steps(4, end) infinite",
        }}
      />

      {/* Static second grain pass at a larger scale, so the texture doesn't
          resolve into a visible repeating tile on wide displays. */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.03]"
        style={{ backgroundImage: GRAIN_SVG, backgroundSize: "800px 800px" }}
      />

      {/* Edge falloff. Pulls attention to the centre of the arena. */}
      <div className="tex-vignette absolute inset-0" />
    </div>
  );
}
