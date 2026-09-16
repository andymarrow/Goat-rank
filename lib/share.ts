/**
 * Where a pledge gets posted, and what it says when it lands there.
 *
 * Each network wants a different shape: X takes text plus a url, Telegram
 * takes them as separate params, WhatsApp wants everything in one string.
 * Getting that wrong is how a share button posts a bare link with no context,
 * which nobody clicks.
 */
export type ShareTarget = "x" | "telegram" | "whatsapp" | "reddit" | "facebook";

export const SHARE_TARGETS: { id: ShareTarget; label: string }[] = [
  { id: "x", label: "X" },
  { id: "telegram", label: "Telegram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "reddit", label: "Reddit" },
  { id: "facebook", label: "Facebook" },
];

export function shareUrl(target: ShareTarget, text: string, url: string): string {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);

  switch (target) {
    case "x":
      return `https://x.com/intent/tweet?text=${t}&url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  }
}

/**
 * The post itself.
 *
 * Mentions the contender's own handle when there is one, because a post that
 * tags the subject reaches the subject's followers rather than only yours.
 * That single line is the difference between a share and a share that spreads.
 */
export function pledgeText(input: {
  amount: number;
  contender: string;
  xHandle?: string | null;
  message?: string | null;
  arenaTitle: string;
  leading: boolean;
  target: ShareTarget;
}): string {
  const money = `$${Math.round(input.amount).toLocaleString("en-US")}`;
  const handle =
    input.target === "x" && input.xHandle
      ? ` (@${input.xHandle.replace(/^@/, "")})`
      : "";

  const opener = input.message?.trim()
    ? `"${input.message.trim()}"`
    : input.leading
    ? `${input.contender}${handle} just took the lead.`
    : `I'm backing ${input.contender}${handle}.`;

  const stake = input.message?.trim()
    ? `I put ${money} behind ${input.contender}${handle} in ${input.arenaTitle}.`
    : `I put ${money} behind them in ${input.arenaTitle}.`;

  return `${opener}\n\n${stake} 30% of every pledge goes to charity. Settle it with me:`;
}
