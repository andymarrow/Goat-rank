"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Whether the dark theme is currently painted.
 *
 * Defaults to true before mount because the app sets defaultTheme="dark" —
 * guessing dark first means the common case never flashes the wrong colour.
 */
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return true;
  return resolvedTheme !== "light";
}
