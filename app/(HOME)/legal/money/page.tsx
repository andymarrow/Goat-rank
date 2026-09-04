import LegalLayout, { H2 } from "../_components/LegalLayout";

export const metadata = { title: "Where the money goes | GOAT Rank" };

/**
 * The split is defined in one place in code (SPLIT in actions/admin/analytics)
 * and enforced for the creator share by the handle_new_vote trigger. Keep the
 * numbers here in step with those if they ever change.
 */
export default function MoneyPage() {
  return (
    <LegalLayout title="Where the money goes" updated="3 September 2026">
      <p>
        Every vote on GOAT Rank is a real payment. This page explains exactly what happens to it.
        We would rather over-explain this than have you guess.
      </p>

      <H2>The split</H2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose">
        {[
          { pct: "60%", who: "Platform", note: "Runs and builds GOAT Rank", tone: "text-primary" },
          { pct: "30%", who: "Charity", note: "Paid to the arena's chosen cause", tone: "text-battle-pink" },
          { pct: "10%", who: "Creator", note: "The person who hosted the arena", tone: "text-battle-green" },
        ].map((s) => (
          <div key={s.who} className="bg-card border border-border cut-corner p-4">
            <p className={`font-arcade text-2xl font-black ${s.tone}`}>{s.pct}</p>
            <p className="font-arcade text-[10px] uppercase tracking-widest text-foreground mt-1">
              {s.who}
            </p>
            <p className="text-xs text-foreground/50 mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      <H2>Fees come out of our share</H2>
      <p>
        Lemon Squeezy is the merchant of record for every transaction. They collect the payment,
        handle sales tax and VAT where it applies, and take a processing fee. That fee is deducted
        from the platform&apos;s 60% — the charity and creator shares are calculated on the amount you
        pledged, not on what is left after fees.
      </p>

      <H2>Tax is added on top</H2>
      <p>
        If your country charges tax on digital purchases, Lemon Squeezy adds it at checkout. That
        tax is never counted toward an arena&apos;s pool. A $10 vote contributes $10 to the pool
        whether you paid $10 or $12.10.
      </p>

      <H2>When the charity is paid</H2>
      <p>
        Charity money accrues as arenas settle and is remitted in batches rather than per vote,
        because per-transaction transfers would lose most of a small donation to bank fees. The
        charity registry in our admin console records the amount owed to each organisation.
      </p>

      <H2>Refunds and chargebacks</H2>
      <p>
        Votes are generally final — the pool moves the moment a vote lands, and other people make
        decisions based on it. If a payment is refunded or charged back, we reverse it fully: the
        amount comes back out of the arena pool, the contender&apos;s total and the creator&apos;s
        commission. A refunded vote never counts toward any share.
      </p>

      <H2>This is not gambling</H2>
      <p>
        A vote is a payment to back a contender and publish a message. It is not a wager. There is
        no cash prize, no payout to voters, and no way to win money by voting. The only person who
        earns from an arena is the creator who hosted it, through their 10% commission.
      </p>

      <H2>Creator payouts</H2>
      <p>
        Creator commission is credited the moment a vote lands. Creators can request a withdrawal
        once their balance clears the minimum shown on their dashboard. We review each request
        before sending it, and the balance is debited at the point we mark it paid.
      </p>
    </LegalLayout>
  );
}
