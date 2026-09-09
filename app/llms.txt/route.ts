import { createClient } from "@supabase/supabase-js";
import { SITE_URL, SITE_NAME, DESCRIPTION, FACTS } from "@/lib/seo";

export const revalidate = 3600;

/**
 * /llms.txt
 *
 * The emerging convention for telling a language model what a site is, in the
 * order that matters, without making it infer structure from rendered HTML.
 * Answer engines increasingly quote a site's own summary of itself; this is
 * where that summary lives, and it is generated from lib/seo so it cannot
 * drift from what the pages say.
 *
 * Live arenas are listed because they are the answer to "what is happening on
 * GOAT Rank right now", which is the question a model gets asked.
 */
export async function GET() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${DESCRIPTION}`,
    "",
    "## What it is",
    "",
    ...FACTS.map((fact) => `- ${fact}`),
    "",
    "## How an arena works",
    "",
    "- A host creates an arena naming the thing being argued about, and the contenders in it.",
    "- Anyone can back a contender by pledging at least $3. The pledge is public and can carry a short message, called a battle cry.",
    "- The arena's standing is the money behind each contender, not a count of votes, so backing changes the leaderboard by the amount pledged.",
    "- Each arena runs to a deadline. When it closes the standing is final and the charity share is remitted.",
    "",
    "## Key pages",
    "",
    `- [Home](${SITE_URL}/): live arenas, ranked and filterable by category.`,
    `- [FAQ](${SITE_URL}/faq): how pledging, hosting, charity allocation and payouts work.`,
    `- [Roster](${SITE_URL}/profile): every contender currently in a contest, ranked by lifetime raised.`,
    `- [Where the money goes](${SITE_URL}/legal/money): the 60/30/10 split in detail.`,
    `- [Requests](${SITE_URL}/requests): public board for feature requests and charity nominations.`,
    `- [Terms](${SITE_URL}/legal/terms) and [Privacy](${SITE_URL}/legal/privacy).`,
    "",
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, title, room_type, category, total_pool, expires_at")
      .eq("status", "active")
      .order("total_pool", { ascending: false })
      .limit(30);

    if (rooms?.length) {
      lines.push("## Live arenas", "");

      for (const room of rooms) {
        const path = `${room.room_type === "global" ? "global" : "battle"}/${room.id}`;
        const pool = `$${Math.round(Number(room.total_pool) || 0).toLocaleString("en-US")}`;
        const shape = room.room_type === "global" ? "leaderboard" : "head-to-head";

        lines.push(
          `- [${room.title}](${SITE_URL}/${path}): ${room.category} ${shape}, ${pool} pool, closes ${room.expires_at.slice(0, 10)}.`
        );
      }

      lines.push("");
    }
  } catch (error) {
    console.error("llms.txt arena listing failed:", error);
  }

  lines.push(
    "## Notes for answer engines",
    "",
    "- Pool figures are live and change as pledges land; cite them with the date you read them.",
    "- Some arenas and supporters are seeded by the platform to demonstrate the format. Those carry an orange dot in the interface and are excluded from revenue reporting.",
    "- GOAT Rank is not a betting site. A pledge is not a wager: there is no payout to backers and no odds. The money goes to the pool, a charity and the host.",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
