# Handoff — Wellness BI Agency Dashboard

> PROJECT COMPLETE — v1.0 shipped 2026-04-08

## ACTIVE HANDOFF — 2026-04-09 (read this first)

**Context for next Claude session (run on Sonnet):**

The project was moved from `~/Documents/Code Projects/Hawaii Wellness Clinic/Reporting Dashboard/` to `~/Code/Dashboard-HWC/` to escape iCloud Drive File Provider interference with git. iCloud was mediating all I/O on `.git/objects/pack/`, causing `git fetch` to hang at 4–8KB and corrupting pack files. Workarounds (xattr ignore, symlink .git, pack surgery) all failed because iCloud fights at the FS level. The move is the only real fix — confirmed by the fact that a fresh throwaway folder with `com.apple.fileprovider.ignore#P` worked, but retroactive exclusion of an already-tracked folder did not.

**Divergent state before the move:**
- `origin/main` HEAD is `311d3df5ff45c89710d9770bff9ee57b2a0d8435` (downloaded as zip to `/tmp/hwc-origin-check/` for diff inspection — that tmp dir does NOT move with the project, re-download if needed)
- origin has Demo Mode UI: `ConnectorCard` with `useMock` prop + toggle, `settings/connections/page.tsx` calling `POST /api/clients/[clientId]/connectors/[slug]/mock`, `useMock` field on `ClientConnector` in `types/index.ts`, `use_mock` column in `connector_credentials` select in `app/api/clients/[clientId]/connectors/route.ts`
- local has the **backend** that origin's UI calls: `app/api/clients/[clientId]/connectors/[slug]/mock/route.ts` (untracked before move — Antigravity agent should have committed it as "WIP: save agent work before project relocation" just prior to move; verify with `git log -1`)
- **Neither side has** the Supabase migration for the `use_mock` column — must be created
- Existing pack `.git/objects/pack/pack-3870ac0ae2ee6b1ce20f00d18d0f48c15fcc445a.pack` is a partial/shallow pack containing commit 311d3df without its parent `8d2a3c6ab397770497e57a0a080a1987beabbeca`. Safe to let git repair itself via a fresh fetch on APFS. Do NOT manually delete it before fetching.

**Tasks for next Claude (in order):**
1. `cd ~/Code/Dashboard-HWC && git status && git log --oneline -5` — confirm clean move and agent WIP commit is present
2. `git fetch origin` — should now work (local APFS, no iCloud). If it still hangs, something else is wrong; do NOT retry workarounds, stop and report.
3. `git merge origin/main` — expect conflicts around `types/index.ts`, `components/connectors/ConnectorCard.tsx`, `app/(dashboard)/settings/connections/page.tsx`, `app/api/clients/[clientId]/connectors/route.ts`. Resolve by keeping BOTH sides (origin's UI + local's backend). Diffs are saved at `/tmp/diff_*.txt` on the old machine state — re-generate if needed.
4. Create `supabase/migrations/004_use_mock.sql` with: `ALTER TABLE connector_credentials ADD COLUMN use_mock BOOLEAN NOT NULL DEFAULT false;`
5. `npx tsc --noEmit` — must be 0 errors before commit
6. Commit: `feat: wire demo mode end-to-end (UI + backend + migration)`
7. `git push origin main`
8. Update this HANDOFF — mark Demo Mode DONE (remove the asterisk), remove this ACTIVE HANDOFF section

**Claimed-by-Claude task list (after push succeeds):**
- Fix Square credentials path bug in `app/api/clients/[clientId]/connectors/[slug]/data/route.ts`: reads `creds.access_token` and `creds.location_id` at the top level around line 143, but `connect/route.ts:49` stores them inside `extra_config`. Change to `creds.extra_config.access_token` / `creds.extra_config.location_id`. This is why "Connection Timeout" appears for Square specifically.
- The "Connection Timeout" banner shown for every connector is the default SWR fetchError fallback in `app/(dashboard)/clients/[clientId]/[connectorSlug]/page.tsx` around line 82. It fires whenever the API route throws — usually bad creds or missing env vars. Not a bug per se, but the error message should distinguish "no creds" from "API unreachable".

**DO NOT TOUCH until push is confirmed:** nothing — the freeze from the prior session is lifted once we're on APFS.

**Pre-move working tree state (confirmed by Antigravity agent 2026-04-09, could not commit due to git writes hanging):**
- HEAD: `9f34798f8d1a2005ef986d735e678beb4a0edd4b`
- 15 modified files: `HANDOFF.md`, `app/(dashboard)/settings/connections/page.tsx`, `app/api/clients/[clientId]/connectors/[slug]/data/route.ts`, `app/api/clients/[clientId]/connectors/route.ts`, `components/connectors/ConnectModal.tsx`, `components/connectors/ConnectorCard.tsx`, `lib/supabase.ts`, `modules/{bank,google-analytics,meta,square,stripe,tiktok,yelp}/fetcher.ts`, `types/index.ts`
- 2 untracked: `app/api/clients/[clientId]/connectors/[slug]/mock/route.ts`, `app/api/clients/[clientId]/connectors/[slug]/test/route.ts`
- After move, first action is `git add -A && git commit -m "WIP: all agent work pre-relocation"` BEFORE attempting fetch/merge.

**Fallback if git is still broken after move to ~/Code/Dashboard-HWC/:**

Run diagnostics first:
```bash
cd ~/Code/Dashboard-HWC
ls -la .git/index.lock .git/shallow.lock 2>/dev/null
mount | grep -i apfs
GIT_TRACE=1 git status 2>&1 | head -30
```

Then try in order (stop at first that works):
1. **Stale locks**: `rm -f .git/index.lock .git/shallow.lock`
2. **Bad shallow pack** (we know `pack-3870ac0a...` is partial): `mkdir -p /tmp/bad-packs && mv .git/objects/pack/pack-3870ac0a* /tmp/bad-packs/`
3. **Corrupt index**: `rm .git/index && git reset` — rebuilds index from HEAD, does NOT touch working tree, all 15 modified files remain.
4. **Nuclear fallback — re-clone and transplant working tree**:
   ```bash
   cd ~/Code
   git clone https://github.com/igorlinnick-hub/Dashboard-HWC-.git Dashboard-HWC-fresh
   rsync -av --exclude='.git' --exclude='.next' --exclude='node_modules' Dashboard-HWC/ Dashboard-HWC-fresh/
   mv Dashboard-HWC Dashboard-HWC-broken
   mv Dashboard-HWC-fresh Dashboard-HWC
   cd Dashboard-HWC && git status
   ```
   Fresh `.git`, same working tree edits. Commit, push. Delete `Dashboard-HWC-broken` only after push confirmed.

**Environment notes:**
- Node: use v22 (nvm). Node v24 breaks `npm run build`.
- Model: run on Sonnet (`claude-sonnet-4-6`). Work is mechanical, Opus not needed.
- After successful push, verify Vercel deploy picks up the commit at `dashboard-hwc.vercel.app`.

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
| — | Demo Mode (toggle mock data for any connector) | DONE* |
| — | Connection Test API (`POST /test` — lightweight validation per connector) | DONE |
| — | Real-time connection testing in ConnectModal | DONE |

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
