"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "./time";

/**
 * A countdown that actually counts down.
 *
 * Renders the server-computed string first so SSR and the first client paint
 * agree, then ticks once a second. Stops scheduling once the target passes.
 */
export function useCountdown(target: string | Date | null | undefined): string {
  const [label, setLabel] = useState(() => formatCountdown(target));

  useEffect(() => {
    setLabel(formatCountdown(target));

    if (!target) return;
    if (new Date(target).getTime() - Date.now() <= 0) return;

    const id = setInterval(() => {
      const next = formatCountdown(target);
      setLabel(next);
      if (next === "ENDED") clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  return label;
}
