# Architecture — Wellness BI Agency Dashboard

Boundaries and contracts. Implementation history lives in `HANDOFF.md`.

## Big picture

```
Browser
  └─> Next.js route (HTTP-only, ~40 lines)
        └─> Orchestrator (server-only)
              ├─> Registry (slug → metadata)            [client-safe]
              ├─> Adapters (slug → pure function)       [server-only]
              ├─> Cache (lib/cache.ts → Supabase)
              └─> Credentials store (Supabase)
                    └─> per-connector Adapter
                          └─> Fetcher → Transformer
```

## Module contract

Every connector exports an **Adapter** with the same signature:

```ts
type ConnectorAdapter = (input: {
  creds: ConnectorCredentialsRow;
  period: { from: string; to: string };
}) => Promise<
  | { status: 'ok'; data: ConnectorResponse }
  | { status: 'error'; code: ConnectorErrorCode; error: string }
>;
```

Adapter rules:
1. Pure function. No Supabase access, no cache reads/writes, no HTTP request/response.
2. Fails fast on missing credentials with `NOT_CONNECTED`.
3. Catches every exception from its fetcher; returns a classified `AdapterError`. Never throws.
4. Knows one external API only. One reason to change: that API.

## Orchestrator contract

`runConnector({ clientId, slug, period, refresh })` is the one entry point.

Pipeline:
1. **Validate** the slug exists in the registry.
2. **Load credentials** from Supabase.
3. **Mock-mode** when no credentials: run the connector's transformer on `mockConnectorData[slug]` and return.
4. **Cache check** (with `refresh=true` invalidating first).
5. **Dispatch** to the connector's adapter.
6. **Persist** successful responses in cache. Errors are never cached.
7. **Normalize** any uncaught throw into `code: 'UNKNOWN'`.

One reason to change: orchestration policy itself (TTLs, fallback rules, retry strategy when added).

## File map

| Layer | Path | Role |
|---|---|---|
| HTTP | `app/api/clients/[clientId]/connectors/[slug]/data/route.ts` | Parse params, call orchestrator, map status to HTTP code |
| Orchestrator | `lib/connectors/orchestrator.ts` | Server-only. Single dispatch |
| Adapter registry | `lib/connectors/adapters.ts` | Server-only. Slug → adapter |
| UI registry | `lib/connectors/registry.ts` | Client-safe. Slug → metadata for ConnectModal |
| Transformer registry | `lib/connectors/transformers.ts` | Slug → transformer (used by mock-mode) |
| Cache | `lib/cache.ts` | Supabase-backed, per-connector TTL |
| Per-connector | `modules/<slug>/adapter.ts` | Pure: creds + period → response |
| Per-connector | `modules/<slug>/errors.ts` | SDK error → `ConnectorErrorCode` |
| Per-connector | `modules/<slug>/fetcher.ts` | Talks to the external API |
| Per-connector | `modules/<slug>/transformer.ts` | Raw → `ConnectorResponse` |

## Adding a new connector

1. Create `modules/<slug>/{fetcher,transformer,types,adapter,errors}.ts`. Adapter wires fetcher → transformer and routes errors through your classifier.
2. Add the metadata entry to `CONNECTORS` in `lib/connectors/registry.ts`.
3. Add the adapter import to `lib/connectors/adapters.ts`.
4. Add the transformer entry to `lib/connectors/transformers.ts`.

`data/route.ts` and `orchestrator.ts` are not touched.

## Layered upgrades planned

- **Layer 2** (next): rewrite `modules/meta` and `modules/tiktok` off Supermetrics onto the direct Graph and Marketing APIs. Split each `fetcher.ts` into `config.ts` (env + app params) + `client.ts` (HTTP transport) so the adapter remains untouched.
- **Layer 5** (later): wrap adapters with resilience decorators (retry with backoff, circuit breaker, observability metrics).

## Boundaries we don't cross in this etap

- Supabase migrations and RLS policies.
- Auth middleware and session handling.
- UI components (charts, ConnectModal, layout).
- White-labelling, billing, multilingualism.
