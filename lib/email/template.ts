import "server-only";

/**
 * Email templates for GOAT Rank.
 *
 * Everything is inlined and table-based on purpose. Email clients (Outlook in
 * particular) have no flexbox, no CSS variables, no @import and no external
 * stylesheets, so the site's design tokens are hardcoded here rather than
 * pulled from globals.css. Orbitron is loaded for clients that allow web fonts
 * and falls back to a bold system stack everywhere else.
 */

const T = {
  bg: "#030303",
  panel: "#0A0A0C",
  border: "#1F1F22",
  text: "#FAFAFA",
  muted: "#8A8A8F",
  primary: "#FF7A00",
  green: "#00E676",
  pink: "#FF6B6B",
  yellow: "#FFD600",
} as const;

const ARCADE = `'Orbitron', 'Impact', 'Arial Black', sans-serif`;
const SANS = `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

export type EmailButton = { label: string; url: string };

/** Shared shell: dark canvas, clipped-corner panel, arcade header, footer. */
function shell({
  preheader,
  eyebrow,
  heading,
  body,
  button,
  accent = T.primary,
}: {
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  button?: EmailButton;
  accent?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(heading)}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${T.bg};color:${T.text};font-family:${SANS};">
  <!-- Preheader: shown in the inbox list, hidden in the body. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${T.bg};padding:32px 16px;">
    <tr><td align="center">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-family:${ARCADE};font-size:22px;font-weight:900;letter-spacing:3px;color:${T.text};">
            GOAT<span style="color:${T.primary};">RANK</span>
          </span>
        </td></tr>

        <!-- Panel -->
        <tr><td style="background:${T.panel};border:1px solid ${T.border};border-top:3px solid ${accent};padding:36px 32px;">

          <p style="margin:0 0 10px;font-family:${ARCADE};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${T.muted};">
            ${escapeHtml(eyebrow)}
          </p>

          <h1 style="margin:0 0 18px;font-family:${ARCADE};font-size:26px;line-height:1.2;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${T.text};">
            ${escapeHtml(heading)}
          </h1>

          <div style="font-size:15px;line-height:1.65;color:#C9C9CE;">
            ${body}
          </div>

          ${
            button
              ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px;">
                   <tr><td style="background:${accent};">
                     <a href="${escapeAttr(button.url)}"
                        style="display:inline-block;padding:14px 30px;font-family:${ARCADE};font-size:12px;
                               font-weight:700;letter-spacing:2px;text-transform:uppercase;
                               color:#000000;text-decoration:none;">
                       ${escapeHtml(button.label)}
                     </a>
                   </td></tr>
                 </table>`
              : ""
          }
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:22px;">
          <p style="margin:0 0 6px;font-size:12px;color:${T.muted};">
            Settle the debate. Back your GOAT.
          </p>
          <p style="margin:0;font-size:11px;color:#5A5A60;">
            You received this because you have a GOAT Rank account.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const escapeAttr = escapeHtml;

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

const stat = (label: string, value: string, color: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background:${T.bg};border:1px solid ${T.border};">
     <tr><td style="padding:16px 18px;">
       <p style="margin:0 0 4px;font-family:${ARCADE};font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${T.muted};">${escapeHtml(label)}</p>
       <p style="margin:0;font-family:${ARCADE};font-size:24px;font-weight:900;color:${color};">${escapeHtml(value)}</p>
     </td></tr>
   </table>`;

// ---------------------------------------------------------------- templates

export function welcomeEmail(name: string, ctaUrl: string) {
  return {
    subject: "Welcome to the arena",
    html: shell({
      preheader: "Your GOAT Rank account is live. Pick a side.",
      eyebrow: "Account activated",
      heading: `Welcome, ${name}`,
      body: `<p style="margin:0 0 14px;">You're in. GOAT Rank is where debates get settled with real money on the line — back a contender, and the pool decides who's right.</p>
             <p style="margin:0;">Every vote you place carries a public battle cry. Make it count.</p>`,
      button: { label: "Enter the arena", url: ctaUrl },
    }),
  };
}

export function voteReceiptEmail(args: {
  voterName: string;
  contender: string;
  amount: number;
  roomTitle: string;
  roomUrl: string;
}) {
  return {
    subject: `Your ${money(args.amount)} vote for ${args.contender} is in`,
    html: shell({
      preheader: `${money(args.amount)} backed ${args.contender} in ${args.roomTitle}.`,
      eyebrow: "Vote confirmed",
      heading: `You backed ${args.contender}`,
      accent: T.green,
      body: `<p style="margin:0 0 4px;">Your vote landed in <strong style="color:${T.text};">${escapeHtml(
        args.roomTitle
      )}</strong> and the pool has already moved.</p>
             ${stat("Amount pledged", money(args.amount), T.green)}
             <p style="margin:0;">Watch the bar swing live — and bring reinforcements.</p>`,
      button: { label: "View the battle", url: args.roomUrl },
    }),
  };
}

export function roomLiveEmail(args: { title: string; roomUrl: string; expiresAt: string }) {
  return {
    subject: `"${args.title}" is live`,
    html: shell({
      preheader: `Your arena is deployed and taking votes.`,
      eyebrow: "Arena deployed",
      heading: `${args.title} is live`,
      body: `<p style="margin:0 0 14px;">Your arena is open and taking votes. You earn <strong style="color:${T.green};">10% of every vote</strong> placed in it, credited to your wallet the moment it lands.</p>
             <p style="margin:0;">Closes ${escapeHtml(
               new Date(args.expiresAt).toUTCString()
             )}. Share it — a quiet arena pays nothing.</p>`,
      button: { label: "Open your arena", url: args.roomUrl },
    }),
  };
}

export function payoutPaidEmail(args: { name: string; amount: number; reference?: string }) {
  return {
    subject: `Your ${money(args.amount)} payout is on its way`,
    html: shell({
      preheader: `${money(args.amount)} has been released to you.`,
      eyebrow: "Payout released",
      heading: "Your cut is on its way",
      accent: T.green,
      body: `<p style="margin:0 0 4px;">Nice work, ${escapeHtml(
        args.name
      )}. Your commission has been approved and sent.</p>
             ${stat("Amount sent", money(args.amount), T.green)}
             ${
               args.reference
                 ? `<p style="margin:0;font-size:13px;color:${T.muted};">Reference: <code style="color:${T.text};">${escapeHtml(
                     args.reference
                   )}</code></p>`
                 : ""
             }`,
    }),
  };
}

export function adminGrantedEmail(args: { name: string; grantedBy: string; consoleUrl: string }) {
  return {
    subject: "You now have admin access on GOAT Rank",
    html: shell({
      preheader: "Your account can now reach the command console.",
      eyebrow: "Access granted",
      heading: "You're an admin",
      body: `<p style="margin:0 0 14px;">${escapeHtml(
        args.grantedBy
      )} gave your account administrator access on GOAT Rank.</p>
             <p style="margin:0 0 14px;">You can now settle arenas, moderate battle cries, approve
             contender submissions and release creator payouts. These actions affect real money and
             other people's contests — take the care that implies.</p>
             <p style="margin:0;font-size:13px;color:${T.muted};">If you weren't expecting this,
             reply to this email and we'll revoke it.</p>`,
      button: { label: "Open the console", url: args.consoleUrl },
    }),
  };
}

export function roomSettledEmail(args: {
  title: string;
  winner: string;
  pool: number;
  charity: string;
  roomUrl: string;
}) {
  return {
    subject: `"${args.title}" has settled`,
    html: shell({
      preheader: `${args.winner} took it. ${money(args.pool)} raised.`,
      eyebrow: "Debate settled",
      heading: `${args.winner} takes it`,
      accent: T.yellow,
      body: `<p style="margin:0 0 4px;"><strong style="color:${T.text};">${escapeHtml(
        args.title
      )}</strong> has closed.</p>
             ${stat("Total pool", money(args.pool), T.yellow)}
             <p style="margin:0;">30% — <strong style="color:${T.pink};">${money(
               args.pool * 0.3
             )}</strong> — goes to ${escapeHtml(args.charity)}.</p>`,
      button: { label: "See the final board", url: args.roomUrl },
    }),
  };
}
