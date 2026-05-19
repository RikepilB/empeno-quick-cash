# EMPEÑALO — UI/UX Guide

> Screen behavior, copy, validation, responsive layout. Reference for frontend work.
> **Brand**: Black (#0A0A0A) + Acid Green (#AAFF00). Dark mode default.

---

## Platform Strategy

**Web-first, responsive.** Mobile is the primary viewport, but desktop layouts are fully supported. No native app yet (Etapa 3).

- Desktop (≥1024px): multi-column layouts, sticky panels, data tables, hover states
- Tablet (768–1023px): 2-col grids, inline nav, modal overlays
- Mobile (<768px): single-column, bottom tab bar, 48px touch targets, `100dvh`

### The login/auth rule (CRITICAL)

Auth screens (`/app/login`, `/app/register`, `/negocio/login`, `/negocio/register`) render as **centered cards** on all viewports — max-width 480px. **No phone frame wrapper on desktop.** The current PhoneFrame component should NOT wrap auth routes.

---

## Navigation

### Public (landing page)

Top bar: Logo left · "Cómo funciona" · "Planes" · "Iniciar sesión" (outlined) · "Publicar" (green CTA)

### Authenticated — Mobile (<768px)

- Top bar: Logo + Avatar
- Bottom tab bar (64px, safe-area aware `pb-[env(safe-area-inset-bottom)]`):
  - **Cliente**: Publicaciones · Publicar(+) · Notificaciones · Cuenta
  - **Negocio**: Solicitudes · Propuestas · Operaciones · Cuenta

### Authenticated — Desktop (≥1024px)

Top bar only, no sidebar:

- **Cliente**: Mis publicaciones · Publicar · Notificaciones · Avatar dropdown
- **Negocio**: Solicitudes · Mis propuestas · Operaciones · Plan · Avatar dropdown

---

## Screen Inventory

### Portal Cliente (`/app/*`)

| Screen            | Mobile                                       | Desktop                                               |
| ----------------- | -------------------------------------------- | ----------------------------------------------------- |
| Login/Register    | Centered card, full-width form               | Centered card max-w-[480px], NO phone chrome          |
| Dashboard         | Card list, 1-col                             | Data table with sortable columns                      |
| Publicar artículo | Multi-step wizard, sticky "Siguiente" bottom | Single-page form, anchor nav left, summary card right |
| Mis publicaciones | Card list, 1-col                             | 2-col card grid or data table                         |
| Ver propuestas    | Tabs: Info / Propuestas                      | Two-pane: detail left, propuestas list right          |
| Código redención  | Full-screen code card, large EMP-XXXXX       | Centered modal 480px                                  |

### Portal Negocio (`/negocio/*`)

| Screen              | Mobile                             | Desktop                                      |
| ------------------- | ---------------------------------- | -------------------------------------------- |
| Login/Register      | Centered card                      | Centered card max-w-[480px], NO phone chrome |
| Dashboard           | Stacked stat cards                 | 3-col stat grid + charts                     |
| Solicitudes activas | Card list, filters in bottom sheet | 3-col cards, filter panel left               |
| Enviar propuesta    | Full-screen drawer/modal           | Centered modal 640px max                     |
| Mis propuestas      | Card list                          | Data table with status badges                |
| Planes              | Vertical stack                     | 3-col side-by-side comparison                |

---

## Empty States

| Screen            | Message                                         | CTA                 |
| ----------------- | ----------------------------------------------- | ------------------- |
| Mis publicaciones | "Aún no tienes publicaciones."                  | "Publicar artículo" |
| Feed solicitudes  | "No hay solicitudes activas en tu zona."        | "Ajustar filtros"   |
| Mis propuestas    | "Aún no has enviado propuestas."                | "Ver solicitudes"   |
| Operaciones       | "No hay operaciones registradas."               | —                   |
| Notificaciones    | "Todo al día. No tienes notificaciones nuevas." | —                   |

---

## Form Behavior

- **Validation**: client-side via React Hook Form + Zod, server-side via Zod on `createServerFn`
- **Error display**: inline below field, red text, never toast-only
- **Submit**: button disabled while loading, spinner inside button
- **Touch targets**: ≥44px all interactive elements
- **Input heights**: 48px mobile, 40px desktop
- **Label**: always above input (never floating placeholder only)
- **`inputmode`**: required on number fields (`decimal`, `numeric`)

---

## Accessibility

- WCAG AA: 4.5:1 body text contrast
- `prefers-reduced-motion` respected globally
- `prefers-color-scheme`: dark default, light toggle available
- All images: `alt` text on solicitud photos
- Focus rings: 2px solid `--color-primary` on all interactive elements

---

## Copy Rules

- **Spanish only** throughout UI
- Currency: `S/ 2,500` format
- Redemption codes: `EMP-XXXXX` monospace
- Status labels: "Activa", "Aceptada", "Rechazada", "Expirada", "Pendiente"
- Error messages: generic, helpful, in Spanish (never expose DB internals)
- No fake data in counters — start at 0

---

## Anti-patterns

- NO phone frame/mobile chrome wrapping desktop views (auth screens)
- NO colored side-borders on cards (use surface elevation)
- NO `100vh` (use `100dvh`)
- NO hover-only states (always provide tap equivalents)
- NO gradient buttons (solid green CTA only)
- NO purple/violet/teal (brand is black + acid green)

---

**See also**: `DESIGN-SYSTEM.md`, `ARCHITECTURE.md`, `responsive.md` (Documentation folder)
