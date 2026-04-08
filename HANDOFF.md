# Handoff — Wellness BI Agency Dashboard

> PROJECT COMPLETE — v1.0 shipped 2026-04-08

## All Chapters Done

| # | Chapter | Status |
|---|---------|--------|
| 1.1 | Middleware auth (server-side route protection via @supabase/ssr) | DONE |
| 2.1 | Universal data model (ConnectorResponse, Metric, TimeseriesPoint, BreakdownItem) | DONE |
| 4.1 | Stripe module (real API — 6 metrics, daily timeseries, top 5 products) | DONE |
| 6.1 | Google Analytics (OAuth + GA4 Data API — sessions, users, bounce rate, channels) | DONE |
| 7.1 | Bank via Plaid Sandbox (Plaid Link + balance + transactions + categories) | DONE |
| — | Square (Connect API — payments, refunds, daily/hourly aggregations) | DONE |
| — | Meta Ads (Supermetrics — Spend, Impressions, CTR, CPC, Campaigns) | DONE |
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

- `tsc --noEmit` -> **0 errors** (verified 2026-04-08, final)
- `npm run build` -> requires Node 18 or 20 (Node v24 incompatible with Next.js 14)

## Known Issues

- **Node.js v24**: `npm run build` fails with `ERR_INVALID_PACKAGE_CONFIG`. Use Node 18 or 20.
- **Stripe webhook**: stub only — no signature verification or event handling.

## Architecture Quick Ref

- **Modules**: `modules/<name>/` — types.ts, fetcher.ts, transformer.ts. Never cross-import.
- **Registry**: `lib/connectors/registry.ts` — single source of truth for connector metadata.
- **Data flow**: SWR -> `/api/` route -> check cache -> call module fetcher -> transformer -> ConnectorResponse
- **DB tables**: `clients`, `connector_credentials`, `dashboard_pages`, `cached_data`, `alerts`
- **Deploy**: Vercel at `dashboard-hwc.vercel.app`
- **Supabase**: `tvpirgeqvmdtbvnnjwlu.supabase.co`
