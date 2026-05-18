# EMPEÑALO — Session Backlog

> **Purpose**: Living session log. Record every meaningful change, decision, bug fix, and architectural shift. Newest sessions at top.
> **Last updated**: 2026-05-17

---

## Status Snapshot

| Phase | Status | Notes |
|---|---|---|
| 0. Lovable scaffold | ✅ Done | Inherited from Lovable. UI-only, mock arrays everywhere. |
| 1. Supabase wiring + schema | ✅ Done | Migrations 0001 + 0002 applied to remote project `raoprigiowskqnylapqs`. |
| 2. Auth (clients + businesses) | ✅ Done + E2E verified | Supabase email+password. Role guards. Full Playwright E2E passed. |
| 3. Persist solicitudes/propuestas/photos | ⬜ **Next** | Replace all mock arrays. Storage bucket ready. |
| 4. Culqi subscription billing | ⬜ Planned | Quota enforcement + webhook route + signature verify. |
| 5. Rebrand (name/logo/colors) | ⬜ Deferred | After backend is solid. |
| 6. Clerk auth migration (future) | ⬜ Planned | See architecture doc for full migration strategy. |
| 7. Architecture & scaling analysis | ✅ Done | Created `docs/ARCHITECTURE_AND_SCALING_PLAN.md` and `docs/PROTOTYPE_VS_PRODUCTION_ROADMAP.md`. |

---

## Backend / Infra

- **Supabase project**: `raoprigiowskqnylapqs` ("M2 data dev"), region `us-west-1` (Oregon), org `erjbgmilufdefomtgqdk`.
- **Local Supabase CLI**: Linked. `npx supabase@latest db push` works for new migrations.
- **Cloudflare Workers**: App name `empenalo` (was `tanstack-start-app`). Deploy not yet attempted.
- **Package manager**: Bun (1.3.13).
- **Dev server**: `bun dev` → http://localhost:8080/.

---

## Files of Interest

```
src/
  lib/supabase/
    browser.ts        getSupabaseBrowser()  — client components
    server.ts         getSupabaseServer()   — server fns, cookie-aware
    admin.ts          getSupabaseAdmin()    — service-role, server only
  server-fns/
    auth.ts           getCurrentUser, signOut
  routes/
    app.tsx           layout + beforeLoad guard (role=client)
    app.login.tsx
    app.register.tsx
    negocio.tsx       layout + beforeLoad guard (role=business)
    negocio.login.tsx
    negocio.register.tsx
  components/
    PhoneFrame.tsx    Mobile client layout + logout
    BusinessLayout.tsx Desktop business layout + logout

supabase/
  migrations/
    0001_init.sql                 schema + RLS + bucket + accept_propuesta RPC
    0002_handle_new_user.sql      trigger: auto-create profile/business/sub on signup

docs/
  ARCHITECTURE_AND_SCALING_PLAN.md    Full system analysis + scaling roadmap
  PROTOTYPE_VS_PRODUCTION_ROADMAP.md  Pitch prototype vs production ideal

.dev.vars            local server secrets (gitignored)
.env.local           Vite public env (gitignored)
```

---

## Test Credentials (Dev-only — Throwaway)

| Role | Email | Password | Created |
|---|---|---|---|
| Client | `cliente.test@empenalo.local` | `TestCliente2026!` | 2026-05-16 |
| Business | `negocio.test@empenalo.local` | `TestNegocio2026!` | 2026-05-16 |

Business profile: "Joyería Test Lima" (Miraflores), admin "Richard Admin". Trialing on plan `basico`.

To recreate: visit `/app/register` or `/negocio/register`.  
To delete: Supabase Dashboard → Authentication → Users.

---

## Open Action Items

1. ⬜ **Disable email confirmation in Supabase dashboard** for smooth dev — Authentication → Sign In / Up → Email → toggle "Confirm email" off.
2. ⬜ **Grab service-role key** — Dashboard → Project Settings → API → `service_role` (secret) → paste into `.dev.vars`: `SUPABASE_SERVICE_ROLE_KEY=...`. Needed for Culqi webhooks + admin scripts.
3. ⬜ **Culqi sandbox account** — culqi.com signup, grab public + secret keys. Defer until Phase 4.
4. ⬜ **Create `services/` abstraction layer** — wrap all Supabase calls to ease future backend migration. (See Architecture Doc, Phase 1.)
5. ⬜ **Image optimization strategy** — decide between Supabase Image Transformations vs resize-on-upload.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-16 | Use Supabase (Auth + DB + Storage) | Bundles 3 services, fastest path to MVP. |
| 2026-05-16 | Use Culqi for payments | Peru-native, soles support, fintech-friendly. |
| 2026-05-16 | Keep Cloudflare Workers | Inherited from Lovable scaffold; no churn cost, edge compute is excellent. |
| 2026-05-16 | Defer rebrand until backend solid | Branding is cheap to swap; blocks no other work. |
| 2026-05-16 | Plan Clerk migration but don't block | Supabase Auth gets us to MVP fastest; Clerk adds social/passkeys later. |
| 2026-05-17 | Document architecture & scaling now | Prevents tech debt from accumulating; establishes migration path before code hardens. |
| 2026-05-17 | Do NOT build a separate backend yet | Current stack can scale to 10–20k users with caching + jobs + pooling. Rewrite only justified by complex business logic or team needs. |

---

## Session Log

### 2026-05-17 — Session 3 (Architecture & Product Roadmap)

**Goal**: Analyze current architecture for scalability and define the prototype vs. production path.

**What was done**:
- Full codebase audit: mapped every route, server function, Supabase client, and migration.
- Identified that ~60% of routes still use hardcoded mock arrays (Phase 3 pending).
- Wrote comprehensive `docs/ARCHITECTURE_AND_SCALING_PLAN.md` covering:
  - Tech stack deep dive
  - Data model summary
  - Latency, cache, DB, performance, maintainability, scalability analysis
  - Assessment matrix (1–5 stars)
  - Actionable 3-phase roadmap (Now → Pre-Scale → Scale)
  - Technology comparison for future backend migration
- Wrote `docs/PROTOTYPE_VS_PRODUCTION_ROADMAP.md` covering:
  - Pitch prototype scope (what to build, what to fake, what to demo)
  - Production ideal architecture
  - Side-by-side feature matrix
  - Transition strategy from pitch to production
- Updated this `backlog.md` with new status snapshot, open items, and decisions.

**Key findings**:
- The stack (Cloudflare Workers + Supabase + TanStack Start) is **excellent for the prototype**.
- For 10–20k users, the bottleneck is **database connections, caching, and background jobs** — not the programming language.
- The highest-ROI immediate change is creating a `services/` abstraction layer to decouple the frontend from Supabase.

**Next session priority**: Phase 3 — Replace mock data with real Supabase queries.

---

### 2026-05-16 — Session 2 (Auth E2E & CLI Linking)

**Goal**: Complete and verify authentication for both portals.

**What was done**:
- Created `backlog.md` (this file).
- Linked Supabase CLI, repaired migration ledger (0001 was applied via dashboard earlier but not recorded), pushed 0002.
- Email confirmation disabled in Supabase dashboard (user action).
- Added logout button to `PhoneFrame` footer (client side).
- **Full Playwright E2E passed**:
  - Business signup `/negocio/register` → auto-login → `/negocio/dashboard` ✅
  - Business logout (sidebar Salir) → `/negocio/login` ✅
  - Business login `/negocio/login` → `/negocio/dashboard` ✅
  - Business hits `/app/dashboard` → redirected to `/negocio/dashboard` ✅
  - Client signup `/app/register` → auto-login → `/app/dashboard` ✅
  - Client logout (PhoneFrame footer Salir) → `/app/login` ✅
  - Client login `/app/login` → `/app/dashboard` ✅
  - Client hits `/negocio/dashboard` → redirected to `/app/dashboard` ✅
- Trigger `handle_new_user` confirmed firing (business signup created profile + business + trialing subscription).
- 2 test users seeded.

**Phase 2 complete and verified.**

---

### 2026-05-16 — Session 1 (Supabase Wiring & Schema)

**Goal**: Replace Lovable mock scaffold with real data layer.

**What was done**:
- Inherited Lovable scaffold, mapped architecture.
- Created plan file `C:\Users\a2021\.claude\plans\delightful-mapping-lightning.md`.
- Phase 1: Supabase SDK installed, 3 client factories (`browser.ts`, `server.ts`, `admin.ts`), migration `0001_init.sql` written + applied.
- Phase 2: Migration `0002_handle_new_user.sql` (trigger), auth server functions (`getCurrentUser`, `signOut`), layout guards (`app.tsx`, `negocio.tsx`), login + register pages for both roles, logout in `BusinessLayout`.
- Renamed Wrangler app `tanstack-start-app` → `empenalo`.

---

*End of backlog. Add new sessions at the top.*
