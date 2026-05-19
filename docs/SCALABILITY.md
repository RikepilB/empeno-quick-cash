# EMPEÑALO — Scalability

> Prototype → Etapa 2 without rewrites. Pairs with `ARCHITECTURE.md` and `PRODUCT.md`.
> **Last updated**: 2026-05-18

---

## Sizing

| Stage                     | Active clientes | Active negocios | Solicitudes/day | DB rows (24mo) |
| ------------------------- | --------------- | --------------- | --------------- | -------------- |
| Prototype (private alpha) | 50              | 10              | 30              | <100K          |
| Etapa 1 (public beta)     | 5,000           | 100             | 500             | <5M            |
| Etapa 2 (beta+)           | 30,000          | 500             | 3,000           | <30M           |

Architecture holds to Etapa 2 without rewrites.

---

## Compute

### Current (Prototype)

- **Netlify** serverless functions via `@netlify/vite-plugin-tanstack-start`
- Free tier sufficient for prototype (<125K invocations/mo)
- Functions are stateless — all state in Postgres or in-memory cache

### Etapa 1 (Public Beta)

- Upgrade to Netlify Pro ($19/mo) at 1K daily active users
- Background jobs via `pg_cron` (already configured: GC, expiration)
- Consider Inngest free tier (50K runs/mo) for notification fan-out

### Etapa 2 (Growth)

- Vercel Cron / Inngest for durable background work
- Separate worker for email/notification dispatch
- ISR for public pages with on-demand revalidation

---

## Database

### Current

- **Supabase Free**: 500MB DB, sufficient for prototype
- Connection via transaction pooler (port 6543) for serverless
- All FKs indexed, composite indexes on hot paths (`category, status, created_at`)
- RLS with `(select auth.uid())` subselect wrapping
- `statement_timeout`: authenticated 30s, anon 10s
- `idle_in_transaction_session_timeout`: 60s

### Etapa 1 (Public Beta)

- **Supabase Pro ($25/mo)** the day real users sign up — PITR backups, no pausing, 8GB DB
- Monitor `pg_stat_activity` for connection leaks (>30% idle is a red flag)
- Audit slow RLS policies with `EXPLAIN ANALYZE`

### Etapa 2 (Growth)

- Read replicas for analytics queries
- Materialized views for leaderboards and aggregated stats
- Partial indexes only on hot paths — prune unused indexes quarterly
- Partitioning NOT needed before Etapa 3 (Postgres handles tens of millions of rows fine)

### DB region

- Current: `us-west-1` (Oregon). Latency from Lima ~120ms p50 — acceptable for prototype.
- Etapa 2: Evaluate Supabase South America (São Paulo) for ~30ms p50.

---

## Cache

### Current

- In-memory Map in `src/lib/cache.ts` — cache-aside with TTL
- Namespace: `emp:{resource}:{id}`
- Used for: profiles (5min), solicitudes feed (30s), operations status (1min)
- Money never cached write-behind (cache-aside read + direct write + post-commit invalidate)

### Etapa 1

- **Upstash Redis** (free 10K cmd/day → pay-as-you-go $5-15/mo at 5K MAU)
- Cache hit rate target: >70% for profile reads
- HTTP cache headers with `s-maxage` + `stale-while-revalidate`

### Etapa 2

- Cache warming on deploy for hot landing-page data
- Edge Config for feature flags (read latency <20ms globally)

---

## Storage

### Current

- Supabase Storage free (1GB + 2GB bandwidth/mo)
- Private bucket `solicitud-photos`, signed URLs only (1h expiry)
- Orphan GC via `gc_orphan_storage()` cron (daily 3 AM UTC)
- No image optimization yet — serve full-size originals

### Etapa 1

- Supabase Image Transformations for thumbnails (`?width=400&height=400`)
- Client-side compression to <500KB per photo before upload
- Staging prefix pattern: upload to `staging/`, move to canonical path on commit

### Etapa 2

- Cloudflare R2 (no egress fees) if volume exceeds Supabase Pro budget

---

## Rate Limiting & Security

### Current

- In-memory per-user sliding window (`src/lib/rate-limit.ts`)
- Solicitud create: 10/h, Propuesta create: 30/h, Propuesta accept: 10/h
- All write endpoints rate-limited

### Etapa 1

- **Upstash Redis** for distributed rate limits (in-memory doesn't share across function instances)
- **Turnstile** captcha on public mutations (signup, solicitud creation, password reset)
- Pen test before public beta ($3-8K USD)

---

## Cost Model (monthly USD)

| Item            | Prototype     | Etapa 1 (1K active) | Etapa 2 (10K active) |
| --------------- | ------------- | ------------------- | -------------------- |
| Netlify         | 0 (Free)      | 19 (Pro)            | 19 (Pro)             |
| Supabase        | 0 (Free)      | 25 (Pro)            | 50 (Pro + compute)   |
| Upstash         | 0 (in-memory) | 5                   | 15                   |
| Sentry          | 0             | 0                   | 26 (Team)            |
| Resend          | 0             | 0                   | 20                   |
| **Total fixed** | **$0**        | **$49**             | **$130**             |

---

## What CAN'T Scale Without Rework

1. **Single Postgres database** — at ~50K active negocios, need read replicas + separate analytics DB
2. **In-memory cache** — not shared across Netlify function instances; migrate to Upstash before Etapa 1
3. **Manual business verification** — labor-intensive past 50/day; need RUC API automation
4. **`audit_logs` as single table** — at 100M rows, needs partitioning by month
5. **All categories sharing one `solicitudes` table** — fine through Etapa 2 with proper indexes

---

## Scaling Principles

1. **Stateless application servers.** State goes to Postgres or Upstash.
2. **Idempotency keys** on mutations that cost money or send notifications.
3. **No business logic in DB triggers.** Use RPCs (security-definer functions).
4. **Cache invalidation at write time.** Don't rely on TTL alone.
5. **Migrations forward-only.** Never write a "down" migration.
6. **Money is never write-behind.** Cache-aside read + direct write + post-commit invalidate.

---

**See also**: `ARCHITECTURE.md`, `PRODUCT.md`, `performance.md` (Documentation folder)
