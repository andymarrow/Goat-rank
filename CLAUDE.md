# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start (needs a build first)
npm run lint     # eslint (flat config); lint one file: npx eslint app/path/File.tsx
```

No test framework is configured — there is nothing to run for tests.

Supabase is accessed as a hosted project (see `.mcp.json` for the project ref). There is no local Supabase stack, no `supabase/` directory, and no migration files: schema changes live only in the remote database.

## Stack

Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind v4 · Supabase · framer-motion · lucide-react · next-themes. Path alias `@/*` maps to the repo root.

Tailwind v4 is CSS-first — there is **no `tailwind.config`**. Theme tokens are declared in [app/globals.css](app/globals.css) as CSS variables and exposed to utilities through `@theme inline`.

## Architecture

### Domain model (Supabase Postgres, RLS enabled on every table)

- `entities` — reusable contenders (a player, movie, car), global across rooms. Holds `brand_color`, `image_url`, `lifetime_raised`.
- `rooms` — a contest. `room_type` enum `1v1 | global`, `status` enum `pending_payment | active | settled`, plus `total_pool`, `expires_at`, `charity_name`, `creator_id → profiles`.
- `room_contenders` — join of `rooms` × `entities` with per-room `current_votes` and `seed_index`. **`seed_index` fixes display order** (left/top vs right/bottom); consumers sort by it rather than relying on row order.
- `votes` — one paid vote. Unique `polar_transaction_id` is the payment-provider idempotency key — the column name is a leftover from an earlier provider and now holds the Stripe payment intent id. Carries the public testimonial (`voter_name`, `voter_avatar`, `message`, `upvote_count`).
- `testimonial_upvotes` — anonymous upvotes on a vote, deduped by `user_fingerprint`.
- `profiles` — `auth.users` extension with `wallet_balance` / `total_earned`.

### Money flows through database triggers, not application code

`on_vote_inserted → handle_new_vote()` fires on every insert into `votes` and, in one transaction, adds the amount to `room_contenders.current_votes`, `rooms.total_pool` and `entities.lifetime_raised`, then credits the room creator 10% into `profiles.wallet_balance` and `total_earned`. `on_upvote_inserted → handle_new_upvote()` similarly bumps `votes.upvote_count`.

Consequence: inserting a row into `votes` is the *only* thing app code should do to record a vote. Never hand-update those aggregate columns — doing so double-counts. Changing the payout split means editing the trigger function in the database, not the TypeScript.

### Three Supabase clients, three trust levels

- [utils/supabase/server.ts](utils/supabase/server.ts) — cookie-backed anon client for Server Components and Server Actions. Its `setAll` intentionally swallows errors because RSCs cannot write cookies; there is **no `middleware.ts`**, so nothing refreshes sessions yet.
- [utils/supabase/client.ts](utils/supabase/client.ts) — browser anon client. Currently unused: the "live" battle chat and leaderboards are static, no realtime channel is subscribed anywhere.
- [utils/supabase/admin.ts](utils/supabase/admin.ts) — service-role client. Webhook/server-only; it bypasses RLS, so keep it out of anything reachable from the browser.

### Payment flow (Stripe hosted Checkout)

Server-side only — no client SDK, no Stripe.js. [VoteModal](app/battle/[slug]/_components/VoteModal.tsx) calls the `createVoteCheckout` server action in [actions/checkout.ts](actions/checkout.ts), which creates a Checkout Session with an inline `price_data` (pay-what-you-want) and returns `session.url` for a plain `window.location.href` redirect. The DB IDs never round-trip through the browser.

[app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) verifies the signature with `stripe.webhooks.constructEvent` over the **raw** `req.text()` body, handles `checkout.session.completed` and `checkout.session.async_payment_succeeded`, skips sessions whose `payment_status` is not `paid`, and inserts one `votes` row via the admin client.

Conventions that are load-bearing here:

- **Everything the webhook needs travels in `metadata`.** Set on both the session and the payment intent when the checkout is created server-side. Values are strings, capped at 500 characters, and an empty value drops the key — `metadata()` in [lib/stripe.ts](lib/stripe.ts) enforces both.
- **The session's metadata drives the handler; the intent's copy exists for reconciliation.** A refunded payment is read from the *charge*, and a session drops out of the API after 30 days.
- **Credit `amount_subtotal`, never `amount_total`.** With Stripe Tax enabled the buyer's tax lands in the total and would inflate every pool.
- **Amounts are dollars in Postgres, cents at Stripe.** Convert with `toCents` / `toDollars` from [lib/stripe.ts](lib/stripe.ts).
- **`votes.polar_transaction_id` holds the Stripe payment intent id.** Legacy column name from an earlier provider; its unique constraint is the webhook's idempotency key, so a replayed delivery raises Postgres `23505` — treat that as success and return 200, or deliveries retry for days.
- Return **500** on any other insert failure so Stripe retries rather than dropping a paid vote. The Postgres message rides back in the body, because Stripe's event log is the only place that failure is visible.
- The client is created lazily inside `stripe()`, not at module scope: a module-scope client that throws on a missing key breaks `next build` during page-data collection.
- Checkout redirect URLs are rebuilt from request headers, so no `NEXT_PUBLIC_SITE_URL` is required (it wins if set). Unlike the previous provider, Stripe takes a `cancel_url` as well as a `success_url`.
- **Stripe is not a merchant of record.** GOAT Rank is the seller, so sales tax and VAT are its own responsibility — the legal pages say so.

Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (provisioned, unused while checkout is hosted). The webhook endpoint is `https://www.goatrank.lol/api/webhooks/stripe`.

The $10 creator pass and the $5 add-contender flows are wired to the same Checkout, priced inline in [actions/checkout.ts](actions/checkout.ts).

### Data is mostly still mocked

Only the home page reads the database. Everything else — battle room, global room, dashboard, profile, create flow — renders `MOCK_*` constants declared inside its client component, including the room `id` values that `VoteModal` would send to checkout.

The wiring pattern to copy when replacing a mock is [app/(HOME)/page.tsx](app/(HOME)/page.tsx): an `async` server page calls a query in [actions/](actions/) (see [actions/getRooms.ts](actions/getRooms.ts), which fetches rooms with nested `room_contenders → entities` in one `.select()`), then passes plain data down as props to a `"use client"` component.

### Routing and layout

- [app/layout.tsx](app/layout.tsx) supplies fonts, `ThemeProvider` (class-based, `defaultTheme="dark"`), `NoiseOverlay` and the max-width `main`.
- Navigation chrome is **not** global: only the `(HOME)` route group wraps children in [LayoutChrome](components/LayoutChrome.tsx) (`DesktopNavbar` + `MobileTabBar`). `/battle`, `/global`, `/dashboard` and `/profile` render without nav even though they size themselves with `calc(100vh-64px)` as if it were present.
- Nav links to `/explore`, `/activity`, `/sports`, `/movies`, `/cars` and `/countries` have no routes yet.
- Route-local components live in colocated `_components/` folders (underscore-prefixed, so not routable).
- `params` is a Promise and must be awaited. `battle/[slug]` and `profile/[slug]` do; [app/global/[slug]/page.tsx](app/global/[slug]/page.tsx) still types it as a plain object and needs fixing when touched.

## Visual conventions

The look is "e-sports arcade": pitch-black dark mode, warm-paper light mode, orange `--primary`.

- Use the semantic token utilities (`bg-background`, `text-foreground`, `border-border`, `text-primary`, `bg-card`, and the `battle-red` / `battle-pink` / `battle-green` / `battle-yellow` accents) rather than raw Tailwind colors, so both themes track.
- Two typefaces: `font-sans` (Outfit) for prose, `font-arcade` (Orbitron) for every heading, stat, rank and button label — typically `uppercase` and `font-bold`.
- Signature helpers in `globals.css`: `.cut-corner` / `.cut-corner-lg` for clipped esports corners, `.striped-text` for large rank numerals, `.scrollbar-hide` for horizontal snap rails. Cards are clipped rectangles, not rounded.
- Motion is framer-motion; modals animate in with a scale + fade and a `backdrop-blur` scrim.
- `next.config.ts` allow-lists remote images from `images.unsplash.com` and `api.dicebear.com` only — dicebear generates voter avatars from the voter name. Adding another image host means editing that list.
