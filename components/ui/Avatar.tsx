"use client";

import { useState } from "react";
import Image from "next/image";
import { normalizeAvatar } from "@/lib/avatar";

/**
 * Avatar that never shows a broken image.
 *
 * Remote avatars can 404 (a deleted upload, a dead generator) and next/image
 * then renders raw alt text, which looks like a bug. This falls back to a
 * coloured initial instead.
 */
export default function Avatar({
  src,
  name,
  size = 40,
  className = "",
  color,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  color?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const url = normalizeAvatar(src);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <span
      className={`relative shrink-0 overflow-hidden bg-background border border-border cut-corner block ${className}`}
      style={{ width: size, height: size }}
    >
      {url && !failed ? (
        <Image
          src={url}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized={url.endsWith(".svg")}
        />
      ) : (
        <span
          className="w-full h-full flex items-center justify-center font-arcade font-bold"
          style={{
            backgroundColor: color ?? "var(--border)",
            color: color ? "#000" : "var(--foreground)",
            fontSize: Math.max(10, Math.round(size * 0.42)),
          }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
