import LegalLayout, { H2 } from "../_components/LegalLayout";

export const metadata = { title: "Terms | GOAT Rank" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of use" updated="3 September 2026">
      <p>
        By using GOAT Rank you agree to these terms. They are written to be read, not to be
        impenetrable.
      </p>

      <H2>What GOAT Rank is</H2>
      <p>
        GOAT Rank is an entertainment platform for settling opinion debates. You pay to back a
        contender and publish a public message. Results are for entertainment and carry no
        official standing.
      </p>

      <H2>Votes are final</H2>
      <p>
        A vote moves the arena pool immediately and other people act on that. Votes are
        non-refundable except where the law requires otherwise or where we have made an error.
      </p>

      <H2>No prizes, no wagering</H2>
      <p>
        Voting does not win you money. There is no cash prize and no payout to voters. Creators
        earn a 10% commission on arenas they host; that is the only earning mechanism on the
        platform.
      </p>

      <H2>What you post</H2>
      <p>
        Battle cries are public and permanent. You keep ownership of what you write, and you grant
        us the right to display it on the platform. Do not post anything unlawful, hateful,
        harassing, or that impersonates someone else.
      </p>
      <p>
        We may hide a message that breaks these rules. If we do, the payment stands and the pool is
        unaffected — we remove words, never money.
      </p>

      <H2>Contenders</H2>
      <p>
        Contenders should be public figures, teams, products or works. Do not add a private
        individual. Uploaded images must be ones you have the right to use. We review paid contender
        submissions and may reject or replace an image.
      </p>

      <H2>Suspension</H2>
      <p>
        We may suspend an account that breaks these terms. A suspended account cannot host arenas or
        withdraw creator funds. Money already committed to a pool is not returned to the suspended
        account, because it belongs to the arena and its charity.
      </p>

      <H2>Availability</H2>
      <p>
        We work to keep GOAT Rank running but do not guarantee uninterrupted service. Arenas run on
        a timer; if an outage materially affects an arena we may extend or settle it at our
        discretion.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about these terms, a payment, or a takedown request should be sent to our support
        address.
      </p>
    </LegalLayout>
  );
}
