import LegalLayout, { H2 } from "../_components/LegalLayout";

export const metadata = { title: "Privacy | GOAT Rank" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy" updated="3 September 2026">
      <p>
        This describes what GOAT Rank stores about you and why. If something here is unclear,
        assume the more privacy-protective reading and ask us.
      </p>

      <H2>What we store</H2>
      <ul className="list-disc pl-5 flex flex-col gap-2">
        <li>
          <strong className="text-foreground">Account</strong> — your email address, a display name
          and an avatar. Your email is never shown publicly.
        </li>
        <li>
          <strong className="text-foreground">Votes</strong> — the amount, which contender you
          backed, and the public message you wrote. Your display name and avatar appear alongside
          it.
        </li>
        <li>
          <strong className="text-foreground">Creator activity</strong> — arenas you host, their
          pools, and your commission balance.
        </li>
        <li>
          <strong className="text-foreground">An upvote cookie</strong> — signed-out visitors get a
          random identifier in a cookie so one person cannot upvote the same message repeatedly. It
          contains no personal information.
        </li>
      </ul>

      <H2>What we never store</H2>
      <p>
        We do not store card numbers or any payment credentials. Checkout happens entirely on Lemon
        Squeezy; we only ever see an order identifier and the amount. We do not sell personal data,
        and we do not run advertising trackers.
      </p>

      <H2>What is public</H2>
      <p>
        Your display name, avatar, battle cries, and the arenas you have hosted along with their
        pools and your lifetime earnings are visible on your public profile. Your email address,
        your withdrawable balance, and your payout history are not.
      </p>

      <H2>Processors we use</H2>
      <ul className="list-disc pl-5 flex flex-col gap-2">
        <li><strong className="text-foreground">Supabase</strong> — database, authentication and file storage.</li>
        <li><strong className="text-foreground">Lemon Squeezy</strong> — payments, as merchant of record.</li>
        <li><strong className="text-foreground">Resend</strong> — transactional email such as vote receipts.</li>
      </ul>

      <H2>Your choices</H2>
      <p>
        You can change your display name and avatar at any time from your dashboard. You can ask us
        to delete your account, and we will remove your profile and detach your identity from your
        past votes. We keep the vote records themselves, without your name, because they are part
        of an arena&apos;s financial history and other people&apos;s results depend on them.
      </p>

      <H2>Children</H2>
      <p>
        GOAT Rank involves real payments and is not intended for anyone under 18. We do not
        knowingly collect information from children.
      </p>
    </LegalLayout>
  );
}
