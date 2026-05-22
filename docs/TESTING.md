# TESTING.md — EMPEÑALO Test Accounts & QA Flows

> Test accounts, seed assumptions, QA scenarios, flow verification, responsive checks, monetization checks.
>
> Run the seeder first (`bun run seed`) and verify accounts can sign in before any QA pass.

---

## Development accounts

| Rol     | Email                         | Contraseña         |
| ------- | ----------------------------- | ------------------ |
| Cliente | `cliente.test@empenalo.local` | `TestCliente2026!` |
| Negocio | `negocio.test@empenalo.local` | `TestNegocio2026!` |
| Admin   | `admin.test@empenalo.local`   | `TestAdmin2026!`   |

> Demo passwords live here for QA-only convenience. **Real passwords must come from `.dev.vars` `SEED_DEMO_PASSWORD`** — see `DEVELOPMENT.md`. CI must not echo any password.

---

## Demo cliente accounts

| Email                          | Contraseña  | Nombre         |
| ------------------------------ | ----------- | -------------- |
| `demo.cliente1@empenalo.local` | `Demo2026!` | María González |
| `demo.cliente2@empenalo.local` | `Demo2026!` | Carlos Mendoza |
| `demo.cliente3@empenalo.local` | `Demo2026!` | Lucía Torres   |
| `demo.cliente4@empenalo.local` | `Demo2026!` | Javier Ruiz    |
| `demo.cliente5@empenalo.local` | `Demo2026!` | Ana Castillo   |

---

## Demo negocio accounts

| Email                          | Contraseña  | Negocio               | Distrito          |
| ------------------------------ | ----------- | --------------------- | ----------------- |
| `demo.negocio1@empenalo.local` | `Demo2026!` | Joyería Miraflores    | Miraflores        |
| `demo.negocio2@empenalo.local` | `Demo2026!` | Empeños Lima Centro   | Cercado de Lima   |
| `demo.negocio3@empenalo.local` | `Demo2026!` | Casa Oro Surco        | Santiago de Surco |
| `demo.negocio4@empenalo.local` | `Demo2026!` | Préstamos San Isidro  | San Isidro        |
| `demo.negocio5@empenalo.local` | `Demo2026!` | Oro Express San Borja | San Borja         |

---

## Seeder baseline

Current seeder (`scripts/seed.ts`):

- Dev cliente + dev negocio.
- 5 demo clientes + 5 demo negocios.
- 20 solicitudes.
- Deterministic propuestas.
- Accepted propuestas with redemption codes.

> **In flight**: `scripts/seed.ts` rewrite per `SEEDER.md` — expands to 30+ solicitudes across all 11 categorías, plan-tier coverage, featured offers, mixed operation statuses. Tracked in `REDESIGN-ROADMAP.md`.

---

## Core QA flows

### 1. Cliente registers + publishes

Expected:

- Registers manually (DNI + name + email + password + phone) or via OAuth (Google planned).
- Lands in proper web layout — **never** mobile-frame on desktop.
- Publishes artículo with category-specific fields rendered correctly.
- Sees empty state first if no publicaciones exist (copy: "Aún no tienes publicaciones").

### 2. Negocio registers + gets verified

Expected:

- Inputs RUC + DNI representante.
- Sees pending-verification copy with **business-hours context** (48h hábiles, 9:00–18:00 hora Lima).
- After admin approval: sees plan selection at `/negocio/plan`.

### 3. Negocio sends propuesta

Expected:

- Browses open solicitudes filtered by distrito + categorías.
- Creates propuesta with monto + tasa mensual + plazo + notas.
- Sees quota usage banner.
- (Post-0006) Can optionally feature the propuesta.

### 4. Cliente compares + accepts

Expected:

- Sees multiple ofertas.
- Sorts by mayor monto / menor tasa / mayor plazo.
- Accepts ONE propuesta. Others auto-expire.
- Receives redemption code `EMP-XXXXX`.
- Sees business address + map link + phone.

### 5. Operation closes

Expected:

- Negocio inputs code → matches → "Marcar completada" / "Marcar disputada".
- Operation status updates.
- Audit log row written (`audit_logs` — service_role only — verify via SQL).

### 6. Plan enforcement

Expected:

- Negocio sees current plan + usage.
- Hitting propuesta cap shows: "Has alcanzado el límite de N propuestas de tu plan."
- Below-cap inserts succeed; usage counter increments atomically (RPC).
- (Post-0006) Featured offers: credit path deducts from `featured_credits_used_this_period`; purchase path creates `payments` row.

### 7. Auth back-arrow + DNI tab

Expected:

- All 4 auth screens (`/app/login`, `/app/register`, `/negocio/login`, `/negocio/register`) show back arrow top-left → `/`.
- DNI tab visible but disabled with tooltip "En desarrollo — disponible próximamente".
- Forgot-password flow sends email + shows success state.

### 8. Demo billing mode

Expected:

- Without `CULQI_SECRET_KEY`: plan upgrade records `invoices.status='demo'` + flips plan immediately. UI shows demo banner.
- With key: real Culqi charge required; webhook updates invoice status.

---

## Responsive QA checklist

### Desktop (≥1024 px)

- [ ] `/app/login` renders web card. **NO phone-frame.**
- [ ] `/negocio/login` same.
- [ ] Propuesta comparison uses richer multi-column layout.
- [ ] `Mis publicaciones` can render as table or rich card grid.
- [ ] `/app/publish` shows sticky summary panel.
- [ ] All counters start at 0 when account is empty.

### Mobile (375–414 px)

- [ ] Bottom nav visible on authenticated routes.
- [ ] Forms usable at 375 px width.
- [ ] No horizontal scroll on core flows.
- [ ] Publish form uses step flow + sticky action.
- [ ] Touch targets ≥ 44×44 px; inputs ≥ 48 px tall.

### Tablet (768–1023 px)

- [ ] Hybrid layout — centered card with comfortable padding.
- [ ] Auth card centered, no phone-frame.

---

## Seed verification checklist

After `bun run seed`, verify:

- [ ] Auth users created (sign-in works for every demo account).
- [ ] Cliente profiles exist (`profiles.role='client'`).
- [ ] Negocio profiles exist (`profiles.role='business'`).
- [ ] Businesses linked through `business_members` w/ `role='owner'`.
- [ ] Subscriptions active for each negocio (matches plan-tier spread per `SEEDER.md`).
- [ ] Open solicitudes exist across all 11 categorías.
- [ ] Each seeded distrito has enough liquidity (≥3 negocios in same or adjacent district).
- [ ] Propuestas exist on seeded solicitudes (1–3 per eligible solicitud).
- [ ] Accepted operations exist with codes matching `EMP-XXXXX` regex.
- [ ] At least 3 completed operations.
- [ ] At least 1 disputed operation (admin visibility).
- [ ] No RLS errors in happy path (check log output).
- [ ] (Post-0006) Featured offers visible on a subset; commissions ledger has rows.

Run `bun run scripts/seed-verify.ts` (planned in `SEEDER.md`) — should output row-count assertions + relationship checks.

---

## Demo session scenarios

### Fast product demo (60 s)

Accounts: `demo.cliente1@empenalo.local` + `demo.negocio1@empenalo.local`.

1. Cliente login → ver una solicitud activa con propuestas.
2. Cliente acepta una propuesta → muestra código.
3. Negocio login → ve operación pendiente con código.
4. Negocio marca completada.

### Sales / investor demo (3 min)

Use seeded businesses in the same distrito as a cliente to guarantee visible competition (≥3 propuestas). The success criterion is ≥3 propuestas per request — seed must show that.

---

## Security / RLS smoke tests

After any RLS-policy change, run these sanity checks:

```sql
-- Cliente A should NOT see Cliente B's solicitudes
SELECT count(*) FROM public.solicitudes
WHERE client_id <> (SELECT id FROM auth.users WHERE email = 'demo.cliente1@empenalo.local')
-- Run as authenticated user demo.cliente1; expect 0 (no public listing).

-- Negocio should NOT see solicitudes of other negocios via propuestas table
-- (Only own propuestas readable.)

-- Service role should see everything.
```

Also run `bash scripts/security-scan.sh` before any commit. Fails on supabase JWTs, Culqi keys, postgres URLs, GitHub PATs, hardcoded passwords, supply-chain IOCs.

---

## Test infrastructure status

| Test type             | Status                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Unit tests**        | ❌ Not present. Plan: add Vitest for `src/services/*` and `src/lib/*`.                                              |
| **Integration tests** | ❌ Not present. Plan: spin up Supabase locally via `supabase start`, test RPCs + RLS directly.                      |
| **E2E tests**         | Playwright is wired (per `ARCHITECTURE.md`) but **no test files exist yet**. Plan: cover the 8 core QA flows above. |

> Coverage target per `.claude/rules/common/testing.md` is 80%. Current is 0%. Closing this is a separate phase — see `REDESIGN-ROADMAP.md`.

---

## Verification before claiming "done"

Per `.claude/CLAUDE.md`:

1. `bun run lint` passes.
2. `bun run build` succeeds.
3. For DB changes: `npx supabase@latest db push` succeeds.
4. Route loads in browser at `http://localhost:8080`.
5. Update `handoff.md` session log when finishing a phase.

If you cannot open a browser (e.g., headless agent), say so explicitly — do not claim success.

---

## Notes for agents

- Do NOT assume test data is only for auth — it must support all product features.
- Do NOT build a flow that can't be demonstrated with seeded data. If you must, add seed support in the same PR.
- Keep test accounts stable between seed runs.
- Prefer deterministic seed generation so demos are reproducible.

---

**See also**: `SEEDER.md`, `UI-UX.md`, `BILLING.md`, `REDESIGN-ROADMAP.md`.
