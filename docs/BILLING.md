# BILLING.md — EMPEÑALO Monetization Reference

> Etapa 1 monetization implementation reference. Pairs with `PRODUCT.md` and `ARCHITECTURE.md`.
>
> **Status**: schema and seeded plans live (`0001_init.sql`, `0003_billing.sql`). Commission ledger, featured offers, and config-driven commission are **planned in `supabase/migrations/0006_monetization.sql`** — see `REDESIGN-ROADMAP.md`.

---

## What earns money in Etapa 1

| Stream | Trigger | Schema | RPC / service |
|---|---|---|---|
| **Subscription** | Negocio pays monthly to unlock plan tier | `subscriptions` + `plans` + `invoices` | `startCheckout` (Culqi/demo) + Culqi webhook |
| **Commission** | Cliente accepts propuesta | `commissions` + `commission_config` *(planned)* | `accept_propuesta` (atomic — extended in 0006) |
| **Featured boost** | Negocio promotes propuesta to top of list | `featured_offers` + `payments` *(planned)* | `boost_propuesta` *(planned)* |

---

## Subscription flow (current)

### Sign-up path
1. Negocio registers (`/negocio/register`).
2. `handle_new_user` trigger auto-creates `businesses` row + trialing `subscriptions` on `basico` (or `free`/`starter` post-0006).
3. Admin verifies business (manual, 48h SLA — see `UI-UX.md`).
4. After approval, negocio sees `/negocio/plan`.
5. Picks plan → `startCheckout({ plan_id, token_id? })`.
6. **Live mode** (`CULQI_SECRET_KEY` set + `token_id` present): real Culqi charge, then `change_subscription_plan` RPC flips plan.
7. **Demo mode** (no `CULQI_SECRET_KEY`): records `invoices.status='demo'` + flips plan immediately. UI shows demo banner.
8. Culqi webhook (`POST /api/culqi-webhook`) verifies HMAC signature and updates `invoices.status` / `paid_at` on real charges.

### Schema fields
| Table.Column | Purpose |
|---|---|
| `subscriptions.plan_id` | FK → `plans.id` (slug-style: `free`/`starter`/`pro`/`unlim` post-0006; `basico`/`intermedio`/`avanzado` today) |
| `subscriptions.status` | `'active' / 'trialing' / 'past_due' / 'canceled'` |
| `subscriptions.current_period_end` | Used by `reset_period_usage` RPC for rollover |
| `subscriptions.propuestas_used_this_period` | Incremented atomically by `increment_propuestas_used` RPC |
| `subscriptions.culqi_subscription_id` | Reference to Culqi subscription (live mode) |
| `subscriptions.featured_credits_used_this_period` | *(planned 0006)* — boost credit counter |
| `subscriptions.payment_gateway` | *(planned 0006)* — `'culqi' / 'manual'` (Stripe parked) |

### Period rollover (current)
- `reset_period_usage()` RPC sets `propuestas_used_this_period = 0` and bumps `current_period_end += interval '1 month'` for active/trialing subscriptions whose period has ended.
- Intended to run daily via Supabase scheduled cron (not yet scheduled — see `REDESIGN-ROADMAP.md`).
- Post-0006: must also reset `featured_credits_used_this_period`.

### Plan limits enforced in code
`src/services/propuestas.ts` calls `increment_propuestas_used` RPC before insert. RPC returns `{ used, allowed }`. If `allowed = false`, services rolls back the insert + raises sanitized error: `"Has alcanzado el límite de N propuestas de tu plan."`

UI shows usage banner when usage ≥ 80% of cap (planned — not yet implemented).

---

## Commission model (planned in 0006)

Locked decision: **both modes live in `commission_config` table**, picked at runtime per `(categoria, plan_slug)`. Business team can A/B-test without code changes.

### Modes
| Mode | Math | Use when |
|---|---|---|
| `percentage` | `monto_pen * percentage_bps / 10000` | Pure %, no bounds |
| `flat` | `flat_pen` (fixed) | Predictable revenue per close |
| `tiered_percentage` | `clamp(monto * %, min_pen, max_pen)` | **Default**: % with floor + ceiling |

### Specificity rules
When multiple configs match, most specific wins: `(categoria + plan) > (categoria) > (plan) > (default)`.

### Default seed (0006)
```
mode: tiered_percentage
percentage_bps: 300       (= 3%)
min_pen: 10.00
max_pen: 100.00
categoria: NULL           (all)
plan_slug: NULL           (all)
```

Example: S/1000 propuesta accepted on `free` plan + `celular` → `clamp(1000 × 0.03, 10, 100) = S/30`.

### Helper function (planned)
```sql
SELECT compute_commission(1000, 'celular', 'free');   -- S/30.00
SELECT compute_commission(100,  'celular', 'free');   -- S/10.00 (clamped to min)
SELECT compute_commission(10000,'celular', 'free');   -- S/100.00 (clamped to max)
```

### When commission is recorded
Inside `accept_propuesta` RPC (extended in 0006):
1. Look up active subscription plan_slug.
2. Compute commission via `compute_commission`.
3. Insert `commissions` row with **snapshot** of config used (so later config edits don't retroactively change past records).
4. Status starts `pending`. Transitions: `invoiced` → `paid` (or `waived`).

### Admin: add new rule
```sql
INSERT INTO commission_config (categoria, plan_slug, mode, percentage_bps, min_pen, max_pen, notes)
VALUES ('joyas', 'pro', 'tiered_percentage', 200, 15.00, 200.00, 'Joyas pro tier promo 2026-Q1');
```
Old config stays active for non-joya / non-pro. Existing commissions unaffected (snapshot pattern).

### Deactivate
```sql
UPDATE commission_config SET active = false, effective_to = now() WHERE id = '...';
```
Never `DELETE` — keep audit trail.

---

## Featured offers (planned in 0006)

Locked decision: **plan-included credits + buy-more**. Both paths go through `boost_propuesta` RPC.

### Plan-included credits
See plan matrix in `PRODUCT.md`. Stored in `plans.monthly_featured_credits`. Consumed via `subscriptions.featured_credits_used_this_period`.

### Pay-per-boost (proposed pricing — confirm with product)
- S/9 (24h) · S/15 (48h) · S/20 (72h)

### Flow
1. Negocio clicks "Destacar" on propuesta.
2. UI: "Tienes X créditos. ¿Usar crédito o comprar?"
3. **Credit path**: `boost_propuesta(propuesta_id, hours, use_credit=true)`.
4. **Purchase path**:
   - Create `payments` row (`purpose='featured_boost'`).
   - Run Culqi charge.
   - On success: `boost_propuesta(propuesta_id, hours, use_credit=false, payment_id)`.

### How "Destacada" appears
- `v_active_featured_propuestas` view returns `(propuesta_id, featured_until)` for active boosts.
- Feed query JOINs against this view; sort `is_featured DESC, created_at DESC`.
- UI: brand-border + "Destacada" badge (see `DESIGN-SYSTEM.md` §"Featured propuesta visual treatment").
- **Transparency rule**: always label "Destacada". Never hide paid placement.

### Anti-abuse
- One active boost per propuesta at a time (unique index `idx_featured_offers_no_overlap`).
- Only `pending` propuestas can be boosted (RPC checks status).
- Max 3 active boosts per negocio at any time (app-layer check; consider CHECK trigger if abused).
- Rate limit: 1 boost request per negocio per 30s (`rateLimitByUser`).

---

## Payment gateway (current)

Locked decision for Etapa 1: **Culqi only** (Peru-native). Stripe fallback parked until international expansion.

### Files
```
src/lib/payments/client.ts   Charge + subscription create + webhook verify
src/routes/api.culqi-webhook.ts   HMAC-SHA256 signature verified
src/services/billing.ts      startCheckout, listPlans, getBillingMode
```

### Demo mode
When `CULQI_SECRET_KEY` is absent:
- `startCheckout` records `invoices.status='demo'` + paid_at=now + flips plan.
- UI banner: "Modo demo — sin cobro real." (Spanish).
- `getBillingMode()` returns `{ mode: "demo" }` so UI can hide live-only affordances.

### Webhook safety
- Verify signature with `CULQI_WEBHOOK_SECRET` (HMAC-SHA256). Reject `401` on mismatch.
- Idempotency: use Culqi `event.id` as `payments.metadata.gateway_event_id` (post-0006) so replays no-op.
- Webhook handler is stateless + fast — heavy work goes to a background job (Inngest in Etapa 2; sync for Etapa 1).
- Failed webhooks: log via `log.error()` + return `200` to Culqi (avoid retries doubling processing). Reconcile via daily query.
- Replay protection: reject events older than 5 min.

### PCI scope
**SAQ A** — Culqi Checkout hosted elements only. Never touch raw card data. Tokens land in `invoices.culqi_charge_id`; cards never reach our DB.

---

## Reporting & invoicing

### Etapa 1 (manual)
Monthly query:
```sql
SELECT
  c.business_id,
  b.trade_name,
  count(*) AS pending_count,
  sum(c.monto_pen) AS pending_pen
FROM commissions c
JOIN businesses b ON b.id = c.business_id
WHERE c.status = 'pending'
GROUP BY c.business_id, b.trade_name
ORDER BY pending_pen DESC;
```
Generate PDF invoice manually (Etapa 1) → email via Resend (planned) → manual reconciliation when paid.

### Etapa 2
- Auto-invoice at period close.
- Auto-charge via stored Culqi subscription.
- 3 retries w/ backoff → `subscriptions.status='past_due'` → block new propuestas.

---

## Tax (Peru, IGV 18%)

- IGV applies to subscription fees + boost purchases when invoiced.
- Commissions on accepted propuestas: invoiced to negocios with IGV included.
- Factura electrónica required for B2B (negocio is RUC-registered).
- Boleta only if EMPEÑALO ever sells directly to a consumer (Etapa 3).
- Integration with Peruvian e-invoicing provider (Nubefact / Defontana / Facturador SUNAT) → Etapa 1.5.
- Track IGV in `payments.metadata.tax_amount_pen` (post-0006). Don't store as column — tax rules change.

---

## Webhook security checklist

- [ ] Signature verification on every webhook (Culqi HMAC-SHA256).
- [ ] Webhook URL allow-listed in Culqi dashboard.
- [ ] Idempotency key (Culqi event ID) in `payments.metadata.gateway_event_id`.
- [ ] Stateless + fast handler.
- [ ] Failed webhooks: log + return 200 (avoid double-processing on retry).
- [ ] Replay protection: reject events >5 min old.
- [ ] Manual reconciliation job daily.

---

## Open billing decisions

See `PRODUCT.md` §"Open product decisions" — same list. Decide before launch:
- [ ] Final price per plan tier.
- [ ] Commission % per plan slug.
- [ ] Boost pricing.
- [ ] Free trial.
- [ ] Annual discount.
- [ ] Refund policy.

---

## Testing the monetization paths

| Scenario | Setup | Expected |
|---|---|---|
| Free plan at limit | sub w/ `propuestas_used=10`, `monthly_propuestas=10` | Create propuesta → `"plan_limit_reached"` |
| Boost with credit | plus plan, `credits_used=0`, `monthly_credits=2` | `boost_propuesta(use_credit=true)` → credit_used=1, offer created |
| Boost credit exhausted | `credits_used=2`, `monthly_credits=2` | RPC raises `"no_credits_remaining"` |
| Boost purchased | `payment_id` from succeeded payment | `boost_propuesta(use_credit=false, payment_id)` → offer + payment linked |
| Accept commission | S/1000 monto, free plan, celular | `commission_pen=30.00`, row in `commissions` |
| Snapshot survives config change | accept → update config → query | Old commission shows old `config_snapshot` |
| Webhook double-delivery | same event_id twice | Second is no-op via idempotency_key |

Add as integration tests in `tests/billing/` (post-0006 — none yet — see `TESTING.md`).

---

**See also**: `PRODUCT.md`, `ARCHITECTURE.md`, `API.md`, `SCALABILITY.md`, `REDESIGN-ROADMAP.md`, `0003_billing.sql`, planned `0006_monetization.sql`.
