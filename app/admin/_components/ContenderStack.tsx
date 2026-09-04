"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";

type Contender = {
  current_votes?: number | string;
  seed_index?: number;
  entities: { name: string; image_url: string | null; brand_color: string | null } | null;
};

/**
 * Overlapping contender portraits for an admin row.
 *
 * A list of names tells you nothing at a glance; the artwork is how you
 * actually recognise an arena — and, in the roster queue, how you spot a
 * troll image without opening anything.
 */
export default function ContenderStack({
  contenders,
  max = 4,
  size = 32,
}: {
  contenders: Contender[];
  max?: number;
  size?: number;
}) {
  const shown = [...(contenders ?? [])]
    .filter((c) => c.entities)
    .sort(
      (a, b) =>
        Number(b.current_votes ?? 0) - Number(a.current_votes ?? 0) ||
        Number(a.seed_index ?? 0) - Number(b.seed_index ?? 0)
    );

  const visible = shown.slice(0, max);
  const overflow = shown.length - visible.length;

  if (visible.length === 0) {
    return (
      <span
        className="inline-flex items-center justify-center bg-background border border-border cut-corner text-foreground/20"
        style={{ width: size, height: size }}
      >
        <ImageOff className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center shrink-0">
      {visible.map((c, i) => (
        <span
          key={i}
          title={c.entities!.name}
          className="relative bg-background border border-border cut-corner overflow-hidden"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.3),
            zIndex: 10 - i,
          }}
        >
          {c.entities!.image_url ? (
            <Image
              src={c.entities!.image_url}
              alt={c.entities!.name}
              fill
              sizes={`${size}px`}
              className="object-cover"
            />
          ) : (
            <span
              className="w-full h-full flex items-center justify-center font-arcade font-bold text-black"
              style={{
                backgroundColor: c.entities!.brand_color ?? "#FF7A00",
                fontSize: Math.round(size * 0.4),
              }}
            >
              {c.entities!.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
      ))}

      {overflow > 0 && (
        <span
          className="relative flex items-center justify-center bg-background border border-border
                     cut-corner font-arcade text-foreground/50"
          style={{
            width: size,
            height: size,
            marginLeft: -Math.round(size * 0.3),
            fontSize: Math.round(size * 0.32),
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
