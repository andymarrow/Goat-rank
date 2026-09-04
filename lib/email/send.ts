import "server-only";

import { Resend } from "resend";
import {
  welcomeEmail,
  voteReceiptEmail,
  roomLiveEmail,
  payoutPaidEmail,
  roomSettledEmail,
  adminGrantedEmail,
} from "./template";

/**
 * Resend is constructed lazily, never at module scope. A module-scope client
 * that throws on a missing key breaks `next build` during page-data collection
 * — the exact failure the Stripe integration hit.
 */
let client: Resend | null = null;

function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Verify this domain in Resend, or delivery fails for every recipient except
 * your own account address.
 */
const FROM = process.env.RESEND_FROM ?? "GOAT Rank <noreply@goatrank.app>";

type SendResult = { ok: boolean; id?: string; error?: string };

/**
 * Email is never load-bearing here: a failed send is logged and swallowed so
 * it can't roll back a paid vote or a completed payout. Callers that genuinely
 * need to know check `ok`.
 */
async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const api = resend();

  if (!api) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return { ok: false, error: "Email is not configured." };
  }

  try {
    const { data, error } = await api.emails.send({ from: FROM, to, subject, html });

    if (error) {
      console.error(`[email] send failed for "${subject}":`, error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    console.error(`[email] threw while sending "${subject}":`, error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export async function sendWelcome(to: string, name: string) {
  const { subject, html } = welcomeEmail(name, `${siteUrl()}/`);
  return send(to, subject, html);
}

export async function sendVoteReceipt(
  to: string,
  args: {
    voterName: string;
    contender: string;
    amount: number;
    roomTitle: string;
    roomId: string;
    /** 1v1 battles and global arenas live on different routes. */
    roomType?: string;
  }
) {
  const path = args.roomType === "global" ? "global" : "battle";
  const { subject, html } = voteReceiptEmail({
    ...args,
    roomUrl: `${siteUrl()}/${path}/${args.roomId}`,
  });
  return send(to, subject, html);
}

export async function sendRoomLive(
  to: string,
  args: { title: string; roomId: string; expiresAt: string; roomType?: string }
) {
  const path = args.roomType === "global" ? "global" : "battle";
  const { subject, html } = roomLiveEmail({
    title: args.title,
    expiresAt: args.expiresAt,
    roomUrl: `${siteUrl()}/${path}/${args.roomId}`,
  });
  return send(to, subject, html);
}

export async function sendPayoutPaid(
  to: string,
  args: { name: string; amount: number; reference?: string }
) {
  const { subject, html } = payoutPaidEmail(args);
  return send(to, subject, html);
}

export async function sendRoomSettled(
  to: string,
  args: { title: string; winner: string; pool: number; charity: string; roomId: string }
) {
  const { subject, html } = roomSettledEmail({
    ...args,
    roomUrl: `${siteUrl()}/battle/${args.roomId}`,
  });
  return send(to, subject, html);
}

export async function sendAdminGranted(
  to: string,
  args: { name: string; grantedBy: string }
) {
  const { subject, html } = adminGrantedEmail({
    ...args,
    consoleUrl: `${siteUrl()}/admin`,
  });
  return send(to, subject, html);
}
