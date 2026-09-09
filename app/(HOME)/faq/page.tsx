import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Swords, Wallet } from "lucide-react";

import { absolute, breadcrumbSchema, faqSchema, jsonLd, DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How GOAT Rank works",
  description:
    "How pledging, hosting, charity allocation and payouts work on GOAT Rank. Every pledge splits 60% to the arena pool, 30% to charity and 10% to the host.",
  alternates: { canonical: absolute("/faq") },
  openGraph: {
    title: "How GOAT Rank works",
    description: DESCRIPTION,
    url: absolute("/faq"),
    type: "article",
  },
};

/**
 * The answer page.
 *
 * Written as questions people actually type, answered in the first sentence
 * rather than after a paragraph of preamble. That shape is what a featured
 * snippet and an AI answer both lift: the question as the heading, the claim
 * as the opening line, the detail after it. The same array feeds the FAQPage
 * schema below, so the machine-readable copy and the human copy cannot drift.
 */
const FAQ = [
  {
    question: "What is GOAT Rank?",
    answer:
      "GOAT Rank is a platform where arguments are settled with money rather than free votes. Someone hosts an arena about a question people already argue over, such as who the greatest footballer is, and anyone can back a contender by pledging at least $3. The standing is the money behind each contender, so backing changes the leaderboard by the amount you pledged.",
  },
  {
    question: "Where does the money go?",
    answer:
      "Every pledge splits three ways: 60% grows the arena's prize pool, 30% goes to a registered charity, and 10% goes to the person who created the arena. The split is calculated on the amount pledged, before payment processing fees, which come out of the platform's share.",
  },
  {
    question: "Is GOAT Rank gambling?",
    answer:
      "No. A pledge is not a wager. There are no odds, backers are never paid out, and nothing is returned if your contender wins. The money goes to the arena's pool, to charity and to the host, which is why pledges are final rather than refundable bets.",
  },
  {
    question: "How much does it cost to back a contender?",
    answer:
      "The minimum pledge is $3, and you can pledge any amount above that. Payment is handled by Stripe on its own hosted checkout, so GOAT Rank never sees or stores card details.",
  },
  {
    question: "Which charity does an arena raise for?",
    answer:
      "Backers decide. Inside every arena there is a charity nomination vote listing the registered charities, and the leading nomination is the cause the arena's 30% is headed to. Anyone can nominate a new charity on the requests board, and admins register the ones that check out.",
  },
  {
    question: "How do I host my own arena?",
    answer:
      "Pick the question and the contenders, then deploy it. A $10 creator pass covers five arenas, and you earn 10% of every pledge made in any of them, paid into your wallet as each pledge lands rather than at the end.",
  },
  {
    question: "What is the difference between a 1v1 and a global arena?",
    answer:
      "A 1v1 arena is a head-to-head between exactly two contenders, shown as a split stage with the percentage each side holds. A global arena is a leaderboard that ranks many contenders, and anyone can pay $5 to add a new contender to one.",
  },
  {
    question: "When does an arena end, and what happens then?",
    answer:
      "Each arena runs to a deadline shown as a live countdown. When it closes the standing is final, no further pledges are accepted, and the charity share is remitted to the leading nominated cause in a batch with other settled arenas.",
  },
  {
    question: "How do creators get paid?",
    answer:
      "The 10% host commission is credited to the creator's wallet by the database the moment each pledge lands, not when the arena settles. Creators request a payout from their dashboard once the balance clears the minimum.",
  },
  {
    question: "Can I get a refund on a pledge?",
    answer:
      "Pledges are final. The money moves into the pool the moment it lands and other people back contenders on the strength of that standing, so unwinding one pledge would misstate the contest for everyone else. Genuine payment disputes are handled through Stripe.",
  },
  {
    question: "Are some arenas and supporters seeded by the platform?",
    answer:
      "Yes, and they are disclosed. GOAT Rank seeds some arenas and supporter accounts to demonstrate the format so the site is not empty. Every seeded supporter carries an orange dot in the interface, and seeded pledges are excluded from revenue and charity reporting.",
  },
  {
    question: "Do I need an account to take part?",
    answer:
      "You can browse every arena, back a contender and post on the requests board without an account. An account is needed to host an arena, because the 10% commission has to be paid to someone, and to keep your battle cries attached to a public profile.",
  },
];

export default function FaqPage() {
  const schema = jsonLd(
    faqSchema(FAQ),
    breadcrumbSchema([
      { name: "GOAT Rank", path: "/" },
      { name: "How it works", path: "/faq" },
    ])
  );

  return (
    <div className="w-full max-w-3xl mx-auto py-8 md:py-14 pb-24 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <header className="flex flex-col gap-3 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
          How it works
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Settling a debate with money
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          GOAT Rank turns an argument into a funded leaderboard. You back a contender with a real
          pledge, the standing moves by what you paid, and 30% of every pledge reaches a charity
          the backers choose.
        </p>
      </header>

      {/* The split, stated once, in the place people look for it. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[
          { icon: Swords, pct: "60%", label: "to the arena pool", tone: "text-primary" },
          { icon: HeartHandshake, pct: "30%", label: "to charity", tone: "text-emerald-500" },
          { icon: Wallet, pct: "10%", label: "to the host", tone: "text-sky-500" },
        ].map((s) => (
          <div
            key={s.pct}
            className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col gap-1"
          >
            <s.icon className={`w-4 h-4 ${s.tone}`} />
            <span className="text-2xl font-extrabold text-foreground tabular-nums">{s.pct}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border/60">
        {FAQ.map((entry) => (
          <section key={entry.question} className="py-5 flex flex-col gap-2">
            <h2 className="text-base md:text-lg font-bold text-foreground leading-snug">
              {entry.question}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.answer}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="flex-1 text-sm text-foreground font-medium">
          Still arguing about something? Put it in an arena and let the money decide.
        </p>
        <Link
          href="/create"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary
                     text-primary-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider
                     hover:opacity-95 transition-opacity"
        >
          Host an arena <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
