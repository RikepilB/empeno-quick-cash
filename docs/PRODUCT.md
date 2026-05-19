# EMPEÑALO — Product Brief

> Who, what, why. Read first before any feature scoping.
> Pairs with `PROTOTYPE_VS_PRODUCTION_ROADMAP.md` (in Documentation folder).

---

## What it is

**EMPEÑALO** is a two-sided marketplace connecting clients who want to pawn personal items with pawn shops (negocios) in Peru. The client publishes what they want to pawn; multiple pawn shops send competing offers (propuestas); the client picks one; the deal completes in person with a redemption code.

The platform brokers validation, the auction-style propuesta flow, and the operation lifecycle. Medium-term it becomes the alternative-underwriting data layer for LATAM informal credit.

---

## Who uses it

| Actor                              | Pain today                                             | How EMPEÑALO helps                                               |
| ---------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| **Cliente** (persona con artículo) | Walks 4-5 pawn shops, opaque pricing, security anxiety | Digital comparison of multiple offers from verified businesses   |
| **Negocio** (casa de empeño)       | Relies on walk-ins, no CRM, cannot validate clients    | Steady deal flow, structured pipeline, subscription-gated access |
| **Cashier** (branch staff)         | WhatsApp chaos, manual tracking                        | Simple list of incoming leads, one-tap propuesta                 |
| **Owner** (negocio)                | Spreadsheets, gut feel                                 | Visibility into branch performance, plan usage, metrics          |

---

## Business Model

### Etapa 1 — Now

1. **Monthly subscription** for businesses: Básico (S/10), Intermedio (S/20), Avanzado (S/30)
2. **Quota enforcement**: 5 / 30 / unlimited propuestas per month
3. **Demo billing**: Culqi integration ready, operates in demo mode without keys

### Etapa 2 — Beta

4. Commission per closed lead
5. Featured offer placement (pay-to-boost)
6. Real Culqi payments

### Etapa 3 — Scale

7. Scoring API for fintechs and banks
8. Proprietary lending on top of marketplace data

---

## Plan Tiers

| Plan       | Price (S/) | Propuestas/mes | Features                                            |
| ---------- | ---------- | -------------- | --------------------------------------------------- |
| Básico     | 10         | 5              | Marketplace access, email support                   |
| Intermedio | 20         | 30             | Priority support, management tools, monthly reports |
| Avanzado   | 30         | Ilimitadas     | Priority visibility, category alerts, multi-user    |

---

## Prototype scope (Etapa 1)

### Shipped

- Email/password auth for clients + businesses
- Publish solicitud with photos, category, brand, model, amount, term
- Receive, compare, accept propuestas
- Redemption codes (EMP-XXXXX)
- Operation lifecycle (pending_pickup → completed / disputed / expired)
- Subscription plans + demo billing
- Rate limiting, error sanitization, structured logging, audit trail
- Private storage bucket with signed URLs
- RLS hardening, performance indexes, bg jobs (GC, expiration)

### Deferred

- Real Culqi payments (demo mode active)
- Google/Apple OAuth
- Multi-user business accounts (schema ready, UI pending)
- Push notifications, email notifications
- Image optimization pipeline
- Native mobile app

---

## Naming Convention

| Domain            | Language | Examples                                                |
| ----------------- | -------- | ------------------------------------------------------- |
| Tables / entities | Spanish  | `solicitudes`, `propuestas`, `operaciones`              |
| Infrastructure    | English  | `profiles`, `businesses`, `audit_logs`, `subscriptions` |
| Status enums      | English  | `'pending'`, `'accepted'`, `'expired'`                  |
| UI copy           | Spanish  | "Publicar artículo", "Enviar propuesta"                 |
| Code identifiers  | English  | `acceptPropuesta`, `solicitudId`                        |

---

## Constraints

- PEN currency only. No multi-currency before Etapa 3.
- Lima first, then Arequipa / Trujillo. District filtering from day one.
- Photos mandatory on solicitud (1-6), 5 MB cap per photo.
- Business verification manual, 48h SLA business days.

---

**See also**: `ARCHITECTURE.md`, `SCALABILITY.md`, `UI-UX.md`, `API.md`
