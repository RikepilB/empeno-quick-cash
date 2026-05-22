# SEEDER.md — EMPEÑALO Seeder Redesign Spec

> How `scripts/seed.ts` should work after the redesign so the prototype can demo the **complete product flow** — not just an auth smoke test.

---

## Objective

The seeder must create a **full demo ecosystem** that exercises:

- Auth (every role)
- Category form testing (all 11 categorías)
- District liquidity (3+ negocios per district overlap)
- Propuesta competition (multiple offers per solicitud)
- Operation closure (mixed statuses)
- Monetization (plan tiers, featured offers, commissions — post-0006)
- Responsive demos with realistic content

---

## Why the current seeder is not enough

`scripts/seed.ts` (565 LOC today) creates:

- 5 demo clientes + 5 demo negocios.
- 20 solicitudes (limited to `celular`, `laptop`, `joya`, `reloj`, `vehiculo`, `otro`).
- Deterministic propuestas (0–3 per solicitud).
- 5 accepted operations with redemption codes.

Gaps for full-flow validation:

- Only ~6 of 11 UI categorías covered.
- No featured offers (schema lands in 0006).
- No commission ledger entries.
- Plan tier coverage is shallow (all subs default to trialing avanzado via `handle_new_user`).
- Districts not deliberately overlapped for liquidity demos.
- No disputed operation for admin visibility.

The new seeder is **product infrastructure**, not a convenience script.

---

## Seeder principles

1. **Deterministic** — same inputs → predictable demo data. Stable across screenshots.
2. **Flow-complete** — every important feature represented.
3. **District-aware** — seeded negocios and clientes overlap geographically.
4. **Category-aware** — covers full UI category surface.
5. **Monetization-aware** — plan tiers, featured offers, commissions visible.
6. **Safe to rerun** — idempotent OR resettable with `--reset` mode.

---

## Required seed outputs

### 1. Auth / users

- 1 dev cliente · 1 dev negocio · 1 dev admin
- 5 demo clientes · 5 demo negocios

See `TESTING.md` for account matrix.

### 2. Profiles

For every user. Cliente profile:

- first_name, last_name
- document_type (`'DNI'`)
- document_number (8 digits, deterministic — e.g., `40000001` for cliente1)
- phone
- district (overlapping with negocios — see §"District strategy")
- city `'Lima'`

Negocio owner profiles: same base shape.

### 3. Businesses

5 businesses with:

- ruc (11 digits, deterministic — `20100000001`…)
- legal_name, trade_name
- email, phone, address
- district (overlapping with clientes)
- verification_status `'verified'`
- status `'active'`

### 4. Business membership

Each owner linked through `business_members(role='owner')`.

### 5. Plans + subscriptions

Spread across tiers for plan-UI testing.

**Today (`basico` / `intermedio` / `avanzado`)**:

- 1 negocio on `basico` (small / family)
- 2 negocios on `intermedio` (mid-tier)
- 2 negocios on `avanzado` (multi-sucursal)

**Post-0006 (`free` / `starter` / `pro` / `unlim`)**:

- 1 negocio on `free` (gratuito)
- 2 negocios on `starter` (plus)
- 1 negocio on `pro` (premium)
- 1 negocio on `unlim` (pro / franquicia)

Each subscription:

- `status='active'`
- `current_period_end = now() + 30 days`
- `propuestas_used_this_period = 0` (or partial for usage-bar testing)

### 6. Solicitudes — 30 minimum

Suggested category spread:

| Categoría                   | Count  |
| --------------------------- | ------ |
| Celular                     | 6      |
| Laptop                      | 4      |
| Joya                        | 4      |
| Reloj                       | 3      |
| Vehículo                    | 3      |
| Moto                        | 2      |
| Electrodoméstico            | 2      |
| Consola de videojuegos      | 2      |
| Cámara / equipo audiovisual | 1      |
| Herramienta profesional     | 1      |
| Instrumento musical         | 1      |
| Artículo de lujo (bolso)    | 1      |
| **Total**                   | **30** |

> **DB constraint check**: `solicitudes.category` CHECK currently allows a narrower set. Options:
>
> 1. Migrate CHECK to broaden in `0006_monetization.sql` (preferred).
> 2. Store unsupported categorías under `'otro'` with structured `detalles_categoria` jsonb.
>
> Decide before seeder rewrite. Track in `REDESIGN-ROADMAP.md`.

---

## District strategy

Seed around overlapping Lima districts so competition is visible:

- Miraflores
- San Isidro
- Santiago de Surco
- San Borja
- Cercado de Lima

≥3 negocios should compete for some seeded solicitudes in the same or adjacent district. The product brief requires ≥3 propuestas/solicitud — the seed must guarantee that for the demo paths.

---

## Propuesta strategy

Create **1–3 propuestas per eligible solicitud**.

### Rules

- Propuestas come from different negocios (no same-business duplicates).
- Monto: 40–75% of `expected_amount_pen` (deterministic per `(solicitud_id, business_id)` pair via seeded RNG).
- Tasa mensual: 3.5–8%.
- Plazo: 15 / 30 / 60 days (mixed).

### Distribution

- ~25% solicitudes: 1 propuesta.
- ~50% solicitudes: 2 propuestas.
- ~25% (high-value items): 3 propuestas.

Creates useful comparison states for cliente UI.

---

## Featured offers (post-0006)

Once `featured_offers` table lands:

Rule of thumb: 1 featured propuesta per ~3–4 solicitudes-with-multiple-propuestas.

Examples to seed:

- 2× `source='plan_credit'` (deducted from negocio's monthly credits).
- 2× `source='purchased'` linked to a seeded `payments` row (`purpose='featured_boost'`, `status='succeeded'`).

This lets the UI demo featured-badge + ordering + transparency copy.

---

## Operations strategy

Create a mix of statuses for dashboard variety:

| Status                                   | Count | Notes                               |
| ---------------------------------------- | ----- | ----------------------------------- |
| Solicitudes open with pending propuestas | 12    | Most realistic state                |
| Solicitudes open, propuestas pending     | 10    | Same as above with different counts |
| Accepted operations, pending pickup      | 5     | Code visible, not yet completed     |
| Completed operations                     | 3     | Demo "history" view                 |
| Disputed operation                       | 1     | Admin visibility                    |

Codes match `EMP-XXXXX` (`generate_redemption_code` RPC).

---

## Commission coverage (post-0006)

Once `commissions` table lands, seed:

- Each completed operation → 1 commission row.
- Mix `status` values: 2× `'pending'`, 1× `'invoiced'`, 0× `'paid'` (kept manual in Etapa 1).
- Include `config_snapshot` so the row is independent of later config changes.

Lets business + admin dashboards show:

- # of accepted deals.
- Commission owed.
- Closed-lead examples per business.

---

## Suggested directory structure

```
scripts/
  seed.ts                # orchestrator
  seed-reset.ts          # drops demo data safely (--reset mode)
  seed-verify.ts         # asserts row counts + relationships
  seed-data/
    users.ts             # account matrix
    businesses.ts        # negocio rows + owners
    solicitudes.ts       # 30+ rows w/ category fields
    propuestas.ts        # deterministic offer generation
    operations.ts        # accept + close subset
    featured.ts          # (post-0006) featured_offers seeding
    commissions.ts       # (post-0006) commissions ledger
    constants.ts         # passwords (from env), district list, RNG seed
```

---

## Recommended `seed.ts` flow

1. Ensure required plans exist (idempotent; check vs migration).
2. Create auth users (Supabase admin client, `auth.admin.createUser`).
3. Create profiles.
4. Create businesses.
5. Create `business_members`.
6. Verify subscriptions (`handle_new_user` trigger creates them; override plan/status as needed).
7. Create solicitudes (with photos — upload to `solicitud-photos` bucket, then write rows referencing storage paths).
8. Create propuestas.
9. Accept a subset via `accept_propuesta` RPC (so operations + audit logs follow the production path).
10. Mark some operations completed / disputed via `markOperationCompleted` service.
11. (Post-0006) Create featured offers via `boost_propuesta` RPC.
12. (Post-0006) Seed commissions (most happen automatically inside the extended `accept_propuesta` — verify they exist).
13. Run `seed-verify.ts` — assert expected counts.

---

## JSON shape examples (per categoría)

Use structured `detalles_categoria` objects so future UI expansion is easy. Even if you store everything in current columns today, design rows to be **forward-portable**.

```json
{
  "subcategory": "vehiculo",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio_compra": 2020,
  "kilometraje": 52000,
  "transmision": "automatico",
  "combustible": "gasolina",
  "soat_vigente": true,
  "revision_tecnica": true
}
```

```json
{
  "subcategory": "celular",
  "marca": "Apple",
  "modelo": "iPhone 14 Pro",
  "anio_compra": 2022,
  "fue_reparado": false,
  "battery_health": 89,
  "almacenamiento_gb": 256
}
```

```json
{
  "subcategory": "joya",
  "tipo_joya": "anillo",
  "material": "oro",
  "kilataje": 18,
  "peso_g": 5.2,
  "tiene_tasacion": true
}
```

---

## Verification script expectations

`seed-verify.ts` should confirm:

- Auth users created (count + emails).
- Profiles count = users count.
- Businesses exist and are `verified`.
- `business_members` linked.
- Subscriptions active for every business.
- Solicitudes ≥ 30, covering all 11 categorías.
- Propuestas distributed per strategy above.
- Accepted operations exist.
- Redemption codes match `EMP-XXXXX` regex.
- (Post-0006) Featured offers exist.
- (Post-0006) Commissions ledger has rows.
- No orphan rows remain.

Exit code non-zero on assertion failure.

---

## Risks / mismatches to track

### 1. Category mismatch

UI scope (11 categorías) wider than DB CHECK. Resolve in 0006 or store as `'otro'` + jsonb.

### 2. Plan naming mismatch

Spanish UI labels (Gratuito / Plus / Premium / Pro) vs DB slugs. Map in service layer; never hardcode UI labels against slug.

### 3. Monetization completeness

Subscriptions live; commissions + featured offers planned in 0006. Seeder must gate those modules with a `MIGRATION_LEVEL` flag so it can run on 0005 schemas (today) and 0006+ schemas (planned) without crashing.

### 4. Desktop auth UX mismatch (orthogonal)

Seed alone can't fix login page rendering inside a mobile-frame on desktop. Handled by `feat/ui-ux-improvements`.

### 5. Password externalization

Demo passwords must come from `.dev.vars` `SEED_DEMO_PASSWORD` — never hardcoded literals (`scripts/security-scan.sh` enforces).

---

## Done definition

Seeder redesign is complete when:

- Fresh environment seeded with one command (`bun run seed`).
- All key roles can sign in immediately.
- ≥1 complete cliente flow demonstrable without manual DB edits.
- ≥1 complete negocio flow demonstrable without manual DB edits.
- Plan state visible in negocio dashboard.
- Propuesta competition visible (≥3 ofertas on flagged solicitudes).
- Accepted + completed operations visible.
- Category diversity visible.
- (Post-0006) Featured propuestas + commission ledger visible.
- Repeated demos are stable and reproducible.
- `bun run scripts/seed-verify.ts` exits 0.

---

**See also**: `TESTING.md`, `PRODUCT.md`, `BILLING.md`, `REDESIGN-ROADMAP.md`.
