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
- `votes` — one paid vote. Unique `polar_transaction_id` is the payment-provider idempotency key — the column name is a leftover from an earlier provider and now holds the Lemon Squeezy order id. Carries the public testimonial (`voter_name`, `voter_avatar`, `message`, `upvote_count`).
- `testimonial_upvotes` — anonymous upvotes on a vote, deduped by `user_fingerprint`.
- `profiles` — `auth.users` extension with `wallet_balance` / `total_earned`.

### Money flows through database triggers, not application code

`on_vote_inserted → handle_new_vote()` fires on every insert into `votes` and, in one transaction, adds the amount to `room_contenders.current_votes`, `rooms.total_pool` and `entities.lifetime_raised`, then credits the room creator 10% into `profiles.wallet_balance` and `total_earned`. `on_upvote_inserted → handle_new_upvote()` similarly bumps `votes.upvote_count`.

Consequence: inserting a row into `votes` is the *only* thing app code should do to record a vote. Never hand-update those aggregate columns — doing so double-counts. Changing the payout split means editing the trigger function in the database, not the TypeScript.

### Three Supabase clients, three trust levels

- [utils/supabase/server.ts](utils/supabase/server.ts) — cookie-backed anon client for Server Components and Server Actions. Its `setAll` intentionally swallows errors because RSCs cannot write cookies; there is **no `middleware.ts`**, so nothing refreshes sessions yet.
- [utils/supabase/client.ts](utils/supabase/client.ts) — browser anon client. Currently unused: the "live" battle chat and leaderboards are static, no realtime channel is subscribed anywhere.
- [utils/supabase/admin.ts](utils/supabase/admin.ts) — service-role client. Webhook/server-only; it bypasses RLS, so keep it out of anything reachable from the browser.

### Payment flow (Lemon Squeezy hosted checkout)

Lemon Squeezy is the merchant of record. Server-side only — no client SDK, no publishable key. [VoteModal](app/battle/[slug]/_components/VoteModal.tsx) calls the `createVoteCheckout` server action in [actions/checkout.ts](actions/checkout.ts), which calls `createCheckout(storeId, LS_VARIANT_VOTE, …)` with the dollar amount as `customPrice` (pay-what-you-want) and returns `data.attributes.url` for a plain `window.location.href` redirect. The DB IDs never round-trip through the browser.

[app/api/webhooks/lemonsqueezy/route.ts](app/api/webhooks/lemonsqueezy/route.ts) verifies an HMAC-SHA256 hex digest of the **raw** `req.text()` body against the `x-signature` header, handles only `meta.event_name === "order_created"`, skips orders whose `status` is not `paid`, and inserts one `votes` row via the admin client.

Conventions that are load-bearing here:

- **The SDK is camelCase; the REST API is snake_case.** `@lemonsqueezy/lemonsqueezy.js` takes `customPrice`, `productOptions`, `checkoutData` — not `custom_price`, `checkout_data`. Docs and blog posts usually show the raw REST shape.
- **Custom data comes back on `meta.custom_data`, not on the order attributes.** This is the most common way the integration silently breaks. Values must be strings.
- **Credit `subtotal_usd`, never `total`.** As merchant of record Lemon Squeezy adds the buyer's tax to `total`; using it would inflate every battle pool. `subtotal_usd` is the chosen price, normalised to USD cents, so a EUR payer can't credit a EUR number into a dollar column. Note this is the gross pledge — LS's fee comes off what they remit, so the DB trigger's 10% creator commission is computed on the pledge, not on net receipts.
- **Amounts are dollars in Postgres, cents at Lemon Squeezy.** Convert with `Math.round(dollars * 100)` outbound and `/ 100` inbound.
- **`votes.polar_transaction_id` holds the Lemon Squeezy order id.** Legacy column name; its unique constraint is the webhook's idempotency key, so a replayed delivery raises Postgres `23505` — treat that as success and return 200, or deliveries retry forever.
- Return **500** on any other insert failure so Lemon Squeezy retries rather than dropping a paid vote.
- `timingSafeEqual` throws on length mismatch, so the signature check compares buffer lengths first. `Buffer.from(sig, "hex")` does not throw on non-hex input — it returns a short buffer, which the length check catches.
- The SDK is configured lazily inside the action, not at module scope: a module-scope client that throws on a missing key breaks `next build` during page-data collection.
- Checkout redirect URLs are rebuilt from request headers, so no `NEXT_PUBLIC_SITE_URL` is required (it wins if set). Lemon Squeezy has no cancel URL — only `productOptions.redirectUrl` after success.

`LS_VARIANT_CREATOR` ($10 room pass) and `LS_VARIANT_CONTENDER` ($5 add-contender) are provisioned in the environment but not wired up — those two flows still `alert()` a mock in [CreateClient](app/(HOME)/create/_components/CreateClient.tsx) and [AddContenderModal](app/global/[slug]/_components/AddContenderModal.tsx).

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
