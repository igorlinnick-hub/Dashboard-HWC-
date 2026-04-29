# Handoff — Wellness BI Agency Dashboard

> PROJECT COMPLETE — v1.0 shipped 2026-04-08. Demo Mode wired end-to-end 2026-04-11.
> Layer 0+1 refactor (registry/orchestrator/adapters) shipped on `feature/registry-orchestrator` 2026-04-29.

## Layer 0+1 refactor — `feature/registry-orchestrator` branch

Goal: stabilize architectural boundaries before connecting real credentials and rewriting Meta/TikTok off Supermetrics. Plan: `.claude/plans/flickering-gliding-snail.md`. Architecture: `ARCHITECTURE.md`.

What changed:
- `data/route.ts`: 350 → 42 lines. All connector branching gone — route only parses params and delegates to orchestrator.
- New `lib/connectors/orchestrator.ts` (server-only): single dispatch — validate slug → load creds → mock-or-cache → adapter call → cache-set → error-normalize.
- New `lib/connectors/adapters.ts` (server-only): slug → ConnectorAdapter map.
- New `lib/connectors/transformers.ts`: slug → transformer map (used in mock-mode).
- New `modules/<7>/adapter.ts` × 7: pure functions `(creds, period) → ConnectorResponse | error`. Each ~20 lines. **Zero imports of `@/lib/supabase`, `@/lib/cache`, `next/server`.**
- New `modules/<7>/errors.ts` × 7: SDK-error-to-ConnectorErrorCode classifiers.
- `types/index.ts`: + AdapterInput/Output, ConnectorAdapter, OrchestratorInput/Output, ConnectorCredentialsRow.
- `lib/connectors/registry.ts`: untouched (kept client-safe — UI metadata only).
- `package.json`: + `server-only` dependency (marker, prevents adapters bundling into client).

Verified locally:
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → success.
- Adapter isolation lint: 0 violations across all 14 module files.

Pending verification (blocked on Supabase env vars from agency owner):
- Behavioural parity test on Demo Mode (each of 7 connectors must return identical JSON before/after).
- Cache round-trip with a real test key (Stripe sk_test_ already shared).

Behaviour change to flag (sole intentional regression):
- If a `connector_credentials` row has `is_connected=true` but the required field is empty (e.g. api_key blank), the old route silently returned a "transformed mock" answer. The new adapters return `NOT_CONNECTED` instead so the UI can prompt a reconnect. Edge case — only triggers on a half-saved row.

## Known Bugs (next session)

- **Square credentials path bug** (was open): `data/route.ts` previously read `creds.access_token` / `creds.location_id` at top level vs `connect/route.ts` storing them in `extra_config`. **Fixed on this branch** — `square/adapter.ts` reads from `extra_config` directly.
- **Error message granularity** (was open): "Connection Timeout" banner fired for any API throw. Backend fixed on this branch (per-connector `errors.ts` classifiers return specific `INVALID_KEY` / `RATE_LIMIT` / `CONNECTION_TIMEOUT` / `UNKNOWN` codes). UI mapping landed on main (commit ea267f3 — error → reconnect onboarding banner).
- **TikTok still uses Supermetrics**: only Supermetrics-dependent connector left after Meta moved to Graph API. Reconnect UX surfaces the API error (commit ea267f3), but the underlying TikTok fetcher should be rewritten on TikTok Ads API.
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
