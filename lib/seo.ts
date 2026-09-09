/**
 * Site-wide SEO constants and structured-data builders.
 *
 * Two audiences, one set of facts. Search engines need canonical URLs, a
 * sitemap and schema.org types they can map to features. Answer engines
 * (ChatGPT, Perplexity, Google's AI Overviews, Claude) need the same facts
 * stated plainly enough to quote: what this site is, what it costs, where the
 * money goes. Everything either one reads is generated from the values here,
 * so the two can never drift apart.
 */

/**
 * The apex 308-redirects to www, so www is the canonical host. Pointing
 * canonicals at a redirecting hostname is a self-inflicted ranking problem:
 * every link's authority arrives at a URL that immediately says "not here".
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goatrank.lol"
).replace(/\/+$/, "");

export const SITE_NAME = "GOAT Rank";

export const TAGLINE = "Settle the debate with real money";

export const DESCRIPTION =
  "GOAT Rank turns arguments into funded leaderboards. Back a contender with real money: 60% grows the arena's pool, 30% goes to charity, and 10% goes to whoever hosted the debate.";

/** Short factual lines that answer engines can quote without paraphrasing. */
export const FACTS = [
  "GOAT Rank is a crowdfunded debate platform where people back a contender with real money instead of a free vote.",
  "Every pledge splits three ways: 60% to the arena's prize pool, 30% to charity, and 10% to the person who created the arena.",
  "Arenas come in two shapes: a 1v1 head-to-head between two contenders, and a global leaderboard ranking many.",
  "The minimum pledge is $3. Payments are processed by Stripe and the platform never stores card details.",
  "Backers choose which registered charity an arena's 30% goes to by nominating one inside the arena.",
  "Anyone can host an arena for $10, which covers five arenas, and earns 10% of every pledge made in them.",
];

export const absolute = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** The publisher, reused by every other node so the graph stays connected. */
export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: SITE_NAME,
    url: SITE_URL,
    logo: absolute("/icon.png"),
    description: DESCRIPTION,
    slogan: TAGLINE,
  };
}

/** Enables the sitelinks search box, and tells answer engines search exists. */
export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": absolute("/#website"),
    url: SITE_URL,
    name: SITE_NAME,
    description: DESCRIPTION,
    publisher: { "@id": absolute("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absolute("/?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/**
 * An arena as an Event.
 *
 * A contest that opens, runs and closes on a date is an Event in schema.org's
 * vocabulary, and it is the only type that carries the deadline — which is the
 * fact that makes an arena worth surfacing while it is still live.
 */
export function arenaSchema(arena: {
  id: string;
  title: string;
  description: string;
  roomType: string;
  category: string;
  expiresAt: string;
  totalPool: number;
  contenders: { name: string; image: string | null }[];
}) {
  const path = `/${arena.roomType === "global" ? "global" : "battle"}/${arena.id}`;

  return {
    "@type": "Event",
    "@id": absolute(`${path}#event`),
    name: arena.title,
    description: arena.description,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    endDate: arena.expiresAt,
    url: absolute(path),
    about: arena.category,
    organizer: { "@id": absolute("/#organization") },
    location: {
      "@type": "VirtualLocation",
      url: absolute(path),
    },
    competitor: arena.contenders.map((c) => ({
      "@type": "Thing",
      name: c.name,
      ...(c.image ? { image: c.image } : {}),
    })),
    offers: {
      "@type": "Offer",
      price: 3,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absolute(path),
      description: "Minimum pledge to back a contender.",
    },
  };
}

/** A ranked leaderboard, so the standing itself is machine-readable. */
export function leaderboardSchema(
  path: string,
  name: string,
  items: { name: string; url?: string; image?: string | null }[]
) {
  return {
    "@type": "ItemList",
    "@id": absolute(`${path}#leaderboard`),
    name,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { url: absolute(item.url) } : {}),
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function faqSchema(entries: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    "@id": absolute("/faq#faq"),
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Wraps nodes in a single connected graph, which parsers prefer to loose blobs. */
export function jsonLd(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
