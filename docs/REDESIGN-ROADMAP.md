# REDESIGN-ROADMAP.md — Master Next-Steps Plan

> Phased plan for the EMPEÑALO redesign. Source-of-truth for what's done, what's in flight, what's planned, in what order, with what risks.
>
> Last updated: 2026-05-19.

---

## Where we are right now

### Stack (confirmed)

- TanStack Start (SSR React 19) + TanStack Router (file routes)
- Vite 7 via `@lovable.dev/vite-tanstack-config`
- Tailwind v4 CSS-first (`src/styles.css`)
- Supabase (Auth + Postgres + Storage)
- Culqi (demo-fallback when keys absent)
- Netlify deploy (production: `empenalo.netlify.app`)
- Bun 1.3.13 package + dev server

> Historical note: `docs/ARCHITECTURE.md` still references Cloudflare Workers in the older sections. This is stale — production migrated to Netlify after PR #11 (Node 22 runtime fix). Architecture doc needs the topology block updated.

### Schema (live)

Migrations applied through `0005_storage_gc.sql`:

- `0001_init.sql` — base schema (profiles, businesses, solicitudes, propuestas, operations, plans, subscriptions).
- `0002_handle_new_user.sql` — signup trigger auto-creates profile / business / trialing subscription.
- `0003_billing.sql` — invoices, `change_subscription_plan`, `reset_period_usage`, `record_invoice`, `increment_propuestas_used`.
- `0004_production_schema.sql` — production hardening: `audit_logs`, `business_members`, enriched profiles/businesses/solicitudes, RLS subselect rewrite, private bucket, statement timeouts.
- `0005_storage_gc.sql` — orphan-photo GC (`gc_orphan_storage`, `find_orphan_photos`, `expire_stale_rows`).

### Branches

- `main` — production. Last commit: post-Node-22 runtime fix.
- `develop` — integration branch (PRs land here first).
- `feat/ui-ux-improvements` — current working branch. Already shipped:
  - Auth back-arrow on `/app/*` and `/negocio/*` login/register.
  - Correo/DNI tab toggle (DNI disabled — "en desarrollo").
  - Forgot-password flow (`/app/forgot-password`, `/negocio/forgot-password`).
  - Premium auth redesign (logo panel, green accents, grid layout) — `1418832`.
  - Phone-frame removal on auth screens — `8364ada`.
  - Business proposal flow perf — `19b5395`.
  - Password recovery repair — `5d8228b`.

### Docs created this session

- `docs/PRODUCT.md` (new)
- `docs/BILLING.md` (new)
- `docs/SCALABILITY.md` (new)
- `docs/UI-UX.md` (new)
- `docs/DESIGN-SYSTEM.md` (new)
- `docs/TESTING.md` (new)
- `docs/SEEDER.md` (new)
- `docs/REDESIGN-ROADMAP.md` (this file)

Pending updates this session:

- `.claude/CLAUDE.md` — wire new doc index.
- `docs/API.md` — add planned monetization endpoints (post-0006).
- `docs/ARCHITECTURE.md` — fix Cloudflare → Netlify, add commission/featured topology.
- `README.md` — refresh stack table + link new docs.
- `handoff.md` — log this session.

---

## Phases (do in order)

### Phase 1 — Documentation foundation [this session]

**Goal**: future Claude sessions have full project context loaded via `.claude/CLAUDE.md` without re-reading from scratch.

Status: in flight (this PR).

Output:

- 8 new/updated docs above.
- CLAUDE.md doc index expanded.

Done definition:

- `bun run lint` passes (docs change only).
- New docs cross-link consistently.
- Handoff updated.

---

### Phase 2 — Schema upgrade: `0006_monetization.sql`

**Goal**: land full Etapa 1 monetization (commission config + featured offers + payments ledger).

Source: `docs/redesign documents/0002_monetization.sql` (in-repo reference) — adapt to current numbering.

Files:

- `supabase/migrations/0006_monetization.sql` (new).
- `src/lib/db/types.ts` — regenerate via `supabase gen types typescript`.

Changes:

- Extend `plans` with `monthly_featured_credits`, `max_sucursales`, `max_users_per_sucursal`, `realtime_notifications`, `dashboard_tier`, `monthly_reports`, `support_tier`, `account_manager`.
- Update plan seed rows: map `free` / `starter` / `pro` / `unlim` slugs with full capability matrix.
- Extend `subscriptions` with `featured_credits_used_this_period`, `payment_gateway`, `gateway_customer_id`, `gateway_subscription_id`.
- **New tables**: `commission_config`, `featured_offers`, `payments`, `commissions`.
- **New RPCs**: `compute_commission`, `boost_propuesta`, extended `accept_propuesta` that writes commission rows.
- **New view**: `v_active_featured_propuestas`.
- **RLS**: all new tables enabled + scoped policies.

Decisions to lock BEFORE writing migration:

- [ ] Final commission rate per plan slug (3% default? per-plan overrides?).
- [ ] Boost prices in soles (S/9 / S/15 / S/20?).
- [ ] Plan slug naming: keep current `basico/intermedio/avanzado` (DB) and add new `free/starter/pro/unlim`? Or rename? Renaming means data migration + UI map update.

Risks:

- Plan-slug rename breaks existing subscriptions if not handled with backfill.
- `compute_commission` is `STABLE` — must verify it doesn't run inside an RLS policy (perf hit).
- `accept_propuesta` extension changes signature: now returns `(operation_id, redemption_code, commission_pen)`. Existing service code (`src/services/propuestas.ts`) must be updated in same PR.
- `solicitudes.category` CHECK still narrow. Either widen here or move category surface to jsonb in same migration.

Verification:

- `npx supabase@latest db push` succeeds.
- `SELECT compute_commission(1000, 'celular', 'free')` returns 30.00.
- `SELECT * FROM plans WHERE slug='unlim'` shows `featured_credits=30`, `propuestas=NULL`.
- `accept_propuesta` writes a row in `commissions`.

Estimated effort: **1 session**, but blocked on locked decisions above.

---

### Phase 3 — Seeder rewrite

**Goal**: `scripts/seed.ts` exercises every Etapa 1 feature including post-0006 monetization.

Source: `docs/SEEDER.md` spec.

Files:

- `scripts/seed.ts` — rewrite (delete current, replace).
- `scripts/seed-reset.ts` (new) — drops demo data safely.
- `scripts/seed-verify.ts` (new) — row-count + relationship assertions.
- `scripts/seed-data/*` (new) — split by domain (users, businesses, solicitudes, propuestas, operations, featured, commissions, constants).

Dependencies:

- Phase 2 must merge first (commission + featured tables required).
- Schema decision on `solicitudes.category` widening (or jsonb migration) must land.

Verification:

- `bun run seed` runs cleanly on a fresh DB.
- All accounts in `TESTING.md` can sign in.
- `bun run scripts/seed-verify.ts` exits 0.
- 30+ solicitudes across all 11 categorías visible.
- ≥3 featured propuestas + ≥3 commission rows.

Estimated effort: **1–2 sessions**.

---

### Phase 4 — UI/UX redesign per `MODIFI-EMPENA.md`

**Goal**: ship all screen-level changes from the requirements doc.

Source: `docs/UI-UX.md` (full spec).

Sub-phases (can ship independently):

**4.1 — Landing**

- Remove "<30 min" promise.
- Counters → 0.
- Copy: "múltiples ofertas".
- Hide the highlighted Lovable section.

**4.2 — Cliente register/login completion** (extend `feat/ui-ux-improvements`)

- DNI-first ordering (per `MODIFI-EMPENA.md` Option 2).
- Remove DNI photo upload affordance.
- Wire OAuth (Google) completion view.
- Build `/app/reset-password` confirmation page.

**4.3 — Negocio register**

- Add DNI representante field.
- RUC verification scaffold (manual Etapa 1).
- Per-day business hours.
- "48 horas hábiles" copy.

**4.4 — Vista cliente**

- Web-format dashboard.
- Empty state copy.
- Counters start at 0.

**4.5 — Publicar artículo**

- Per-category form fields (11 categorías).
- "Opciones avanzadas" — keep expected amount, add "Otros" manual days in plazo.
- Sticky summary on desktop.

**4.6 — Publicación activa + comparación**

- Web-format table/grid.
- Filter pills (mayor monto / menor tasa / mayor plazo).
- Featured badges + ordering (post-0006).
- Code-verification screen polish.

Estimated effort: **3–5 sessions** across sub-phases.

Risks:

- Per-category schemas (`src/lib/categories/`) don't exist yet — must scaffold the framework alongside first category.
- Real RENIEC / SUNAT integration parked for Etapa 2 — must keep "en desarrollo" UX honest.

---

### Phase 5 — Tests

**Goal**: hit ≥50% coverage on services + critical UI flows.

Source: `docs/TESTING.md`.

Files:

- `tests/services/*.test.ts` — Vitest unit tests for `src/services/*`.
- `tests/lib/*.test.ts` — `cache.ts`, `rate-limit.ts`, `photos.ts`, `logger.ts`.
- `tests/e2e/*.spec.ts` — Playwright for 8 core QA flows in `TESTING.md`.
- `tests/billing/*.test.ts` — integration tests per `BILLING.md` matrix (post-0006).

Estimated effort: **2–3 sessions**.

---

### Phase 6 — Production polish

**Goal**: ready to flip live billing keys and onboard pilot negocios.

Tasks:

- Add `SUPABASE_SERVICE_ROLE_KEY` to Netlify env vars (signup trigger + signed URLs depend on it).
- Wire `CULQI_SECRET_KEY` + `CULQI_WEBHOOK_SECRET` + `VITE_CULQI_PUBLIC_KEY`.
- Test Culqi webhook end-to-end on a staging plan.
- Sentry wire-up.
- PostHog wire-up + cookie consent banner.
- Privacy + Terms pages (Spanish, Ley 29733 compliant).
- Sitemap + robots.txt + OG tags (light + dark variants).
- Lighthouse audit (target >85 mobile, >95 desktop).
- Manual security pass: secrets audit, headers (CSP, HSTS), CORS allowlist.
- Verify pg_cron schedules (`gc-orphan-storage` daily, `reset_period_usage` daily).
- Pilot: 3 verified negocios seeded in 1 district.

Estimated effort: **2 sessions**.

---

## Cross-cutting concerns

### Files NEVER touch without asking (per `.claude/CLAUDE.md`)

- `vite.config.ts` — Lovable wrapper + Netlify plugin.
- `src/ui/primitives/*` — shadcn-generated; full set present.
- `src/router.tsx` — QueryClient already correct.
- `src/start.ts`, `src/server.ts` — SSR error plumbing.
- `src/routeTree.gen.ts` — auto-generated; commit changes, don't hand-edit.

### Decision log (must ADR before code)

- Final pricing per plan tier (S/ per month).
- Commission rate per plan slug.
- Boost prices in soles.
- Plan slug naming (rename vs add aliases).
- Solicitudes category model (widen CHECK vs jsonb subcategory).
- Free trial period + annual discount.
- Refund policy for mid-period cancellation.
- Propuestas: sealed-bid vs visible across negocios?
- DNI verification gating (required vs optional to publish).

### Tech debt acknowledged

1. Single Postgres DB — needs read replicas at ~50K negocios.
2. Synchronous Realtime fan-out — past 5K concurrent.
3. JSONB `detalles_categoria` (planned) — at 100K+ solicitudes, slow.
4. Manual business verification — 50/day ceiling.
5. `audit_logs` single growing table — at 100M rows, partition.
6. In-memory cache + rate-limit — needs Upstash at Etapa 1.
7. Stripe fallback parked — Culqi-only for Peru.
8. RENIEC / SUNAT real integration parked for Etapa 2.

### Etapa 1 launch checklist (high level)

- [ ] Auth flows complete (cliente + negocio + password reset + DNI scaffolding).
- [ ] All 11 categorías publish-able.
- [ ] Negocio receives + sends propuesta.
- [ ] Accept propuesta → operation w/ code + commission recorded (post-0006).
- [ ] Operation pickup flow + completion.
- [ ] Plans seeded; subscription required for negocio activation post-verification.
- [ ] Culqi live mode wired, webhook signed + idempotent.
- [ ] Featured offers (boost) functional: credits + buy-more (post-0006).
- [ ] Commission config seeded + admin tooling to add/deactivate (post-0006).
- [ ] Monthly invoice generation (manual Etapa 1).
- [ ] All RLS audited (no public table without policy).
- [ ] Sentry + PostHog wired.
- [ ] Light + dark theme working + persisted.
- [ ] Sitemap + robots.txt + OG tags.
- [ ] Privacy + Terms pages.
- [ ] Cookie banner.
- [ ] Orphan-storage GC + period-rollover crons running.
- [ ] Lighthouse score >85 mobile, >95 desktop.
- [ ] Manual security pass.
- [ ] ≥3 verified pilot negocios seeded in 1 district.

---

## Quick-reference: what each doc is for

| Doc                          | What it answers                                             |
| ---------------------------- | ----------------------------------------------------------- |
| `PRODUCT.md`                 | "Is this in scope?" — actors, plan matrix, success criteria |
| `BILLING.md`                 | "How does commission / subscription / featured offer work?" |
| `UI-UX.md`                   | "What does this screen do / say / validate?"                |
| `DESIGN-SYSTEM.md`           | "What color / size / motion token do I use?"                |
| `ARCHITECTURE.md`            | "How is the system wired?"                                  |
| `API.md`                     | "What's the signature of this server fn / RPC?"             |
| `SCALABILITY.md`             | "Will this hold to Etapa 2?"                                |
| `TESTING.md`                 | "How do I verify this works?"                               |
| `SEEDER.md`                  | "How does the demo data work?"                              |
| `REDESIGN-ROADMAP.md`        | "What's done / in flight / planned?" (this file)            |
| `.claude/CLAUDE.md`          | Master hard-rules + doc index                               |
| `.claude/rules/emp rules.md` | Project architecture + workflow specifics                   |

---

**Maintained by**: Richard (solo). Update at the end of every session with what shipped and what moved.
