# API Reference

Authoritative reference for all server functions and HTTP endpoints exposed by EMPEÑALO.

> **Transport.** All "Server fn" entries are TanStack Start server functions created via `createServerFn({ method })` and invoked from React Query / route loaders. They share the same auth cookie. Inputs validated with Zod where indicated.

> **Auth.** Most calls require an authenticated Supabase user (cookie-based). The current row-level-security policies enforce per-role and per-owner read/write access in the database; the server fns rely on RLS for fine-grained gates.

> **Errors.** User-facing messages are in Spanish. Internal DB errors are stripped via `sanitizeError(err, userMessage)` before reaching the client.

---

## 1. Auth

### `getCurrentUser` — `GET`

Returns the logged-in user + their profile, or `null`. Called from route `beforeLoad` guards.

- **Input**: none
- **Auth**: optional (`null` if unauthenticated)
- **Returns**:
  ```ts
  {
    user: { id: string; email: string | null };
    profile: { id: string; role: "client" | "business"; full_name: string | null };
  } | null
  ```

### `signOut` — `POST`

Server-side sign-out. Clears Supabase auth cookies.

- **Input**: none
- **Auth**: required
- **Returns**: `{ ok: true }`

---

## 2. Business context

### `getBusinessContext` — `GET`

Returns the current business owner's business + active subscription. Used by `BusinessLayout` to render the plan / quota widget.

- **Input**: none
- **Auth**: required (business role)
- **Returns**:
  ```ts
  {
    business: { id: string; name: string; district: string | null };
    subscription: {
      id: string;
      status: "active" | "trialing" | "past_due" | "canceled";
      plan: { id; name; price_pen; monthly_propuestas };
      propuestas_used_this_period: number;
      propuestas_remaining: number | null;  // null = unlimited
      current_period_end: string | null;
    } | null;
  } | null
  ```

---

## 3. Solicitudes (client requests)

### `createSolicitud` — `POST`

Client posts a new pawn request.

- **Rate limit**: 10 per user per hour.
- **Input** (Zod-validated):
  ```ts
  {
    category: string;             // required
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    storage?: string | null;
    condition?: string | null;
    description?: string | null;
    expected_amount_pen?: number | null;
    expected_term_days?: number | null;
    district?: string | null;
    photo_paths: string[];        // pre-uploaded storage paths
  }
  ```
- **Auth**: required
- **Returns**: `{ id: string }`
- **Errors**: `"No autenticado"`, `"Demasiadas solicitudes. Intenta en una hora."`, `"Error al crear la solicitud."`, `"Error al guardar las fotos."`

### `listMySolicitudes` — `GET`

Client dashboard — own solicitudes with propuesta counts.

- **Input**: none
- **Returns**: `SolicitudListItem[]`

### `listActiveSolicitudes` — `GET`

Business marketplace view. Max 60 rows.

- **Input** (optional Zod object):
  ```ts
  { category?; district?; min_amount?; max_amount?; plazo? }
  ```
- **Returns**: `SolicitudForBusiness[]` (alias of `SolicitudListItem`)

### `getSolicitud` — `GET`

Full detail with signed photo URLs.

- **Input**: `{ id: uuid }`
- **Returns**: `SolicitudDetail | null`
- **Photos**: signed URLs from private `solicitud-photos` bucket, valid 1 h (default `expiresIn`).

---

## 4. Propuestas (business offers)

### `createPropuesta` — `POST`

Business sends offer on a solicitud. Quota-gated.

- **Rate limit**: 30 per user per hour.
- **Quota**: atomic via `increment_propuestas_used` RPC. If denied after insert, the propuesta is deleted and the counter pegs at the cap.
- **Input**:
  ```ts
  {
    solicitud_id: uuid;
    monto_pen: positive int;
    tasa_mensual: nonnegative;
    plazo_dias: positive int;
    expires_at?: ISO datetime;
  }
  ```
- **Returns**: `{ id: string }`
- **Errors**: `"No autenticado"`, `"Demasiadas propuestas. Intenta en una hora."`, `"Tu negocio no tiene una suscripción activa."`, `"Has alcanzado el límite de N propuestas de tu plan..."`

### `listPropuestasForSolicitud` — `GET`

Client viewing offers on their own solicitud. Sorted by `monto_pen` DESC.

- **Input**: `{ solicitud_id: uuid }`
- **Returns**: `PropuestaForClient[]`

### `getPropuestaForClient` — `GET`

Single propuesta detail via client deep-link.

- **Input**: `{ propuesta_id: uuid }`
- **Returns**: `PropuestaForClient | null`

### `listMyPropuestas` — `GET`

Business viewing their own outgoing offers (with linked operation when accepted).

- **Input**: none
- **Returns**: `PropuestaForBusiness[]`

### `acceptPropuesta` — `POST`

Client accepts an offer. Creates an `operations` row with a generated 5-char base32 redemption code (`EMP-XXXXX`).

- **Rate limit**: 10 per user per hour.
- **Input**: `{ propuesta_id: uuid }`
- **Returns**:
  ```ts
  {
    operation_id: string;
    propuesta_id: string;
    redemption_code: string;  // "EMP-XXXXX"
  }
  ```

### `rejectPropuesta` — `POST`

Client rejects an offer. Does **not** close the solicitud.

- **Input**: `{ propuesta_id: uuid }`
- **Returns**: `{ ok: true }`

---

## 5. Operations (accepted propuestas)

### `listMyClientOperations` — `GET`

Client side. RLS restricts to current client's operations.

- **Returns**: `ClientOperation[]`

### `listMyBusinessOperations` — `GET`

Business side. RLS restricts to ops on the business's own propuestas.

- **Returns**: `BusinessOperation[]`

### `markOperationCompleted` — `POST`

Business confirms in-store handoff is done. Requires matching redemption code.

- **Input**: `{ operation_id: uuid; redemption_code: string }`
- **Returns**: `{ ok: true }`
- **Errors**: `"Operación no encontrada."`, `"Código de redención no coincide."`, `"Operación ya completada."`

### `getOperationByPropuesta` — `GET`

Fetch operation tied to a propuesta. Used by client redemption-code page after accept.

- **Input**: `{ propuesta_id: uuid }`
- **Returns**: `ClientOperation | null`

---

## 6. Billing

### `listPlans` — `GET`

Public catalog (Básico / Intermedio / Avanzado). Sorted by `price_pen` ASC.

- **Returns**: `Plan[]`
  ```ts
  { id; name; price_pen; monthly_propuestas: number | null; features: string[] }
  ```

### `listMyInvoices` — `GET`

Current business invoice history.

- **Auth**: required (business)
- **Returns**: `Invoice[]`

### `startCheckout` — `POST`

Initiate plan upgrade. Two paths based on Culqi config:

- **Live mode** (`CULQI_SECRET_KEY` set + `token_id` provided): real Culqi charge, then flip plan.
- **Demo mode** (no `CULQI_SECRET_KEY`): record `status='demo'` invoice and flip plan immediately.

- **Input**:
  ```ts
  { plan_id: string; token_id?: string }
  ```
- **Live mode requires `token_id`**: missing → throws `"token_id requerido (Culqi en modo live)."` (P1 fix — prevents silent demo upgrade in live mode).
- **Returns**:
  ```ts
  {
    ok: true;
    mode: "live" | "demo";
    subscription_id: string;
    invoice_id: string;
    plan_id: string;
  }
  ```

### `getBillingMode` — `GET`

Tells the UI whether live charges are wired.

- **Returns**: `{ mode: "live" | "demo" }`

---

## 7. Webhook

### `POST /api/culqi-webhook`

Receives Culqi event callbacks. HMAC-SHA256 signature verification via Web Crypto API; rejects unsigned or mismatched payloads.

- **Headers**: `X-Culqi-Signature` (HMAC), `Content-Type: application/json`
- **Body**: Culqi event payload (charge succeeded / failed / refunded).
- **Side effects**: updates `invoices.status` + `invoices.paid_at`.
- **Returns**: `200 { received: true }` on accept, `400`/`401` on bad signature.

**Configure** in Culqi dashboard once `CULQI_SECRET_KEY` lands:
```
https://empenalo.netlify.app/api/culqi-webhook
```

---

## 8. Stored procedures (DB-level)

Server fns call these SECURITY DEFINER functions for atomic operations. See `supabase/migrations/000{1..5}_*.sql` for definitions.

| RPC | Purpose | Returns |
|---|---|---|
| `increment_propuestas_used` | Atomic quota counter + cap check | `(used integer, allowed boolean)` |
| `change_subscription_plan` | Flip business sub to new plan + period | `subscriptions` row |
| `record_invoice` | Insert invoice row tied to subscription | `invoices` row |
| `accept_propuesta` | Mark accepted + create operation row | `operations` row |
| `find_orphan_photos(interval)` | List unreferenced storage objects | `(storage_path, created_at, size_bytes)` |
| `gc_orphan_storage` | Delete orphan photos (advisory-locked) | `integer` (n removed) |
| `expire_stale_rows` | Expire pending/active rows past deadline | `integer` (n updated) |

Scheduled jobs via `pg_cron`:
- `gc-orphan-storage` — daily 03:00 UTC.
- `expire-stale-rows` — hourly.

### Planned in `0006_monetization.sql` (not yet applied — see `REDESIGN-ROADMAP.md`)

| RPC / view | Purpose | Returns |
|---|---|---|
| `compute_commission(monto_pen, categoria, plan_slug)` | Lookup most-specific active config + apply mode | `numeric(10,2)` |
| `accept_propuesta` *(extended)* | Adds commission ledger write + plan slug lookup | `(operation_id uuid, redemption_code text, commission_pen numeric)` |
| `boost_propuesta(propuesta_id, hours, use_credit, payment_id)` | Atomic credit deduct OR record purchased boost | `uuid` (featured_offer.id) |
| `v_active_featured_propuestas` | View for feed-side filtering on active boosts | rows: `(propuesta_id, solicitud_id, business_id, featured_until)` |

### Planned tables (0006)
- `commission_config` — per-(categoría, plan_slug) commission rules with effective windows.
- `featured_offers` — one row per boost (plan credit or purchased).
- `payments` — gateway-abstracted payment records (Culqi default; Stripe parked).
- `commissions` — append-only ledger; one row per accepted propuesta, snapshot of config used.

See `BILLING.md` for end-to-end flows.

---

## 9. Conventions

- **Currency**: integer `S/` (PEN), no decimals. `price_pen: 4900` = 49 soles.
- **Redemption codes**: `EMP-XXXXX`, alphabet `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `0/1/I/O`).
- **Timestamps**: ISO 8601 UTC strings.
- **Pagination**: not currently exposed — marketplace caps at 60 rows.
- **Idempotency**: webhooks are tolerant of replay (status flip is idempotent); `startCheckout` is not (caller must dedupe in UI).
