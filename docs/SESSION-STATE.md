# SESSION STATE — 2026-05-18 (post Phase 3 E2E)

## Active branch

`feat/phase-3-persistence` — HEAD `00c840e` (fix(propuestas): handle array/object shape).

Recent commits:
- `00c840e` fix(propuestas): handle array/object shape for nested supabase selects
- `ffbde56` docs: update backlog with Phase 3 completion
- `b3babeb` feat: Phase 3 — persist solicitudes, propuestas, photos, operations
- `caba6b9` feat: Phase 1+2 — Supabase backend + auth (clients + businesses)

Plan file: `~/.claude/plans/delightful-mapping-lightning.md` (security plan — fully executed).
Test creds: `cliente.test@empenalo.local` / `TestCliente2026!`, `negocio.test@empenalo.local` / `TestNegocio2026!`.
Test solicitud id: `2d1b6199-9834-4a80-9fcf-9e05a833146e`.
Test propuesta id: `2538536b-21bc-48fe-853c-d69208a2249a` (completed, code `EMP-PEELD`).

## Phase 3 — DONE

E2E flow verified via Playwright in this session:
1. ✅ Biz login → see active solicitud
2. ✅ Biz `/negocio/solicitud?id=...` → send propuesta (S/2,200 @ 4.5%/30d)
3. ✅ Quota success state: "Te quedan 4 propuestas este mes"
4. ✅ Client login → dashboard shows "1 propuesta"
5. ✅ Client `/app/proposals?id=...` → see offer "Joyería Test Lima"
6. ✅ Client `/app/proposal-detail?propuesta_id=...` → click Aceptar
7. ✅ Redirects `/app/code?...` → code `EMP-PEELD`, vigencia 17 jun 2026
8. ✅ Biz `/negocio/propuesta?id=...` → same code, status Aceptada
9. ✅ Biz enters `EMP-PEELD` + "Marcar como concretada"
10. ✅ Status flips to Concretada

## Phase 3 — known UI bugs (deferred, non-blocking)

1. **Biz `/negocio/propuestas` row shows category "Otro"** — `r.solicitudes` returns null in `listMyPropuestas` even after defensive `Array.isArray` wrap. Likely RLS on `solicitudes` blocks biz reads after solicitud closes. Fix options:
   - Add RLS policy: biz can read solicitudes they bid on, any status.
   - Or denormalize category/brand/model into `propuestas` row at insert.
2. **BusinessLayout sidebar "0/5" after sending propuesta (should be "1/5")** — `getBusinessContext` query not invalidated after `createPropuesta`. Add `queryClient.invalidateQueries({ queryKey: ['businessContext'] })` in negocio.solicitud success handler.

## Security plan — fully DONE

- ✅ Step 1: `bunfig.toml` 7-day guard (`minimumReleaseAge = 604800`, empty excludes)
- ✅ Step 2: `package.json` deps pinned exact (no carets). `bun.lock` workspaces section also pinned. `bun install --frozen-lockfile`: "Checked 519 installs across 655 packages (no changes)".
- ✅ Step 3: `src/lib/safe-redirect.ts` created, used in `app.login.tsx` + `negocio.login.tsx` — blocks `//evil.com`, `javascript:`, `\\evil`, non-relative.
- ✅ Step 4: `.gitignore` covers `.env`, `.env.*`, `!.env.example`. Also `SESSION-STATE.md`, `.claude/`.
- ✅ Step 5: `CLAUDE.md` appended supply-chain rules section (gitignored).
- ✅ Step 6: `scripts/security-scan.sh` IOC scanner. All PASS.
- ✅ Step 7: `bun install --frozen-lockfile` clean + scan clean.
- ✅ Step 8 (Phase 3 E2E): see above.

## Phase 4 — pending (blocked on external creds)

Needs in `.dev.vars` (none yet):
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project settings → API → service_role secret)
- `CULQI_PUBLIC_KEY` + `CULQI_SECRET_KEY` (Culqi sandbox account)

Implementation outline:
1. `src/server-fns/billing.ts`: `createCheckoutSession`, `confirmCharge` webhook
2. `supabase/migrations/0002_billing.sql`: extend `subscriptions` with `culqi_subscription_id`, `last_invoice_id`; add `invoices` table
3. Culqi webhook receiver `/api/culqi-webhook` validating signature
4. `negocio/perfil` plan-upgrade UI calling Culqi Checkout
5. Period-rollover cron resetting `propuestas_used_this_period` monthly

## Git branches + PRs

- `origin` = `https://github.com/m2dataperu-star/empeno-quick-cash` (our fork, push allowed)
- `upstream` = `https://github.com/Alonso20210201/empeno-quick-cash` (friend's, read-only)
- Open PRs (check with `gh pr list`):
  - PR #1: `feat/phase-1-2-foundation` → `develop`
  - PR #2: `docs` → `main`
- Next PR: `feat/phase-3-persistence` → `develop`

## Hard rules

- No `Co-Authored-By: Claude` trailers
- No direct push to `main` — PR only
- `bunfig.toml` `minimumReleaseAgeExcludes` stays `[]` unless per-package approval
- Never run `bun install/add/update` without explicit approval
- `CLAUDE.md` stays gitignored
- Service-role + Culqi keys stay in `.dev.vars` (gitignored)
- All work on `origin` fork; `upstream` read-only

## Dev server

Background id `b0e3xak2k`, http://localhost:8080. Stop with TaskStop if not needed.

## Files to read first on resume

- This file
- `~/.claude/plans/delightful-mapping-lightning.md`
- `backlog.md`
- `CLAUDE.md`
