/**
 * Human-readable time formatting.
 *
 * getBattle returns expires_at as a raw ISO string with a comment saying the
 * client would format it — the client never did, so arenas displayed
 * "2026-09-10T08:29:29.661Z" as their countdown.
 */

/** "2d 04h" / "04:12" / "ENDED" — compact enough for a HUD. */
export function formatCountdown(target: string | Date | null | undefined): string {
  if (!target) return "—";

  const ms = new Date(target).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "ENDED";

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60_000) / 1000);

  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "Closes on 10 Sep 2026, 08:29" — for tooltips and body copy. */
export function formatAbsolute(target: string | Date | null | undefined): string {
  if (!target) return "";

  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2 minutes ago" — relative past, for feeds and ledgers. */
export function formatSince(iso: string | Date | null | undefined): string {
  if (!iso) return "";

  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (Number.isNaN(mins)) return "";

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  return formatAbsolute(iso);
}
