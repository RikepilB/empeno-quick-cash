# EMPEÑALO — Architecture & Scaling Plan

> **Purpose**: Living document describing the current system architecture, tech stack, data model, and scaling strategy from prototype to 10,000–20,000 active users.
> **Last updated**: 2026-05-17

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture & Tech Stack](#2-current-architecture--tech-stack)
3. [API & System Design](#3-api--system-design)
4. [Data Model Summary](#4-data-model-summary)
5. [Prototype Fitness Assessment](#5-prototype-fitness-assessment)
6. [Scaling to 10,000–20,000 Users](#6-scaling-to-1000020000-users)
   - 6.1 Latency
   - 6.2 Cache Usage
   - 6.3 Database
   - 6.4 Performance
   - 6.5 Usability (Developer Experience)
   - 6.6 Maintainability
   - 6.7 Scalability
7. [Should You Build a Separate Backend?](#7-should-you-build-a-separate-backend)
8. [Assessment Matrix](#8-assessment-matrix)
9. [Actionable Roadmap](#9-actionable-roadmap)

---

## 1. Executive Summary

**Empeñalo** is a two-sided marketplace connecting clients who want to pawn personal items with pawn shops (businesses) that make cash offers. The current stack is optimized for **speed of iteration** and **near-zero hosting cost**, making it ideal for an MVP/prototype. The architecture is a modern full-stack TypeScript application running on Cloudflare Workers at the edge, with Supabase (Postgres + Auth + Storage) as the primary backend-as-a-service.

**The core question this document answers**: *Is this stack sufficient for 10,000–20,000 users, and if not, what is the migration path?*

**Bottom line up front**:
- **Prototype (0–1k users)**: This stack is excellent. Do not rewrite.
- **Early growth (1k–5k users)**: Add caching, connection pooling, and background jobs. Still no rewrite needed.
- **Scale (10k–20k users)**: The runtime (Cloudflare Workers + TypeScript) is NOT the bottleneck. Postgres connection limits, missing cache layers, and background job processing become the constraints. A rewrite to Python/Java/PHP is **not required** if you invest in architecture. However, if you later need complex business logic (escrow, ML pricing, credit scoring), a dedicated backend becomes justified.

---

## 2. Current Architecture & Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite 7 | UI rendering, bundling, HMR |
| **Full-Stack Framework** | TanStack Start + TanStack Router | File-based routing, SSR, server functions (`createServerFn`) |
| **Styling** | Tailwind CSS v4 + Radix UI primitives | Component styling, accessible headless UI |
| **State / Data Fetching** | TanStack Query (React Query) | Client-side server-state caching, deduplication, refetching |
| **Forms & Validation** | React Hook Form + Zod | Type-safe form handling and schema validation |
| **Auth** | Supabase Auth (email/password) | JWT sessions, role-based access (`client` / `business`) |
| **Database** | Supabase Postgres | Primary datastore with Row Level Security (RLS) |
| **Storage** | Supabase Storage | Public bucket for solicitud photos |
| **Server Runtime** | Cloudflare Workers (Wrangler) | Edge SSR and server-function execution |
| **Package Manager** | Bun 1.3.13 | Fast installs and dev server |
| **Testing** | Playwright (E2E) | End-to-end auth and critical path verification |
| **Payments (planned)** | Culqi | Peru-native payment processor for subscription billing |

### Infrastructure Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ TanStack Router │  │  React Query    │  │ Supabase Client │ │
│  │ (file routes)   │  │ (client cache)  │  │ (browser)       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            │   SSR / Server Fn  │                    │ Direct DB
            │   (Cloudflare)     │                    │ calls
            ▼                    │                    ▼
┌──────────────────────┐         │         ┌──────────────────────┐
│  Cloudflare Worker   │─────────┘         │     Supabase         │
│  (TanStack Start)    │                   │  ┌────────────────┐  │
│                      │                   │  │   Postgres     │  │
│  ┌────────────────┐  │                   │  │   (RLS rules)  │  │
│  │ getCurrentUser │  │                   │  └────────────────┘  │
│  │ signOut        │  │                   │  ┌────────────────┐  │
│  │ (server-fns)   │  │                   │  │   Auth (JWT)   │  │
│  └────────────────┘  │                   │  └────────────────┘  │
│                      │                   │  ┌────────────────┐  │
│  ┌────────────────┐  │                   │  │ Storage (CDN)  │  │
│  │ getSupabaseServer│  │                 │  └────────────────┘  │
│  │ getSupabaseAdmin │  │                 └──────────────────────┘
│  └────────────────┘  │
└──────────────────────┘
```

### What the "Backend" Actually Is

There is **no custom REST API, no GraphQL, no tRPC layer**. Your backend is Supabase as a service:

- **Browser client**: `getSupabaseBrowser()` talks directly to Supabase from the client.
- **Server client**: `getSupabaseServer()` talks to Supabase inside `createServerFn` calls (cookie-aware).
- **Admin client**: `getSupabaseAdmin()` uses the service-role key for trusted server contexts (webhooks, backfills).

All business logic lives in one of three places:
1. **RLS policies** (e.g., `businesses_owner_all`, `propuestas_client_read`)
2. **Postgres RPC functions** (e.g., `accept_propuesta` — atomic proposal acceptance)
3. **Database triggers** (e.g., `handle_new_user` auto-creates profile/business/subscription)

---

## 3. API & System Design

### Data Flow

```
User Browser
    ├─► TanStack Router (file-based routes: /app/*, /negocio/*)
    ├─► React components (some still contain mock/hardcoded data)
    ├─► Supabase client (browser) ───────► Supabase (Auth + DB + Storage)
    └─► OR TanStack Start server-fn ─────► Cloudflare Worker ──► Supabase (server)
```

### Authentication & Authorization

- **Dual-portal architecture**:
  - `/app/*` — Client portal (individuals posting items to pawn)
  - `/negocio/*` — Business portal (pawn shops browsing and bidding)
- **Route guards**: `beforeLoad` hooks in `app.tsx` and `negocio.tsx` call `getCurrentUser()` server function.
- **Role enforcement**: Supabase RLS policies enforce row-level access at the database layer. Even if a client bypasses the UI, the database rejects unauthorized reads/writes.

### Current Gaps (Prototype State)

> ⚠️ **Critical**: As of the latest session, many routes are UI shells with hardcoded mock arrays (`app.dashboard.tsx`, `app.proposals.tsx`, `negocio.dashboard.tsx`). The database schema is fully designed and migrated, but Phase 3 (persisting real data to the UI) is still pending.

- No external API integrations yet (Culqi billing is Phase 4).
- No background job processor, message queue, or rate limiting.
- No server-side caching layer.
- No image optimization pipeline for uploaded photos.

---

## 4. Data Model Summary

The schema consists of 9 core tables with full Row Level Security:

| Table | Purpose | Key Constraints |
|---|---|---|
| `profiles` | 1:1 with `auth.users`, stores role + identity | FK to `auth.users`, RLS: self-only |
| `businesses` | One row per pawn shop | FK to `profiles(owner_id)`, RLS: owner or authenticated read |
| `plans` | Static subscription tiers (Básico, Intermedio, Avanzado) | Public read |
| `subscriptions` | Active subscription per business | Partial unique index: one active per business |
| `solicitudes` | Items posted by clients for pawn | RLS: client owns all, businesses with active sub can read active |
| `solicitud_photos` | Photo metadata for solicitudes | RLS: owner or authenticated read |
| `propuestas` | Offers from businesses on a solicitud | RLS: business owner all, client read + status update |
| `operations` | Created when client accepts a propuesta; holds redemption code | RLS: client or business read, business update |
| `storage.buckets` | Public bucket `solicitud-photos` for images | Public read, authenticated upload/delete |

### Key Database Logic

- **`accept_propuesta` RPC**: Atomic function that marks a proposal accepted, expires siblings, closes the solicitud, and creates an operation row with a redemption code.
- **`handle_new_user` trigger**: Automatically creates a `profiles` row on signup. If role=`business`, also creates a `businesses` row and a trialing `subscriptions` row on the `basico` plan.

---

## 5. Prototype Fitness Assessment

**Verdict: This stack is excellent for a prototype/MVP.**

| Criterion | Assessment |
|---|---|
| **Speed of development** | ⭐⭐⭐⭐⭐ Supabase bundles Auth + DB + Storage. TanStack Start gives file-based routing and SSR out of the box. |
| **Cost** | ⭐⭐⭐⭐⭐ Cloudflare Workers free tier + Supabase free tier = near-zero hosting cost. |
| **Developer experience** | ⭐⭐⭐⭐⭐ TypeScript everywhere, instant HMR, single repo, no context switching between frontend and backend code. |
| **Security** | ⭐⭐⭐⭐ RLS is powerful, but complex policies can be hard to audit. Good for MVP. |
| **Performance (at low scale)** | ⭐⭐⭐⭐ Edge compute is fast; DB region mismatch is the only drag. |

**For proving the marketplace concept and onboarding your first 100–500 users, this stack is ideal.** Do not rewrite anything yet. Focus on shipping the missing persistence layer (Phase 3) and getting real user feedback.

---

## 6. Scaling to 10,000–20,000 Users

Scaling is not primarily about your *programming language* or *framework*. At this level, the bottleneck is almost always **data access patterns, caching, and database load**.

### 6.1 Latency

| Factor | Current State | Risk / Impact |
|---|---|---|
| **Edge compute** | Cloudflare Workers (global edge) | ✅ **Excellent**. Users hit a worker physically close to them. Cold starts are negligible. |
| **Database region** | `us-west-1` (Oregon) | ⚠️ **Moderate risk**. If users are in Peru, a round-trip to Oregon adds ~120–180ms per query. For a snappy mobile-first app, this is noticeable, especially for multi-query pages. |
| **No query caching** | Every request hits Supabase directly | ⚠️ As you scale, repeated queries (e.g., "list active solicitudes") compound latency. |

**Mitigation**:
- If staying on Supabase, request a read replica closer to South America when available, or evaluate moving the project to a nearer region.
- Add a Redis/Upstash cache in front of heavy read operations to reduce DB round-trips.
- Use Cloudflare's Cache API for immutable or slowly-changing data (plans, public business profiles).

### 6.2 Cache Usage

| Layer | Current | Needed |
|---|---|---|
| **Client (browser)** | TanStack Query provides deduplication and stale-while-revalidate. | ✅ Sufficient. Tune `staleTime` aggressively for list views. |
| **Server (Cloudflare)** | **None**. Every server function calls Supabase directly. | ⚠️ **Critical gap**. Add Redis/Upstash or Cloudflare KV for hot reads. |
| **Database** | Relies on Postgres buffer cache only. | ⚠️ No query-result cache. Consider `pgmemcache` or application-level caching. |

**Hot paths to cache at scale**:
- Browsing active solicitudes (marketplace feed)
- Business profile lookups
- Plan/subscription metadata
- Public-facing business listings

### 6.3 Database

Supabase Postgres is standard PostgreSQL. It can handle 10–20k registered users easily, but there are operational caveats:

| Feature | Assessment |
|---|---|
| **RLS policies** | Convenient for security, but complex `EXISTS` subqueries (checking subscriptions/business ownership) can degrade under load because they execute *per row* scanned. Monitor with `EXPLAIN ANALYZE`. |
| **Connection pooling** | Supabase provides PgBouncer. **You must use it**. Serverless functions (Cloudflare Workers) can exhaust direct connections quickly if you create a new client per request without pooling. |
| **Indexes** | Basic indexes exist (`status_created_idx`, `owner_id_idx`). As queries grow, you'll need composite indexes (e.g., `(status, district, created_at)` for filtered marketplace browsing). |
| **Read replicas** | Not available on the free tier. At scale, a read replica for dashboards and analytics is highly recommended. |
| **Storage (photos)** | Public bucket is fine, but ensure images are served via a CDN with transforms (Supabase Image Transformations or Cloudflare Images). Serving multi-MB originals to mobile users is a performance killer. |
| **Backups & PITR** | Enabled on Pro tier. Essential for production. |

### 6.4 Performance

| Factor | Assessment |
|---|---|
| **Compute (Cloudflare Workers)** | Scales to millions of requests. Your JS/TS runtime is NOT the bottleneck for I/O-bound workloads. |
| **Bundle size** | Vite + TanStack Start tree-shake well, but monitor as Radix + Recharts + Embla grow. Use `vite-bundle-analyzer` periodically. |
| **SSR maturity** | TanStack Start is pre-1.0. The custom `server.ts` wrapper for catastrophic SSR errors shows maturity concerns. At scale, framework bugs or breaking changes are a real operational risk. |
| **Image delivery** | No optimization pipeline currently. This will hurt mobile performance immediately. |

### 6.5 Usability (Developer Experience)

| Pro | Con |
|---|---|
| TypeScript end-to-end | TanStack Start is beta; breaking changes are likely before v1.0. |
| File-based routing is intuitive | Smaller plugin ecosystem than Next.js. |
| Tailwind + Radix = fast UI | Mock data still scattered across routes; needs cleanup. |
| Single repo = easy context | No clear service/repository abstraction; business logic bleeds into components. |

### 6.6 Maintainability

**Current risk: Medium-High.**

- **No data access abstraction**: Routes and components call `supabase.from(...)` directly. If you ever swap Supabase for a custom API, you must refactor dozens of files.
- **RLS as business logic**: Security rules are mixed with DB schema. As the team grows, understanding *why* a user sees a particular row requires reading SQL policies, not application code.
- **No API contract**: Frontend and backend are coupled via Supabase table shapes. Any schema change is a potential frontend breakage.
- **Test coverage**: Only E2E (Playwright) exists. No unit tests for server functions or RLS policies.

**What would help now**: Introduce a `services/` or `repositories/` layer. Even if it is a thin wrapper around Supabase calls, it makes future migration dramatically easier and centralizes query logic.

### 6.7 Scalability

| Axis | Current | Needed for 10–20k |
|---|---|---|
| **Concurrent users** | Unknown (prototype) | Cloudflare Workers = effectively infinite. The DB is the bottleneck. |
| **Data volume** | ~9 tables, light relations | Postgres handles millions of rows fine if properly indexed. |
| **Background jobs** | None | You need a queue for: Culqi webhooks, email notifications, expiring old propuestas, subscription renewal reminders. |
| **File storage** | Supabase Storage | Fine, but add image resizing/CDN. |
| **Multi-region** | Single DB in US-West | Consider read replica or edge caching if latency matters. |
| **Rate limiting** | None | Add to server functions to prevent abuse (e.g., brute-force login, spam proposals). |

---

## 7. Should You Build a Separate Backend?

**Short answer: Not yet — but you should prepare for it.**

### The Language/Runtime Is Not Your Bottleneck

Python (FastAPI/Django), Java (Spring Boot), PHP (Laravel), or Node.js (NestJS) are not inherently "stronger" than a well-architected TypeScript app on Cloudflare Workers for 10–20k users. Workers run on V8 isolates which are extremely fast for I/O-bound workloads (network requests to DB, auth, etc.).

**The real question is architecture, not language.**

### When a Dedicated Backend Is Justified

1. **Complex business logic**: If your marketplace grows to include escrow, dispute resolution, credit scoring, ML-based pricing, or regulatory compliance workflows, a dedicated backend with a mature ecosystem makes sense.
2. **Team growth**: If you hire backend engineers who prefer Django/Spring, a split codebase is better for team happiness and velocity.
3. **Mobile apps**: If you launch a native iOS/Android app, you need a real API. You cannot safely ship the Supabase client key in a native app with the same trust model (the key is semi-public).
4. **Strict compliance/auditing**: FinTech regulations often require application-layer audit logs, request signing, and immutable transaction records — harder to enforce purely in RLS.
5. **Vendor independence**: If you want to migrate off Supabase (e.g., to AWS RDS + Cognito, or a self-hosted stack), a custom API layer makes that migration painless.

### How Easy Is Migration Later?

**Medium effort — much easier if you prepare now.**

Because your data lives in **Supabase Postgres**, a new backend can simply connect to the same database (or a follower/replica) using an ORM (Prisma, SQLAlchemy, Hibernate, TypeORM).

**The hard part is the frontend refactor**:
- Today: `supabase.from("solicitudes").select(...)` inside React components.
- Tomorrow: `fetch("/api/solicitudes")` or a generated client.
- You also need to **replicate authorization** in the new backend (replacing RLS with middleware/guards).

**Recommended migration strategy (if triggered)**:

| Phase | Action |
|---|---|
| **A — Now** | Wrap all Supabase calls in a `services/` layer. Makes the swap a one-file change later. |
| **B — Later** | Build new API alongside existing Supabase direct access. Shadow-read to verify correctness. |
| **C — Gradual** | Move reads/writes from Supabase client to your new API, table by table. |
| **D — Retire** | Disable direct Supabase browser access for sensitive tables. Enforce API-only. |

---

## 8. Assessment Matrix

Rated 1–5 stars (⭐ = poor, ⭐⭐⭐⭐⭐ = excellent).

| Dimension | Current (Prototype) | At 10–20k Users | Notes |
|---|---|---|---|
| **Latency** | ⭐⭐⭐ | ⭐⭐⭐ | Edge compute is great, DB region is not optimal for Peru. Add cache. |
| **Cache Usage** | ⭐ | ⭐⭐⭐ | No server cache. Add Redis/Upstash or Cloudflare Cache API. |
| **Database** | ⭐⭐⭐ | ⭐⭐⭐ | Postgres is solid; RLS complexity and connection pooling need attention. |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Workers scale well. Image optimization and TanStack Start maturity are wildcards. |
| **Usability (DX)** | ⭐⭐⭐⭐ | ⭐⭐⭐ | Great for prototyping; maintainability degrades without a service layer. |
| **Maintainability** | ⭐⭐ | ⭐⭐ | Direct Supabase calls everywhere + RLS logic in SQL = tech debt. Abstract NOW. |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐ | Compute is fine. DB + background jobs need investment. |

---

## 9. Actionable Roadmap

### Phase 1: Now (Finish MVP — 0–500 users)

1. **Replace mock data** (Phase 3 in backlog). Wire all routes to real Supabase queries.
2. **Create a `services/` abstraction layer**. Even if thin, this is the single highest-ROI change for future migration.
   - `src/services/solicitudes.ts`
   - `src/services/propuestas.ts`
   - `src/services/businesses.ts`
   - `src/services/subscriptions.ts`
3. **Add a caching wrapper** in TanStack Query with sensible `staleTime` for list views.
4. **Image optimization**: Use Supabase Image Transformations or resize on upload to avoid serving 5MB originals to mobile.
5. **Complete open action items**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.dev.vars` and Wrangler secrets.

### Phase 2: Pre-Scale (1,000–5,000 users)

6. **Add a Redis/Upstash instance** (or Cloudflare KV / Cache API) for hot reads.
7. **Implement background jobs**: Use Cloudflare Queues, Inngest, or Supabase Edge Functions for async work:
   - Culqi webhook handling
   - Expiring old propuestas
   - Subscription renewal reminders
   - Email notifications
8. **Monitor DB performance**: Enable Supabase "Query Performance" insights. Optimize slow RLS policies with `EXPLAIN ANALYZE`.
9. **Add rate limiting** on critical server functions (login attempts, proposal creation).
10. **Connection pooling audit**: Ensure `getSupabaseServer()` uses the pooled connection string.

### Phase 3: Scale (10,000+ users)

11. **Evaluate DB read replicas** or a closer region if Supabase offers it.
12. **If justified, spin up a dedicated backend** (FastAPI / NestJS / Spring Boot). Your frontend swaps `services/*.ts` implementations.
13. **Migrate auth to Clerk** (already planned in backlog) for better social login, passkeys, and session handling at scale.
14. **Add observability**: Structured logging (Axiom/Logtail), error tracking (Sentry), and performance monitoring.
15. **Security hardening**: Penetration testing, dependency scanning, secrets rotation policy.

---

## Appendix A: Technology Comparison (If You Do Migrate)

If you later decide a dedicated backend is necessary, here is how common stacks compare for Empeñalo's workload:

| Stack | Pros | Cons | Best For |
|---|---|---|---|
| **Python + FastAPI** | Fast to write, great async support, huge ML/ecosystem | GIL limits true parallelism for CPU-heavy tasks | ML pricing, data science, rapid API development |
| **Python + Django** | Batteries included (ORM, admin, auth), mature | Monolithic, opinionated, slower than FastAPI for pure APIs | Teams that value convention over configuration |
| **Java + Spring Boot** | Battle-tested, excellent tooling, massive ecosystem | Verbose, slower development velocity, higher memory | Large teams, strict enterprise/compliance requirements |
| **PHP + Laravel** | Extremely productive, great ORM (Eloquent), vast hosting | Not ideal for long-lived connections/websockets | If your team knows PHP, or you want shared hosting |
| **Node + NestJS** | Same language as frontend, great async I/O, fast JSON | Single-threaded event loop can block on CPU | Teams wanting JS end-to-end, real-time features |

**Recommendation for Empeñalo (if migration happens)**: **FastAPI** or **NestJS**. FastAPI if you anticipate ML/data-heavy features. NestJS if you want to keep TypeScript everywhere and value a modular, enterprise-grade structure.

---

*End of document. Update this file after major architectural decisions or infrastructure changes.*
