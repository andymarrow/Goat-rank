import type { StarterArena } from "./starterArenas";

/**
 * Launch catalogue for X.
 *
 * The classic catalogue is safe evergreen sport-and-gadget fare. This one is
 * built for the first go-to-market push, where the arena has to be an argument
 * people already want to have: US politics, the AI tooling wars, and the
 * developer religious wars.
 *
 * Two rules held throughout:
 *
 * - Contests are framed as opinion — "greatest", "best", "which side" — never
 *   as a claim of fact about a living person. A paid leaderboard about a
 *   public figure's record is a debate; one about their character is a libel
 *   risk with a payment processor attached.
 * - No artwork. Every image URL in the classic catalogue came from the
 *   original fixtures and is known-good; inventing Unsplash ids for public
 *   figures would seed broken images across the homepage. Contenders render
 *   as their initial in the brand colour until someone uploads a portrait from
 *   Roster, which takes seconds now that the image tools exist.
 *
 * Colours carry the meaning instead: party red and blue where that reads,
 * house colours for the AI labs.
 */
export const VIRAL_ARENAS: StarterArena[] = [
  // ------------------------------------------------------------- AI TOOLING
  {
    title: "Claude Code vs. Codex",
    category: "Tech",
    roomType: "1v1",
    featured: true,
    cries: 14,
    contenders: [
      { name: "Claude Code", color: "#FF7A00" },
      { name: "Codex", color: "#10B981" },
    ],
  },
  {
    title: "Best AI Coding Agent",
    category: "Tech",
    roomType: "global",
    featured: true,
    cries: 16,
    contenders: [
      { name: "Claude Code", color: "#FF7A00" },
      { name: "Codex", color: "#10B981" },
      { name: "Cursor", color: "#3B82F6" },
      { name: "GitHub Copilot", color: "#94A3B8" },
      { name: "Gemini CLI", color: "#8B5CF6" },
    ],
  },
  {
    title: "Best Frontier Model Right Now",
    category: "Tech",
    roomType: "global",
    featured: true,
    cries: 15,
    contenders: [
      { name: "Claude", color: "#FF7A00" },
      { name: "ChatGPT", color: "#10B981" },
      { name: "Gemini", color: "#3B82F6" },
      { name: "Grok", color: "#E5E7EB" },
      { name: "Llama", color: "#6366F1" },
    ],
  },
  {
    title: "Open Source vs. Closed Source AI",
    category: "Tech",
    roomType: "1v1",
    cries: 12,
    contenders: [
      { name: "Open Source", color: "#10B981" },
      { name: "Closed Source", color: "#0F172A" },
    ],
  },
  {
    title: "Elon Musk vs. Sam Altman",
    category: "Tech",
    roomType: "1v1",
    featured: true,
    cries: 13,
    contenders: [
      { name: "Elon Musk", color: "#E5484D" },
      { name: "Sam Altman", color: "#10B981" },
    ],
  },
  {
    title: "Will AI Replace Junior Developers by 2030?",
    category: "Tech",
    roomType: "1v1",
    cries: 12,
    contenders: [
      { name: "Yes", color: "#E5484D" },
      { name: "No", color: "#3B82F6" },
    ],
  },

  // ------------------------------------------------------ DEVELOPER WARS
  {
    title: "Rust vs. Go",
    category: "Tech",
    roomType: "1v1",
    cries: 11,
    contenders: [
      { name: "Rust", color: "#F97316" },
      { name: "Go", color: "#06B6D4" },
    ],
  },
  {
    title: "Vim vs. VS Code",
    category: "Tech",
    roomType: "1v1",
    cries: 10,
    contenders: [
      { name: "Vim", color: "#10B981" },
      { name: "VS Code", color: "#3B82F6" },
    ],
  },
  {
    title: "Tabs vs. Spaces",
    category: "Tech",
    roomType: "1v1",
    cries: 9,
    contenders: [
      { name: "Tabs", color: "#FACC15" },
      { name: "Spaces", color: "#8B5CF6" },
    ],
  },
  {
    title: "Most Overrated JavaScript Framework",
    category: "Tech",
    roomType: "global",
    cries: 12,
    contenders: [
      { name: "React", color: "#06B6D4" },
      { name: "Next.js", color: "#0F172A" },
      { name: "Angular", color: "#E5484D" },
      { name: "Svelte", color: "#F97316" },
    ],
  },

  // ------------------------------------------------------------- POLITICS
  {
    title: "Trump vs. Obama: Greatest Modern President?",
    category: "Politics",
    roomType: "1v1",
    featured: true,
    cries: 18,
    contenders: [
      { name: "Donald Trump", color: "#E5484D" },
      { name: "Barack Obama", color: "#3B82F6" },
    ],
  },
  {
    title: "Greatest US President of All Time",
    category: "Politics",
    roomType: "global",
    featured: true,
    cries: 16,
    contenders: [
      { name: "Abraham Lincoln", color: "#94A3B8" },
      { name: "Franklin D. Roosevelt", color: "#0EA5E9" },
      { name: "Ronald Reagan", color: "#E5484D" },
      { name: "Barack Obama", color: "#3B82F6" },
      { name: "Donald Trump", color: "#F97316" },
    ],
  },
  {
    title: "Left vs. Right: Who Is Winning the Internet?",
    category: "Politics",
    roomType: "1v1",
    featured: true,
    cries: 17,
    contenders: [
      { name: "The Left", color: "#3B82F6" },
      { name: "The Right", color: "#E5484D" },
    ],
  },
  {
    title: "Capitalism vs. Socialism",
    category: "Politics",
    roomType: "1v1",
    cries: 15,
    contenders: [
      { name: "Capitalism", color: "#10B981" },
      { name: "Socialism", color: "#E5484D" },
    ],
  },
  {
    title: "Free Speech vs. Content Moderation",
    category: "Politics",
    roomType: "1v1",
    cries: 13,
    contenders: [
      { name: "Free Speech", color: "#FACC15" },
      { name: "Moderation", color: "#6366F1" },
    ],
  },
  {
    title: "Most Influential Voice in Politics",
    category: "Politics",
    roomType: "global",
    cries: 14,
    contenders: [
      { name: "Joe Rogan", color: "#F97316" },
      { name: "Tucker Carlson", color: "#E5484D" },
      { name: "Ben Shapiro", color: "#0EA5E9" },
      { name: "Hasan Piker", color: "#EF4444" },
      { name: "Megyn Kelly", color: "#8B5CF6" },
    ],
  },

  // -------------------------------------------------------- MONEY & WORK
  {
    title: "Bitcoin vs. Gold",
    category: "Tech",
    roomType: "1v1",
    cries: 12,
    contenders: [
      { name: "Bitcoin", color: "#F97316" },
      { name: "Gold", color: "#FACC15" },
    ],
  },
  {
    title: "Remote Work vs. Return to Office",
    category: "Culture",
    roomType: "1v1",
    cries: 13,
    contenders: [
      { name: "Remote", color: "#10B981" },
      { name: "Office", color: "#94A3B8" },
    ],
  },
  {
    title: "Is AI Art Real Art?",
    category: "Culture",
    roomType: "1v1",
    cries: 12,
    contenders: [
      { name: "Yes", color: "#8B5CF6" },
      { name: "No", color: "#E5484D" },
    ],
  },
];
