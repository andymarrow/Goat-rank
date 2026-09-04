"use client";

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { PALETTE, HEX_RE } from "@/lib/palette";

/**
 * Grouped swatch picker with a custom-hex escape hatch.
 *
 * Replaces six inline swatches repeated across three files. Grouping by hue
 * keeps thirty options scannable rather than presenting one long row.
 */
export default function ColorPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (hex: string) => void;
  /** Fewer rows, smaller swatches — for tight modals. */
  compact?: boolean;
}) {
  const [custom, setCustom] = useState(false);
  const size = compact ? "w-6 h-6" : "w-7 h-7";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {PALETTE.map((group) => (
          <div key={group.group} className="flex flex-col gap-1">
            {!compact && (
              <span className="font-arcade text-[8px] uppercase tracking-widest text-foreground/30">
                {group.group}
              </span>
            )}
            <div className="flex gap-1">
              {group.colors.map((c) => {
                const active = value?.toLowerCase() === c.hex.toLowerCase();

                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onChange(c.hex)}
                    title={`${c.name} · ${c.hex}`}
                    aria-label={c.name}
                    aria-pressed={active}
                    className={`${size} cut-corner relative transition-transform ${
                      active
                        ? "scale-110 ring-2 ring-foreground ring-offset-1 ring-offset-background"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {active && (
                      <Check
                        className="w-3 h-3 absolute inset-0 m-auto"
                        style={{ color: "#000", mixBlendMode: "difference" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCustom((v) => !v)}
          className="pressable inline-flex items-center gap-1.5 font-arcade text-[9px] uppercase
                     tracking-widest text-foreground/45 hover:text-foreground transition-colors"
        >
          <Pipette className="w-3 h-3" /> {custom ? "Hide" : "Custom"}
        </button>

        {custom && (
          <>
            <input
              type="color"
              value={HEX_RE.test(value) ? value : "#FF7A00"}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              aria-label="Custom colour"
              className="w-7 h-7 bg-background border border-border cut-corner cursor-pointer"
            />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              placeholder="#FF7A00"
              aria-label="Custom hex"
              className="w-24 bg-background border border-border cut-corner px-2 py-1
                         font-mono text-[11px] text-foreground outline-none focus:border-primary"
            />
          </>
        )}
      </div>
    </div>
  );
}
