# UI-UX.md — EMPEÑALO Screen Behavior, Copy, Validation

> Frontend behavior reference. Pairs with `DESIGN-SYSTEM.md` (visual tokens) and `PRODUCT.md` (scope).
>
> **Spanish-only UI copy.** Currency formatted as `S/`. Lima district conventions.

---

## Responsive strategy (locked)

- **Mobile-first viewport.** All screens must work at 375 px width.
- **Desktop is a real responsive web app — not a centered mobile frame.** Phone-frame wrappers are forbidden on `≥md` (768 px+).
- **Tablet (768–1023 px)** is a hybrid layout — centered card with comfortable padding.
- **Touch targets** ≥ 44×44 px on mobile. Inputs ≥ 48 px tall.
- Use `100dvh`, **never** `100vh` (mobile address-bar jitter).
- **Sticky bottom CTA** on long mobile forms.
- No horizontal scroll on core flows. Mobile uses stacked cards; desktop can render tables.

### Critical fix already in flight
- Auth screens (`/app/login`, `/app/register`, `/negocio/login`, `/negocio/register`, forgot-password) must NOT render inside a phone-frame on desktop. The `feat/ui-ux-improvements` branch fixed this — verify before extending.

---

## Landing (`/`)

Per `MODIFI-EMPENA.md`:

1. **Remove** strong speed promises that can't be guaranteed.
2. **Counters start at 0.** No fake social proof until real numbers exist.
3. **Hide highlighted landing section** that shouldn't appear (Lovable artifact).
4. **Copy change**: "ofertas en minutos" → **"múltiples ofertas"**.
5. **Iniciar sesión** must go to web-format auth (NOT mobile-frame view). See auth section.
6. CTAs:
   - "Soy cliente" → `/app/login?redirect=/app`
   - "Soy negocio" → `/negocio/login?redirect=/negocio`

Layout:
- Mobile: stacked sections, hero → value props → CTA pair.
- Desktop: hero left + brand panel right OR centered hero with two CTA buttons side-by-side.

---

## Auth (cliente — `/app/login`, `/app/register`)

### Layout
- Mobile: full-width form, no card chrome.
- Tablet: centered card max-width 480 px.
- Desktop: centered web card max-width 480 px, optional brand panel right (logo + tagline). **No phone-frame.**
- Back arrow (`ArrowLeft` lucide icon) top-left → returns to `/`.

### Login (`/app/login`)
- Tab toggle: **Correo** / **DNI** (DNI tab visible but submit disabled — `title="En desarrollo — disponible próximamente"`).
- Email mode: email + password + "Olvidé mi contraseña" → `/app/forgot-password`.
- DNI mode: 8-digit numeric input + banner "Verificación con DNI **en desarrollo**. Usa correo por ahora."

### Register (`/app/register`)

Per `MODIFI-EMPENA.md` ordering:

**Option 1 — OAuth (Google, Apple — planned)**:
After OAuth, completion view asks:
1. DNI input → auto-completes full name (RENIEC integration — scaffolded as "en desarrollo" in Etapa 1).
2. Full name (auto-filled, editable).
3. Phone number with optional verification.
4. "Completar registro" CTA.

**Option 2 — Manual**:
Reordered fields:
1. DNI input → auto-completes full name.
2. Full name (auto-filled, editable).
3. Email (with optional verification).
4. Password (min 6 chars).
5. Phone number (optional verification).
6. "Completar registro" CTA.

**Removed**: take-a-photo-of-DNI option. Use input only.

### Forgot password (`/app/forgot-password`)
- Email input → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/app/reset-password })`.
- Success state: green banner "Te enviamos un correo con instrucciones."
- Reset confirmation screen (`/app/reset-password?token=…`) — **planned, not yet built**.

---

## Auth (negocio — `/negocio/login`, `/negocio/register`)

Same layout pattern as cliente but with B2B badge in header.

### Register (`/negocio/register`)

Per `MODIFI-EMPENA.md`:
1. **DNI representante legal** (separate from business RUC).
2. **RUC verification** — auto-fetches razón social + representante legal (SUNAT scaffold; manual Etapa 1).
3. Email + optional verification.
4. Business basics: trade_name, district, phone, address.
5. **Horario** — per-day manual input (lun/mar/mié/jue/vie/sáb/dom × abre/cierra).
6. Plan selection AFTER verification clears — show pending state copy "Tu negocio está en verificación (48h hábiles, 9:00–18:00 hora Lima)."

### Verification copy (locked)
> "Tu cuenta está pendiente de verificación. Esto toma hasta **48 horas hábiles** (lunes a viernes, 9:00–18:00 hora Lima). Te avisaremos por correo cuando esté lista."

NOT "48 hours" — must read "48 horas hábiles" + working-hours clarification.

---

## Vista Cliente (`/app/dashboard`)

Per `MODIFI-EMPENA.md`:
1. **Web layout** — not centered mobile mockup on desktop.
2. **Empty state** when no publicaciones:
   - Title: "Aún no tienes publicaciones"
   - Body: "Publica un artículo y comienza a recibir ofertas de casas de empeño afiliadas."
   - CTA: "Publicar artículo" → `/app/publish`.
3. **Counters start at 0.** Solicitudes activas, ofertas recibidas, operaciones completadas — all zero until data exists.

Bottom navigation on mobile (Dashboard / Publicar / Operaciones / Cuenta). Hidden on desktop in favor of top nav.

---

## Publicar artículo (`/app/publish`)

### Layout
- Mobile: step-flow with sticky bottom action ("Continuar" / "Publicar").
- Desktop: rich single-page layout with sticky summary panel right.

### Category-specific fields

Each categoría has its own form section. Implement in `src/lib/categories/` as Zod schemas per category.

#### Celular
- Marca
- Modelo
- **Año que fue comprado** (NOT "year" — copy must be "año de compra")
- ¿Fue reparado? (sí / no)
- **Si es iPhone**: capacidad de batería (%)
- Almacenamiento (GB)
- Color

#### Laptop
- Marca
- Modelo
- Año de compra
- Procesador
- RAM (GB)
- Almacenamiento
- ¿Fue reparada? (sí / no)

#### Joya
- Tipo de joya (anillo / collar / pulsera / aretes / otro)
- Material (oro / plata / otro)
- Kilataje
- Peso aproximado (g)
- Tipo de piedras (si aplica)
- Marca (si aplica)
- Tasación previa (opcional, upload PDF)

#### Reloj
- Marca
- Modelo
- Año de compra
- Material
- ¿Tiene caja original? (sí / no)

#### Vehículo
- Marca
- Modelo
- Año de compra
- Kilometraje
- Tipo de transmisión (manual / automático)
- Combustible (gasolina / diesel / GLP / eléctrico / híbrido)
- SOAT vigente (sí / no)
- Revisión técnica vigente (sí / no)
- **Upload tarjeta de propiedad** (PDF / imagen)

#### Moto
- Marca · Modelo · Año de compra · Kilometraje
- Motor: eléctrico o combustible
- Upload tarjeta de propiedad

#### Electrodoméstico
- Tipo (refrigeradora / lavadora / cocina / microondas / horno / otro)
- Marca · Modelo · Año aproximado de compra

#### Consola de videojuegos
- Marca (PlayStation / Xbox / Nintendo / otro)
- Modelo · Capacidad
- ¿Controles incluidos? · Año aproximado · ¿Tiene caja?

#### Cámara / equipo audiovisual
- Marca · Modelo · Año aproximado · ¿Lentes incluidos?

#### Herramientas profesionales
- Tipo · Marca · Modelo · Año aproximado

#### Instrumentos musicales
- Tipo · Marca · Modelo · ¿Incluye accesorios?

#### Artículo de lujo (bolso)
- Marca · Modelo
- (Authenticity check planned Etapa 2)

### Opciones avanzadas (all categorías)
1. **Monto esperado** — `expected_amount_pen` (numeric, S/).
2. **Plazo deseado** — radios: 15d / 30d / 60d / **Otros** (input manual days).

### Photos
- Mandatory 1–6.
- 5 MB hard cap per file.
- Client compression target <500 KB.
- Bucket private — signed URLs (1 h) via `buildSignedPhotoUrl()`.

---

## Publicación activa (`/app/proposals?solicitud=...`)

Per `MODIFI-EMPENA.md`:
1. **Web format** on desktop — table-style or rich card grid.
2. **Remove** "<30 min" wait copy.
3. **Filters**: Mayor monto / Menor tasa / Mayor plazo (radio or pill).
4. **Proposal comparison** view: side-by-side on desktop, stacked cards on mobile.
5. Each propuesta card shows: monto, tasa mensual, plazo, business name + verified badge + district, "Aceptar" + "Rechazar" CTAs.
6. **Featured propuestas** pinned top with brand-border + "Destacada" badge (see `DESIGN-SYSTEM.md`).

---

## Código de redención (`/app/code?operation=...`)

After accepting a propuesta:
1. Big tabular-nums display of `EMP-XXXXX` code.
2. Subtitle: "Presenta este código en {trade_name} para concretar."
3. Business address + map link (opens Google Maps).
4. Business phone (tel:).
5. Expiry: 72 h. Show countdown.
6. CTA: "Ver detalle de la propuesta".

---

## Vista Negocio (`/negocio/*`)

### Dashboard (`/negocio/dashboard`)
- Plan + quota widget (propuestas usadas / cap).
- Featured credits remaining (post-0006).
- Recent solicitudes feed (filtered by district + categorías of interest).
- Mis propuestas activas.
- Operaciones pendientes de pickup (with code lookup input).

### Explorar solicitudes (`/negocio/solicitudes`)
- Filters: categoría · distrito · monto rango · plazo.
- Sort: más reciente / mayor monto esperado.
- Each card: thumbnail + título + categoría + distrito + monto esperado + propuestas ya enviadas (count).

### Enviar propuesta (`/negocio/solicitud/[id]`)
- Photos gallery (signed URLs).
- Form: monto, tasa mensual, plazo, notas (≤500 chars).
- Below-cap usage banner. Above-cap → CTA "Mejorar plan".
- Toggle "Destacar esta propuesta" (post-0006).

### Validar código (`/negocio/operacion/[id]`)
- Input code → on match, "Marcar completada" / "Marcar disputada" CTAs.
- Build a **clear code-verification screen** per `MODIFI-EMPENA.md`: large input, visible button, success confirmation toast.

---

## Lima districts (canonical list)

Used in district picker + business address validation.

Miraflores · San Isidro · Santiago de Surco · San Borja · Cercado de Lima · La Molina · Surquillo · Barranco · Chorrillos · Pueblo Libre · Magdalena · Jesús María · Lince · San Miguel · Los Olivos · Independencia · San Martín de Porres · Comas · Callao · Bellavista · La Victoria · Breña · Rímac · Ate · Santa Anita · San Luis · El Agustino · San Juan de Lurigancho · San Juan de Miraflores · Villa El Salvador · Villa María del Triunfo · Lurín · Pachacámac

Source for autocomplete: maintain in `src/lib/lima-districts.ts`.

---

## Copy library — error messages (Spanish-only)

| Scenario | Message |
|---|---|
| Auth required | `"No autenticado. Inicia sesión para continuar."` |
| Rate limit | `"Demasiados intentos. Intenta en una hora."` |
| Plan limit | `"Has alcanzado el límite de N propuestas de tu plan."` |
| No subscription | `"Tu negocio no tiene una suscripción activa."` |
| Generic create error | `"Error al crear la solicitud."` |
| Generic update error | `"No pudimos actualizar tus datos. Intenta de nuevo."` |
| Photo upload | `"Error al guardar las fotos."` |
| Code mismatch | `"Código de redención no coincide."` |
| Operation completed already | `"Operación ya completada."` |
| Verification pending | `"Tu cuenta está pendiente de verificación. Te avisaremos por correo."` |
| Demo mode | `"Modo demo — sin cobro real."` |

Never leak raw DB errors. Use `sanitizeError(err, "Mensaje en español")`.

---

## Accessibility checklist

- All interactive elements keyboard-reachable.
- Focus rings visible (not removed by `:focus { outline: none }`).
- `aria-label` on icon-only buttons (e.g., back arrow → "Volver al inicio").
- Form errors `aria-describedby` linked to inputs.
- Color contrast ≥ AA (light AND dark themes — already validated in `DESIGN-SYSTEM.md` brand-shade choice).
- `aria-live="polite"` on toast region.
- Screen reader: money read as "X soles" via `aria-label`.

---

## Responsive QA checklist

### Desktop (≥1024 px)
- [ ] `/app/login` renders as web card (no phone-frame wrapper).
- [ ] `/negocio/login` same.
- [ ] Solicitud detail comparison uses rich multi-column layout.
- [ ] "Mis publicaciones" can render as table.
- [ ] Sticky summary panel on `/app/publish`.

### Mobile (375–414 px)
- [ ] Bottom navigation visible on authenticated routes.
- [ ] Forms usable at 375 px.
- [ ] No horizontal scroll on core flows.
- [ ] Publish form uses step flow + sticky action.
- [ ] Touch targets ≥ 44 px.

### Tablet (768–1023 px)
- [ ] Hybrid layout works (centered card with comfortable padding).
- [ ] Auth card centered, no phone-frame.

---

**See also**: `DESIGN-SYSTEM.md`, `PRODUCT.md`, `TESTING.md` (QA flows).
