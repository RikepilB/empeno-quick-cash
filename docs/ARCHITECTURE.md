# EMPEÑALO — Architecture

> Reference for DB, cache, realtime, infrastructure decisions. Pairs with `SCALABILITY.md`.
> **Last updated**: 2026-05-18

---

## Stack

| Layer         | Technology                            | Notes                                                              |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Frontend      | React 19 + TypeScript + Vite 7        | Vite via `@lovable.dev/vite-tanstack-config`                       |
| Full-Stack    | TanStack Start + TanStack Router      | SSR, file-based routing, `createServerFn`                          |
| Styling       | Tailwind CSS v4 + Radix UI primitives | Design tokens in `src/styles.css`                                  |
| Data Fetching | TanStack Query                        | Router context in `src/router.tsx`                                 |
| Validation    | Zod + React Hook Form                 | Input validation on every server fn                                |
| Auth          | Supabase Auth (email/password)        | JWT in httpOnly cookies via `@supabase/ssr`                        |
| Database      | Supabase Postgres                     | RLS on every public table                                          |
| Storage       | Supabase Storage                      | Private bucket `solicitud-photos`, signed URLs                     |
| Cache         | In-memory Map (`src/lib/cache.ts`)    | Swappable to Upstash Redis                                         |
| Rate Limit    | In-memory (`src/lib/rate-limit.ts`)   | Per-user sliding window                                            |
| Payments      | Culqi (Peru)                          | Demo-fallback when keys absent                                     |
| Logging       | Structured JSON (`src/lib/logger.ts`) | `sanitizeError()` for user-safe messages                           |
| Deploy        | Netlify                               | `@netlify/vite-plugin-tanstack-start`, site `empenalo.netlify.app` |
| Package       | Bun 1.3.13                            | `bun dev` (port 8080), `bun run build`                             |
| Testing       | Playwright (E2E)                      | Auth + critical paths verified                                     |

---

## Module Boundaries

```
src/routes/       → calls src/services/     (thin — validate, call, render)
src/services/     → calls src/lib/db/       (createServerFn + Zod + sanitizeError)
src/lib/db/       → Supabase client factories (no business logic)
src/lib/          → pure utilities (cache, logger, rate-limit, photos, payments)
src/ui/           → presentational + layout shells (no data fetching)
```

### Server function pattern

```typescript
export const myAction = createServerFn({ method: "POST" })
  .inputValidator(zodSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    // Rate limit
    const rl = await rateLimitByUser("action", user.id, 10, 3600);
    if (!rl.allowed) throw new Error("Demasiados intentos.");
    // Query
    const { error } = await supabase.from("table").insert({ ...data });
    if (error) throw sanitizeError(error, "Error al procesar.");
    return { ok: true };
  });
```

---

## Data Model (11 tables)

| Table              | Purpose                                         | Key constraints                                               |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------- |
| `profiles`         | 1:1 with `auth.users`                           | FK `auth.users`, RLS: self-only, UNIQUE(doc_type, doc_number) |
| `businesses`       | One per pawn shop                               | FK `profiles(owner_id)`, RLS: owner or verified read          |
| `business_members` | Multi-user per business                         | FK `businesses` + `auth.users`, roles: owner/admin/cashier    |
| `plans`            | Subscription tiers (Básico/Intermedio/Avanzado) | Public read                                                   |
| `subscriptions`    | Active sub per business                         | Partial unique index, period tracking                         |
| `solicitudes`      | Client pawn requests                            | RLS: client owns all, businesses read active                  |
| `solicitud_photos` | Photo metadata                                  | FK `solicitudes`, RLS: owner or authenticated read            |
| `propuestas`       | Business offers                                 | FK `solicitudes` + `businesses`, UNIQUE per pair              |
| `operations`       | Accepted propuestas with redemption codes       | FK `propuestas` UNIQUE, code UNIQUE                           |
| `invoices`         | Billing records                                 | FK `businesses` + `subscriptions`                             |
| `audit_logs`       | Append-only event log                           | Service-role only, no user policies                           |

---

## Authentication & Authorization

- **Dual-portal**: `/app/*` (clientes, mobile-first), `/negocio/*` (negocios, desktop)
- **Route guards**: `beforeLoad` → `getCurrentUser()` server fn → redirect if wrong role
- **RLS enforcement**: Even if client bypasses the UI, database rejects unauthorized reads/writes
- **Service-role**: `getSupabaseAdmin()` in `src/lib/db/admin.ts` — server-only, never browser
- **RLS performance**: `(select auth.uid())` subselect wrapping on all policies

## Storage

- Bucket `solicitud-photos` is **PRIVATE**
- Photos served via `buildSignedPhotoUrl()` → 1h expiry signed URLs
- Orphan GC via `gc_orphan_storage()` job (daily 3 AM UTC)
- Upload pattern: user uploads to `{userId}/{uuid}.{ext}`, server generates signed URL on read

## Database Discipline

- Migrations: additive only, `NNNN_description.sql`, push via `npx supabase@latest db push`
- RLS: every `public` table enabled + at least one policy
- Indexes: all FKs indexed, composite indexes on filtered query columns
- Triggers: `updated_at` via `set_updated_at()` on all tables
- Pooling: use Supabase transaction pooler (port 6543) for serverless

---

## Responsive Breakpoints

Per `UI-UX.md` and `DESIGN-SYSTEM.md`:

```css
/* Mobile-first: tailwind defaults */
sm:  640px   /* tablet portrait */
md:  768px   /* tablet landscape */
lg:  1024px  /* desktop */
xl:  1280px  /* desktop wide */
```

- Mobile (<768px): single-column, bottom tab bar, 48px touch targets, `100dvh`
- Tablet (768-1023px): 2-col grids, inline nav, modal overlays
- Desktop (≥1024px): multi-column, data tables, sticky panels, hover states
- Auth screens: centered card max-w-[480px] — **NO phone frame wrapper on desktop**

---

## Etapa Milestones

### Etapa 1 — Prototype (Current)

- [x] Auth flows (cliente + negocio)
- [x] Solicitudes CRUD with photos
- [x] Propuestas send + compare + accept
- [x] Operation flow with redemption codes
- [x] Subscription plans + demo billing
- [x] Rate limiting + error sanitization + structured logging
- [x] Audit logs + storage GC + RLS hardening
- [x] Responsive web (mobile-first)

### Etapa 2 — Beta

- [ ] Real Culqi payments
- [ ] Turnstile captcha on public mutations
- [ ] Upstash Redis for caching + rate limits
- [ ] Background jobs (notifications, email via Resend)
- [ ] Image optimization (Supabase Transformations)
- [ ] Admin panel for verification

### Etapa 3 — Scale

- [ ] Native mobile app (React Native/Expo)
- [ ] Read replicas + materialized views
- [ ] Elasticsearch for marketplace search
- [ ] Push notifications (FCM/APNs)
- [ ] Soc 2 / compliance

---

**See also**: `PRODUCT.md`, `SCALABILITY.md`, `API.md`, `UI-UX.md`, `DESIGN-SYSTEM.md`
