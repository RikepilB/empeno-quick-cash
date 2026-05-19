# PRODUCT.md — EMPEÑALO Product Brief

> One-pager. Reference from `.claude/CLAUDE.md`. Read first before any feature work.

---

## What it is

**EMPEÑALO** is a two-sided marketplace connecting **personas con artículos** (clientes) and **casas de empeño** (negocios) in Peru. The client publishes what they want to pawn; multiple pawn shops send competing offers (propuestas); the client picks one; the deal closes in person with a redemption code (`EMP-XXXXX`).

The platform broker:
- Validates identity (DNI for clientes, RUC + DNI representante for negocios).
- Hosts the auction-style propuesta flow.
- Tracks operation lifecycle (pickup → completed / disputed / expired).
- Builds future alternative credit-scoring signals from observed payment behavior.

The medium-term product is **not** just a marketplace — it is the **alternative-underwriting data layer** for the LATAM informal-credit sector. The marketplace is the funnel that generates the data.

---

## Actors

| Actor | What they want | Pain today |
|---|---|---|
| **Cliente** (persona con artículo) | Fair price for short-term cash; not get scammed | Walks 4–5 pawn shops, opaque pricing, security anxiety |
| **Casa de empeño** (negocio) | Steady deal flow without paid ads; structured pipeline | Walk-ins only, no CRM, no client trust signal |
| **Operador / cashier** | Simple list of incoming leads; one-tap propuesta | Phone/WhatsApp chaos |
| **Owner del negocio** | Visibility into branch performance, plan usage | Spreadsheets + gut feel |
| **Admin (interno EMPEÑALO)** | Verify businesses, resolve disputes, configure fees | n/a |
| **Fintech / banco** (Etapa 3) | Buys access to alternative scoring API | No signal on unbanked/underbanked |

---

## Business model — phased

### Etapa 1 (now → public beta, ~6 mo)
1. **Commission per closed lead** — % of `monto_pen` accepted (config-driven; `tiered_percentage` default 3% min S/10 max S/100).
2. **Monthly subscription** for negocios (plans below). Culqi default; demo-mode without keys.
3. **Pay-to-boost** — featured placement on solicitudes feed (plan credits + buy-more).

### Etapa 2 (beta → growth, 6–18 mo)
4. Mini-CRM for negocios (branch users, schedule).
5. Built-in scoring surfaced on each solicitud.
6. Analítica dashboards per negocio / sucursal.
7. Automatización de cobranza (reminders, payment links).
8. WhatsApp Business notifications.

### Etapa 3 (scale, 18+ mo)
9. Sell scoring API to fintechs / banks.
10. Originar préstamos propios.
11. BNPL con garantía.
12. Dedicated native mobile app (React Native / Expo).

The schema and architecture must let Etapa 1 ship and Etapa 2 be a beta without rewrites.

---

## Plan tiers (Etapa 1)

| Plan | Propuestas/mes | Sucursales | Users/sucursal | Notif RT | Dashboard | Reportes | Soporte | Gerente | Featured credits/mes |
|---|---|---|---|---|---|---|---|---|---|
| **Gratuito** (`free`) | 10 | 1 | 1 | — | — | — | community | — | 0 |
| **Plus** (`starter`, casa familiar) | 50 | 1 | 1 | ✅ | simple | — | email | — | 2 |
| **Premium** (`pro`, multi-sucursal) | ilimitadas | 5 | 2 | ✅ | full | ✅ | priority | ✅ | 10 |
| **Pro** (`unlim`, franquicia) | ilimitadas | 15 | 3 | ✅ | full | ✅ | priority | ✅ + sub-regional | 30 |

> **Naming mismatch alert**: UI uses Spanish plan labels (Gratuito / Plus / Premium / Pro), DB uses English slugs (`free` / `starter` / `pro` / `unlim`). Map in `src/lib/billing/plans.ts` — never hardcode UI labels against DB slug.

> **Current DB state**: Existing `0003_billing.sql` seeds three plans (`basico`, `intermedio`, `avanzado`) at S/10 / S/20 / S/30 with 5 / 30 / unlimited propuestas. The Etapa 1 plan matrix above is **planned for migration `0006_monetization.sql`** (see `REDESIGN-ROADMAP.md`). Until that lands, the live system runs the simpler tier.

### Prototype enforcement
Only enforce `monthly_propuestas` and (post-0006) `monthly_featured_credits`. Other fields (`dashboard_tier`, `monthly_reports`, `realtime_notifications`) are stored but not yet gated in code — flag them via plan feature checks when the UI for each lands.

---

## Categorías (UI scope)

All 11 categorías ship in Etapa 1:

- Celular · Laptop · Joya · Reloj · Vehículo · Moto · Electrodoméstico · Consola de videojuegos · Cámara / equipo audiovisual · Herramienta profesional · Instrumento musical · Artículo de lujo (bolso)

### Category-specific form fields
See `UI-UX.md` §"Publicar artículo" for the per-category field spec (e.g., iPhone → battery %, Vehículo → SOAT vigente + tarjeta de propiedad). Schema currently stores per-category detail in `solicitudes` columns (`brand`, `model`, `year`, `storage`, `condition`) plus the new `photos jsonb` field. Plan: extend with `detalles_categoria jsonb` in `0006` so each categoría can carry its own structured fields.

### DB constraint vs UI mismatch
`solicitudes.category` CHECK constraint allows a narrower set than the UI. New categories must either land in the migration that broadens the CHECK, or fall through to `'otro'` with subcategory data inside the JSONB detail field. Documented as risk in `REDESIGN-ROADMAP.md`.

---

## Prototype scope (what ships first)

✅ **In scope (Etapa 1)**
- Auth: email + password (cliente, negocio), DNI scaffolding with RENIEC mock, business verification manual + 48h SLA business days.
- Publicar solicitud — all 11 categorías with minimal per-category fields.
- Recibir y comparar propuestas (filtros: mayor monto / menor tasa / mayor plazo).
- Aceptar propuesta → operation con `EMP-XXXXX`.
- Pickup flow (negocio marca completed / disputed con código).
- Responsive web (móvil-first viewport, desktop layouts) + light/dark.
- Full Etapa 1 monetization: commissions config-driven, subscriptions via Culqi (default) / demo, featured offers (plan credits + buy-more) — post-`0006`.
- Manual invoicing for commissions in Etapa 1 (auto in Etapa 2).

❌ **Out of scope (parked → Etapa 2 / 3)**
- Scoring algorithm.
- Branches / multi-user per business (schema supports it via `business_members`, but UI deferred to Etapa 1.5).
- Push / SMS notifications (email yes, WhatsApp Etapa 2).
- Cobranza automation, payment tracking on the loan itself, points wallet.
- Native mobile app (Etapa 3 — RN/Expo). Web is responsive.
- Real RENIEC / SUNAT integration (scaffolding + manual verification in Etapa 1; real API Etapa 2).
- Stripe fallback (Culqi-only for Peru launch; international gateway parked until LATAM expansion).

---

## Constraints

- **Two-sided liquidity**: prototype works only with ≥3 verified negocios seeded per district. See `SEEDER.md`.
- **PEN only**. No multi-currency before Etapa 3.
- **Lima first**, then Arequipa / Trujillo. District-level filtering required day-one.
- **Photos mandatory** on solicitud (1–6), 5 MB cap each. Bucket private; signed URLs.
- **Verification manual + 48h SLA business days**.

---

## Success criteria for prototype

| Metric | Target | Why |
|---|---|---|
| Time signup → first published solicitud | < 5 min | Funnel doesn't bleed users |
| Avg propuestas per solicitud (after 24h) | ≥ 3 | Validates two-sided liquidity |
| Solicitud → operation_completed conversion | ≥ 30% | Validates trust + matchmaking |
| Bounce on category-specific form | < 20% | Dynamic fields not too heavy |
| RLS denial rate (logs) | ≈ 0% | All denials = app bugs, not malicious traffic |

---

## Naming convention (locked)

| Domain | Language | Style |
|---|---|---|
| Domain tables / entities | **Spanish** | `solicitudes`, `propuestas`, `operations`, `commissions`, `featured_offers` |
| Infra / cross-cutting | **English** | `profiles`, `businesses`, `business_members`, `audit_logs`, `plans`, `subscriptions`, `payments`, `invoices` |
| Status enums | English | `'pending'`, `'accepted'`, `'expired'`, `'completed'`, `'disputed'` |
| UI copy | **Spanish** | "Publicar artículo", "Esperando respuestas", "Destacada" |
| Code identifiers | English | `acceptPropuesta`, `solicitudId`, `boostPropuesta` |
| Currency | `S/ ` prefix + `tabular-nums` | UI never shows raw integers without `S/` |

---

## Open product decisions (recheck weekly)

- [ ] Final pricing per plan tier in soles — currently placeholder; Etapa 1 enforcement keeps S/10/S/20/S/30 until 0006 + business decision.
- [ ] Commission rate by plan tier (free=3%? pro=2.5%? unlim=2%?) — needs business sign-off before 0006 seeds the config.
- [ ] Boost prices (S/9 / S/15 / S/20 proposed for 24h/48h/72h) — confirm before launch.
- [ ] Annual subscription discount (~2 months free) — Etapa 1.5.
- [ ] Free trial for paid plans? 14d / 30d / none?
- [ ] Refund policy for mid-period sub cancellation — pro-rate vs no-refund?
- [ ] Propuestas: sealed-bid vs visible across negocios? Plan-tiered visibility?
- [ ] Auto-extend solicitudes with zero propuestas at `expires_at`, or notify + close?
- [ ] DNI verification gating — required to publish, or just email-verified?

Each decision belongs in an ADR before code. Don't decide them in code review.

---

**See also**: `BILLING.md`, `UI-UX.md`, `DESIGN-SYSTEM.md`, `SCALABILITY.md`, `ARCHITECTURE.md`, `API.md`, `TESTING.md`, `SEEDER.md`, `REDESIGN-ROADMAP.md`.
