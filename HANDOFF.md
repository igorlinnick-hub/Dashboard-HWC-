# Handoff — Wellness BI Agency Dashboard

> PROJECT COMPLETE — v1.0 shipped 2026-04-08. Demo Mode wired end-to-end 2026-04-11.

## Known Bugs (next session)

- **Square credentials path bug**: `data/route.ts` reads `creds.access_token` and `creds.location_id` at top level (~line 143), but `connect/route.ts:49` stores them inside `extra_config`. Change to `creds.extra_config.access_token` / `creds.extra_config.location_id`. This is why "Connection Timeout" appears for Square.
- **TikTok still uses Supermetrics**: After Meta switched to Graph API direct, TikTok is the only Supermetrics-dependent connector left. Reconnect UX now surfaces the API error (commit ea267f3), but the underlying TikTok fetcher should be rewritten on TikTok Ads API.
- **Default Supabase SMTP**: project still uses Supabase's built-in mailer (4 emails/hour limit, unreliable Gmail delivery). Switch to a custom SMTP (Resend / SendGrid / Postmark) in Supabase Dashboard → Authentication → Emails → SMTP Settings before scaling invites.

---


## All Chapters Done

| # | Chapter | Status |
|---|---------|--------|
| 1.1 | Middleware auth (server-side route protection via @supabase/ssr) | DONE |
| 2.1 | Universal data model (ConnectorResponse, Metric, TimeseriesPoint, BreakdownItem) | DONE |
| 4.1 | Stripe module (real API — 6 metrics, daily timeseries, top 5 products) | DONE |
| 6.1 | Google Analytics (OAuth + GA4 Data API — sessions, users, bounce rate, channels) | DONE |
| 7.1 | Bank via Plaid Sandbox (Plaid Link + balance + transactions + categories) | DONE |
| — | Square (Connect API — payments, refunds, daily/hourly aggregations) | DONE |
| — | Meta Ads (Graph API direct — Spend, Impressions, CTR, CPC, Campaigns) | DONE |
| — | Meta error → reconnect UX (any non-transient error routes to ConnectorOnboarding with API message + Reconnect CTA) | DONE |
| — | TikTok Ads (Supermetrics — Spend, Impressions, Conversions, Video Views) | DONE |
| — | Yelp (Fusion API — Rating, Reviews, Recent Reviews) | DONE |
| — | Dark UI redesign (orange accent, CSS animations, no framer-motion) | DONE |
| — | Login/signup page (radial glow, spinner, animations) | DONE |
| — | Client CRUD (Create, Edit, soft Delete, shared modal, optimistic UI) | DONE |
| — | Connector connect/disconnect flows | DONE |
| — | Connector registry (7 connectors, icons, mock-data) | DONE |
| — | DateRangePicker (URL param sync, presets, wired into Header) | DONE |
| — | Caching layer (Supabase-backed, per-connector TTL, integrated in data route) | DONE |
| — | Agency Overview Table (sortable, aggregated stats) | DONE |
| — | Global Toast system (Context, useToast hook, provider) | DONE |
| — | Mobile responsiveness (hamburger, sidebar overlay, responsive grids) | DONE |
| — | Alerts system (SB table, lib/alerts.ts, Header bell + dropdown) | DONE |
| — | Connector detail page (MetricCards, LineChart, BarChart, Refresh, Last Updated) | DONE |
| — | EmptyState / ErrorState components | DONE |
| — | Demo Mode (toggle mock data for any connector) | DONE |
| — | Connection Test API (`POST /test` — lightweight validation per connector) | DONE |
| — | Real-time connection testing in ConnectModal | DONE |
| — | Team invite re-send (handles `email_exists` → falls back to recovery for unconfirmed users) | DONE |

## What Works End-to-End

- Auth: login -> signup -> signout -> route protection
- Agency Overview: Sortable table with Revenue, Ad Spend, Yelp, Sessions, Connection count
- Client management: create -> edit -> soft-delete -> list
- Connector management: connect (save creds / OAuth / Plaid Link) -> disconnect
- All 7 connectors: real API implementations (Stripe, Square, Meta, Yelp, TikTok, GA, Bank)
- Connector detail page: metrics grid, trend chart, breakdown chart, refresh, last-updated
- Period filter: DateRangePicker -> URL params -> API -> cache key (end-to-end)
- Caching: Supabase-backed, per-connector TTL, refresh=true bypass
- Mobile: Hamburger menu, responsive grids
- Alerts: Bell icon, unread badge, dropdown

## Env Vars Required

| Var | Used by |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB ops |
| `GOOGLE_CLIENT_ID` | GA OAuth |
| `GOOGLE_CLIENT_SECRET` | GA OAuth |
| `GOOGLE_REDIRECT_URI` | GA OAuth callback |
| `PLAID_CLIENT_ID` | Bank (Plaid) |
| `PLAID_SECRET` | Bank (Plaid) |
| `PLAID_ENV` | Bank (sandbox/development/production) |

## Build Status

- `tsc --noEmit` -> **0 errors** (verified 2026-04-09, final)
- Added `console.error('[connector:slug]', err)` to all 7 catch blocks in `data/route.ts` for improved server-side debugging.
- `npm run build` -> requires Node 18, 20, or 22 (Node v24 is incompatible)

## Known Issues

- **Demo Mode**: Allows toggling high-quality mock data per connector in Settings. Requires `use_mock` column in `connector_credentials`.
- **Connection Testing**: ConnectModal now verifies credentials via `/test` API for ALL 7 connectors (Stripe, Square, Meta, Yelp, TikTok, GA, Plaid) before closing.
- **Node.js v24**: `npm run build` / `dev` fails with `ERR_INVALID_PACKAGE_CONFIG` or `TypeError`. Use Node 22.
- **Middleware Redirects**: Fixed infinite loop when refreshing sessions by propagating cookies during redirects.
- **Auth Sync**: Standardized on `@supabase/ssr` for browser/server session parity.
- **Stripe webhook**: stub only — no signature verification or event handling.

## Architecture Quick Ref

- **Modules**: `modules/<name>/` — types.ts, fetcher.ts, transformer.ts. Never cross-import.
- **Registry**: `lib/connectors/registry.ts` — single source of truth for connector metadata.
- **Data flow**: SWR -> `/api/` route -> check cache -> call module fetcher -> transformer -> ConnectorResponse
- **DB tables**: `clients`, `connector_credentials`, `dashboard_pages`, `cached_data`, `alerts`
- **Deploy**: Vercel at `dashboard-hwc.vercel.app`
- **Supabase**: `tvpirgeqvmdtbvnnjwlu.supabase.co`
