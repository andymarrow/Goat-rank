"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * The app's client provider boundary. MotionConfig lives here because this is
 * the only client component wrapping every route: reducedMotion="user" makes
 * every framer-motion animation in the app honour the OS setting without
 * having to thread useReducedMotion through each one.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
