# Wellness BI — Agency Dashboard

## Project Context
- Agency BI Dashboard for medical/wellness clinics (USA market)
- Multi-client architecture: one dashboard serves multiple clinic clients
- Stack: Next.js 14 (App Router), TypeScript, Supabase Auth + DB, Tailwind CSS, SWR, Recharts
- Deployed on Vercel, repo: `igorlinnick-hub/Dashboard-HWC-`
- Supabase project: `tvpirgeqvmdtbvnnjwlu.supabase.co`

## Architecture Rules

### Modular Monolith
- Each connector lives in `modules/<name>/` with `types.ts`, `fetcher.ts`, `transformer.ts`
- Modules NEVER import from each other
- All external API calls go through `/api/` routes only — no direct API calls from client components

### Registry Pattern
- `lib/connectors/registry.ts` is the single source of truth for all connectors
- Adding a new connector = adding one object to the CONNECTORS array
- `lib/connectors/icons.ts` maps slugs to Lucide icons
- `lib/connectors/mock-data.ts` provides realistic fallback data

### Data Flow
- Client components use SWR to fetch from `/api/` routes
- API routes read credentials from Supabase `connector_credentials` table
- If real credentials exist, route calls the module fetcher → transformer
- If no credentials, route returns mock data
- Every module returns a standardized response shape

### Database
- `clients` — clinic records (id, name, slug, is_active)
- `connector_credentials` — per-client credentials (client_id, connector_slug, api_key, extra_config, is_connected)
- `dashboard_pages` — navigation pages

### UI
- Dark theme: #0A0A0A background, #111111 cards, #1A1A1A borders, #F97316 orange accent
- Lucide React for icons — NO emoji in UI
- CSS animations via Tailwind keyframes — no framer-motion (incompatible with Next.js 14)
- All components in `components/` organized by: `ui/`, `layout/`, `charts/`, `connectors/`

## Development Rules
- 0 TypeScript errors required after every change (`npx tsc --noEmit`)
- One task at a time — confirm done before moving to next
- Test with `npm run dev` after changes
- Commit and push only when requested
- `export const dynamic = 'force-dynamic'` on all GET API routes (prevent Next.js caching)
- Always read `HANDOFF.md` before starting any task — it tracks what's done, in progress, and known issues
- Always update `HANDOFF.md` after completing a task — move items to Completed, update In Progress and Known Issues
- Mark completed work clearly so other agents don't repeat it

## Current Status
- Auth: working (Supabase Auth, login/signup/signout)
- UI: complete dark theme redesign
- Connectors: 7 registered (bank, stripe, square, meta, yelp, tiktok, google-analytics)
- Stripe module: REAL API implementation ready
- Other 6 modules: mock data only (TODO: real API)
- Connect flow: works (save credentials → status updates)
- Disconnect flow: DONE — DELETE endpoint, confirm dialog, optimistic update, toast notification
- Error/Empty states: DONE — ErrorState (INVALID_KEY, CONNECTION_TIMEOUT, RATE_LIMIT, NOT_CONNECTED), EmptyState with Connect CTA, Toast component
- Client CRUD: DONE — Create (POST), Edit (PATCH), Delete (soft DELETE), shared form modal, optimistic UI
- Middleware auth: DONE — server-side via @supabase/ssr, protects all routes except /login, /signup, /api
- Universal data model: DONE — ConnectorResponse (metrics, timeseries, breakdowns), all 7 transformers return it, MetricCard accepts Metric type, 0 any types
