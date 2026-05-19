# SCALABILITY.md — Etapa 1 → Etapa 2 Architecture Plan

> How the system grows from prototype to beta without rewrites. Pairs with `ARCHITECTURE.md` and `BILLING.md`.

---

## Sizing assumptions

| Stage | Active clientes | Active negocios | Solicitudes/day | Propuestas/day | DB rows (24mo) | Platforms |
|---|---|---|---|---|---|---|
| Prototype (private alpha) | 50 | 10 | 30 | 90 | <100K | responsive web |
| Etapa 1 (public beta) | 5,000 | 100 | 500 | 1,500 | <5M | responsive web |
| Etapa 2 (beta+) | 30,000 | 500 | 3,000 | 9,000 | <30M | responsive web |
| Etapa 3 (scale) | 200K | 2,000 | 15,000 | 45,000 | <200M | + native mobile (RN/Expo) |

Architecture below must hold to **Etapa 2** without rewrites. Etapa 3 needs targeted rework (read replicas, separate audit DB, native app backend).

---

## Compute

### Prototype → Etapa 1

- **Netlify (current)** with `@netlify/vite-plugin-tanstack-start`. Starter tier holds prototype + low Etapa 1 traffic.
- Move to **Netlify Pro ($19/mo)** when >100K function invocations/mo or when build queue / preview-deploy SLAs matter.
- SSR via TanStack Start. Route-level dynamic only where needed.
- Server functions (`createServerFn`) replace traditional API routes — no separate REST layer to scale.

### Etapa 2 additions

- **Scheduled functions** (Netlify Scheduled Functions or Supabase pg_cron): orphan storage GC, subscription period rollover, expired solicitud sweep, commission reconciliation.
- **Background jobs**: when latency starts hurting webhook handlers, move heavy work to a queue. Options: Inngest free tier (50K runs/mo), or Supabase pg_boss. Pick when needed; don't add prematurely.
- **Background workers** (only if queue isn't enough): Railway / Render $5–10 service running a Node worker. Defer until proven necessary.

> **Stack note**: ARCHITECTURE.md historical text mentions Cloudflare Workers. That predates the Netlify migration. Current production is Netlify. Update any new doc accordingly.

---

## Database

### Prototype → Etapa 1

- **Supabase Free**: 500 MB DB, 1 GB storage, 5 GB bandwidth/mo, 50K MAU. Fine for prototype.
- **Supabase Pro ($25/mo)** the day real users land: PITR backups, no project pausing, 8 GB DB. Non-negotiable past private alpha.
- **Always connect via the transaction pooler** (port 6543) from Netlify serverless. Direct connections only for migrations.

### Indexes (current — see migrations 0001 / 0004)

- All FKs.
- Status columns filtered with WHERE (`idx_solicitudes_open` partial on `status='active' AND deleted_at IS NULL`).
- Composite `(category, status, created_at DESC)` for filtered marketplace browsing.
- Composite `(district, status)` for district feed.
- Partial `(status='pending')` on `propuestas` for business queries.

### Etapa 2 additions

- **Read replicas (Supabase Pro+)** for analytics queries. Negocio dashboards hit replica; marketplace transactional flow keeps primary.
- **Materialized views** for leaderboards, "top categorías", aggregated KPIs. Refresh hourly via pg_cron.
- **Partial indexes** on hot paths only — don't index everything. Prune via `pg_stat_user_indexes.idx_scan = 0` after 30d.
- **Partitioning**: not needed before Etapa 3. Postgres handles tens of millions of rows fine.

### Data residency

Prototype on Supabase US-East. Latency Lima → US-East ~120 ms p50 — acceptable. Move to **Supabase São Paulo** when crossing into Etapa 2 (~30 ms p50). Region migration is non-trivial; plan once.

---

## Cache

### Prototype (current)

- **In-memory cache** (`src/lib/cache.ts`) — Map-based cache-aside with TTL. Per-instance only.
- Cache hit rate target: **>70%** for profile reads.

### Etapa 1

- Cache survives function lifetime only. For Netlify, this is per-instance ephemeral — fine for hot loop locally but useless across instances.
- **Add Upstash Redis** when crossing the boundary where multi-instance cache coherence matters (typically ~1K MAU). Budget $5–15/mo. Hard cap via Upstash dashboard.
- Cache key convention: `emp:{resource}:{id}` (e.g., `emp:profile:{user_id}`).
- Add HTTP cache headers (`s-maxage` + `stale-while-revalidate`) on `/api/public/*` read-only endpoints.

### Etapa 2

- Cache warming on deploy for hot landing-page data.
- **Netlify Edge Functions or Supabase Edge Functions** for low-latency read paths (config, plans, feature flags).

### What to cache by TTL

| Data | TTL | Pattern | Notes |
|---|---|---|---|
| `profiles` lookup | 5 min | Cache-aside | Invalidate on update |
| `solicitudes` feed | 30 s | Cache-aside | Invalidate on realtime event |
| `operations.status` | 1 min | Cache-aside | Invalidate on update |
| **Money / billing** | **No cache** | Direct DB + cache-aside *read* post-commit | Never write-behind |
| Rate-limit counters | TTL-bound | Source of truth in Redis (Etapa 2) |  |

---

## Realtime

### Prototype

- **Supabase Realtime free tier**: 200 concurrent connections, 2M messages/mo.
- Channels:
  - `solicitud:{id}` — propuestas for a specific solicitud (cliente subscribes).
  - `business:{id}:feed` — new solicitudes matching this negocio's district / categorías.
  - `operation:{id}` — operation status updates.
- **Always filter server-side** via `postgres_changes` filters. Never subscribe to a whole table.

### Etapa 1 watchouts

- 200 concurrent hits fast: each user with 3 tabs = 3 connections.
- Audit `useEffect` cleanup. Drop subscriptions when component unmounts.
- Move to Supabase Pro at ~500 concurrent.

### Etapa 2 additions

- **Broadcast** for ephemeral signals ("X negocios viendo tu solicitud") — cheaper than DB-backed realtime.
- **Presence** for "is the negocio online now".

---

## Storage

### Prototype

- **Supabase Storage free**: 1 GB + 2 GB bandwidth/mo.
- Bucket `solicitud-photos`: **private**, signed URLs only via `buildSignedPhotoUrl()`.
- Client-side image compression target: <500 KB per photo (5 MB hard cap). Library: `browser-image-compression`.

### Etapa 1

- Supabase Pro $25 includes 100 GB storage / 200 GB bandwidth.
- **Orphan-photo GC cron** (`gc_orphan_storage` RPC, runs daily 03:00 UTC) — already wired in `0005_storage_gc.sql`. Verify cron is scheduled in Supabase.
- **Supabase Image Transformations** for thumbnails (`?width=400&height=400`) — saves significant bandwidth.

### Etapa 2

- If photo volume blows Supabase Pro budget, evaluate **Cloudflare R2** (no egress fees) with Supabase metadata.
- CDN: Supabase Storage is CDN-fronted — no extra config.

---

## Auth & sessions

### Prototype

- Supabase Auth: email + password (current).
- **Planned (Etapa 1)**: Google OAuth (per `MODIFI-EMPENA.md`). Apple deferred — iOS share in Peru is small early.
- **JWT in httpOnly cookie on web** — `@supabase/ssr` middleware handles refresh.
- **DNI scaffolding** (current `feat/ui-ux-improvements`): tab toggle visible, submit disabled, "en desarrollo" banner. Real RENIEC integration → Etapa 2.

### Etapa 2

- **MFA (TOTP)** for negocio accounts handling money. Supabase Auth supports it out of the box.
- **SAML / SSO** if a large franquicia negocio asks (Plan Pro). Supabase supports SSO on Team plan ($599/mo) — gate behind enterprise demand.
- **RENIEC integration** for cliente DNI auto-complete.
- **SUNAT integration** for negocio RUC verification (verify legal name + representante DNI).

---

## Notifications

### Prototype
- In-app only. `notifications` table RLS-scoped. Polling-based inbox.
- Realtime channel pushes new notifications.

### Etapa 1
- **Email** via Resend (free tier 3K/mo). Templates: business verified, propuesta received, propuesta accepted, operation completed.
- **WhatsApp** is the killer channel in Peru, but defer to Etapa 2 (WhatsApp Business API cost + approval non-trivial). Twilio sandbox for prototype if needed.

### Etapa 2
- **WhatsApp Business API** via Twilio or Meta directly. Critical for negocio engagement.
- **SMS (OTP only)** for verification via Twilio. **Never SMS for marketing.**
- **Push** (web push, then RN push at Etapa 2.5) via OneSignal free tier.

---

## Payments

### Prototype (current)
- Culqi (default Peru) live + demo. See `BILLING.md`.
- Subscriptions live (basico/intermedio/avanzado).
- Commissions + featured offers: **planned in `0006_monetization.sql`** — see `REDESIGN-ROADMAP.md`.

### Etapa 1 (post-0006)
- Full Etapa 1 monetization wired (subscriptions + commissions + featured boosts).
- Webhook handlers verify signatures, use idempotency keys.
- Hosted Culqi Checkout — PCI scope SAQ A.

### Etapa 2
- Auto-invoicing for commissions (manual in Etapa 1).
- Points wallet (`points_wallets` + `points_transactions`).
- Payouts to negocios for incentive points (wallet-only initially).
- Annual discount + free trial.
- Stripe fallback (international) — only when LATAM expansion ships.

---

## Observability

### Prototype
- Logger (`src/lib/logger.ts`): structured JSON + `sanitizeError`. Pino-style.
- Sentry — **not yet wired**. Plan: free tier 5K errors/mo at Etapa 1.

### Etapa 1
- **Sentry Team ($26/mo)** at >3K errors/mo.
- **PostHog free** (1M events) for product analytics. Cap per-product billing.
- **Better Stack free** (10 monitors).
- **Axiom free** (0.5 GB logs/mo). Upgrade when volume justifies.

### Etapa 2
- Real-time error alerting → Slack/Discord.
- Dashboards: API p95 latency, DB query p95, rate-limit hits, RLS denials.

---

## Security scaling

See `audit.md` (not yet in repo — `REDESIGN-ROADMAP.md` task) for the comprehensive policy.

Etapa 1 → 2 critical additions:
- **WAF / Bot protection**: Cloudflare in front of Netlify (or Netlify Edge Functions w/ rate gate). Add Turnstile / hCaptcha on public mutations.
- **Pen test** before Etapa 2 public beta — $3–8K USD with a regional firm.
- **Bug bounty** (HackerOne / Intigriti) at Etapa 2.5 once stable.
- **SOC 2** path when first enterprise pawn-shop chain asks (typically franquicia tier).

---

## Cost model (monthly USD, optimistic)

| Item | Prototype | Etapa 1 (1K active) | Etapa 2 (10K active) |
|---|---|---|---|
| Netlify | 0 (Starter) | 19 (Pro) | 19 (Pro) |
| Supabase | 0 (Free) | 25 (Pro) | 25 (Pro) + compute add-on ~25 |
| Upstash | 0 | 5 | 15 |
| Sentry | 0 | 0 | 26 (Team) |
| Resend | 0 | 0 (under 3K) | 20 |
| Culqi | 0 | revenue share | revenue share |
| Domain + email | 1 | 1 | 5 (workspace email) |
| **Total fixed** | **$1** | **$50** | **$110+** |

Variable (storage bandwidth, Upstash commands, Inngest runs) on top.

---

## What CAN'T scale without rework (acknowledged tech debt)

Write ADRs for these now:

1. **Single Postgres database** — at ~50K active negocios, needs read replicas + separate analytics DB. Rework ~1 month.
2. **Synchronous realtime fan-out for solicitudes** — past 5K concurrent negocios subscribing, Realtime CPU climbs. Migrate to broadcast + per-region channels.
3. **JSONB `detalles_categoria` (planned)** — at 100K+ solicitudes, JSONB querying gets slow. Migrate to per-category tables or extract top-3 searched fields to columns + GIN index.
4. **Manual business verification** — labor-intensive past 50/day. Need partial automation (RUC API + admin queue) or outsourced verification provider.
5. **`audit_logs` single growing table** — at 100M rows, partition by `occurred_at` month or move to cold-storage DB.
6. **In-memory cache + rate limit** — coherence breaks past single instance. Move to Upstash Redis at Etapa 1.

---

## Scaling principles (non-negotiables)

1. **Stateless application servers.** State → Postgres, Upstash, or Storage.
2. **Idempotency keys on every mutation that costs money or sends a notification.**
3. **No business logic in DB triggers.** They're invisible + hard to test. Use RPCs (`SECURITY DEFINER`) instead.
4. **One service, one purpose.** Don't bolt features onto handlers that should be queue jobs.
5. **Cache invalidation is a write-time concern.** Write path knows what to invalidate. Don't rely on TTL.
6. **Migrations are forward-only.** Never "down" migrations; restore from PITR.
7. **Realtime is push, not source of truth.** Reconcile on reconnect.

ADR before any change that violates one of these.

---

## Decision: upgrade vs optimize

Solo-dev rule of thumb:
- **<$50/mo infra** → optimize. Investigate cache hit rate, query plans, dead code.
- **$50–200/mo** → mix. Optimize hot paths, upgrade the bottleneck.
- **>$200/mo** → upgrade infra unless spend can be cut >50% in <1 week.

Time is the scarcest resource. Money buys time, not the other way around.

---

**See also**: `ARCHITECTURE.md`, `BILLING.md`, `PRODUCT.md`, `REDESIGN-ROADMAP.md`.
