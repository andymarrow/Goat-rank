import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Crawl rules.
 *
 * Answer engines are allowed on purpose. Blocking GPTBot, ClaudeBot,
 * PerplexityBot and Google-Extended keeps the site out of the answers people
 * increasingly get instead of a results page, which for a platform whose whole
 * pitch is "settle the argument" is the wrong trade. What they read is public
 * anyway: arenas, standings and contender pages.
 *
 * Private surfaces stay out for everyone: the admin console, a signed-in
 * dashboard, and the auth callback carry nothing a search result should hold,
 * and indexing them would leak account-shaped URLs into public results.
 */
const PRIVATE = ["/admin", "/admin/", "/dashboard", "/callback", "/login", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE,
      },
      // Named explicitly rather than relying on the wildcard: several of these
      // only honour a rule that addresses them by name.
      ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User",
          "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended",
          "CCBot", "Bingbot", "DuckDuckBot"].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
