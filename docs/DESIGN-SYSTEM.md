# DESIGN-SYSTEM.md — EMPEÑALO Design System

> Brand locked: **black + green**, light AND dark mode. All UI reads from CSS variables defined here — never hardcode colors.

---

## Brand identity

**EMPEÑALO** — black + green. Confident, modern, slightly fintech. Green signals trust + money + go-signal; black anchors it as serious (not toy-like). Light mode for daytime use (most clientes), dark mode for night / power-user feel (negocios who live in the app).

---

## Color tokens

### Brand greens

```css
--brand-50:  #E8F8EF
--brand-100: #C6EFD4
--brand-200: #93DFA9
--brand-300: #5FCD7E
--brand-400: #2BB855
--brand-500: #15A044    /* primary CTA — locked */
--brand-600: #0E8137
--brand-700: #0A632B
--brand-800: #084A21
--brand-900: #053217
```

### Neutrals (cold, slightly green-tinted black for cohesion)

```css
--ink-50:  #F6F8F7
--ink-100: #EBEFEC
--ink-200: #D5DCD7
--ink-300: #B0BAB4
--ink-400: #7E8B83
--ink-500: #586660
--ink-600: #3F4944
--ink-700: #2A312E
--ink-800: #1A1F1C
--ink-900: #0E1311
--ink-950: #050807    /* near-pure black, page bg dark */
```

### Semantic

```css
--success: #15A044    /* same as brand-500 — green is success */
--warning: #E59500
--danger:  #DC2A2A
--info:    #2563EB
```

---

## Theme mapping

Two themes share semantic tokens; raw color vars switch based on `[data-theme]`.

```css
:root,
[data-theme="light"] {
  --color-bg:           var(--ink-50);
  --color-surface:      #FFFFFF;
  --color-surface-2:    var(--ink-50);
  --color-border:       var(--ink-200);
  --color-border-strong: var(--ink-300);
  --color-text:         var(--ink-900);
  --color-text-muted:   var(--ink-500);
  --color-text-subtle:  var(--ink-400);
  --color-text-on-brand: #FFFFFF;

  --brand-primary:       var(--brand-500);
  --brand-primary-hover: var(--brand-600);
  --brand-primary-bg:    var(--brand-50);
  --brand-primary-fg:    var(--brand-700);
}

[data-theme="dark"] {
  --color-bg:           var(--ink-950);
  --color-surface:      var(--ink-900);
  --color-surface-2:    var(--ink-800);
  --color-border:       var(--ink-700);
  --color-border-strong: var(--ink-600);
  --color-text:         var(--ink-50);
  --color-text-muted:   var(--ink-300);
  --color-text-subtle:  var(--ink-400);
  --color-text-on-brand: #FFFFFF;

  --brand-primary:       var(--brand-400);
  --brand-primary-hover: var(--brand-300);
  --brand-primary-bg:    color-mix(in oklab, var(--brand-500) 18%, transparent);
  --brand-primary-fg:    var(--brand-200);
}
```

### Why brand shifts one shade in dark mode
`brand-500` on `ink-950` doesn't meet WCAG AA contrast for normal text. `brand-400` does. Same pattern as Stripe / Linear.

### Theme application

- Persist user preference in cookie (`theme: 'light' | 'dark' | 'system'`).
- Default: `system` (read `prefers-color-scheme`).
- Apply via `<html data-theme="...">` set from cookie at request time on the server to avoid flash-of-wrong-theme.
- `<meta name="color-scheme" content="light dark">` in `<head>` so OS-level UI matches.

---

## Typography

**Fonts** (Google Fonts, self-hosted):
- **Display**: `Plus Jakarta Sans` (700, 800)
- **Body**: `Inter` (400, 500, 600)
- **Numeric (tabular)**: `Inter` with `font-feature-settings: "tnum"`

**Scale** (mobile · desktop):
```
--text-xs:   12px · 12px
--text-sm:   14px · 14px
--text-base: 16px · 16px
--text-lg:   18px · 18px
--text-xl:   20px · 22px
--text-2xl:  22px · 28px
--text-3xl:  28px · 36px
--text-4xl:  32px · 48px
--text-5xl:  40px · 64px   /* landing hero only */

--leading-tight:   1.2
--leading-snug:    1.4
--leading-normal:  1.5
--leading-relaxed: 1.6
```

**Hard rules:**
- Money always uses tabular numerals.
- Never center-align body text >2 lines.
- Never `font-style: italic` on Spanish — Inter italic distorts diacritics.

---

## Spacing

```
--space-1: 4px    --space-6: 24px
--space-2: 8px    --space-8: 32px
--space-3: 12px   --space-10: 40px
--space-4: 16px   --space-12: 48px
--space-5: 20px   --space-16: 64px
                  --space-24: 96px
```
Multiples of 4 only.

---

## Radius

```
--radius-sm:   4px    /* inputs, badges */
--radius-md:   8px    /* cards, buttons */
--radius-lg:   12px   /* modals */
--radius-xl:   20px   /* hero */
--radius-full: 9999px /* avatars, pills */
```

---

## Elevation

**Light** — soft shadows:
```css
--shadow-sm: 0 1px 2px rgba(14, 19, 17, 0.04);
--shadow-md: 0 4px 12px rgba(14, 19, 17, 0.06), 0 1px 2px rgba(14, 19, 17, 0.04);
--shadow-lg: 0 12px 32px rgba(14, 19, 17, 0.10), 0 2px 6px rgba(14, 19, 17, 0.05);
--shadow-xl: 0 24px 64px rgba(14, 19, 17, 0.14);
```

**Dark** — shadows replaced by borders:
```css
[data-theme="dark"] {
  --shadow-sm: 0 0 0 1px var(--ink-800);
  --shadow-md: 0 0 0 1px var(--ink-700);
  --shadow-lg: 0 0 0 1px var(--ink-700), 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 0 0 1px var(--ink-700), 0 16px 48px rgba(0, 0, 0, 0.7);
}
```

---

## Motion

```
--duration-instant:    80ms
--duration-fast:       150ms
--duration-base:       220ms
--duration-slow:       400ms
--duration-deliberate: 600ms

--ease-out:    cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
```

**Hard rules:**
- Animate `transform` and `opacity` only.
- Collapsing panels: `max-height` w/ `overflow: hidden`.
- `prefers-reduced-motion: reduce` disables all motion except <100ms feedback.

---

## Components — core inventory

### Button

| Variant | Bg | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `--brand-primary` | `--color-text-on-brand` | none | Main CTA per screen |
| `secondary` | `--color-surface` | `--color-text` | `--color-border` 1px | Secondary action |
| `ghost` | transparent | `--color-text` | none | Tertiary, in lists |
| `danger` | `--danger` | white | none | Destructive |
| `link` | transparent | `--brand-primary` | underline on hover | Inline |

**Sizes:** `sm` (32 px), `md` (40 px — default), `lg` (48 px — hero / mobile primary).

**States:** default · hover (bg → `--brand-primary-hover`) · active (`scale(0.98)`) · disabled (40% opacity) · loading (spinner replaces label).

```tsx
<Button variant="primary" size="md" loading={pending}>Publicar artículo</Button>
```

---

### Input / TextField

- Height: 40 px (md), 48 px (lg, mobile).
- Padding: 12 px 14 px.
- Border: 1 px `--color-border`; focused: 2 px `--brand-primary` + 4 px ring `--brand-primary-bg`.
- Label above (16 px gap), helper below (14 px, `--color-text-muted`).
- Error: border `--danger`, helper `--danger`, icon left.
- Always `aria-describedby` linking to helper.

---

### Select / Combobox
- Native `<select>` on mobile.
- Radix `Combobox` on desktop with search.

---

### Card

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card--interactive:hover { box-shadow: var(--shadow-md); cursor: pointer; }
.card--interactive:active { transform: translateY(1px); }
```

---

### Badge

| Variant | Bg | Text |
|---|---|---|
| `neutral` | `--color-border` | `--color-text-muted` |
| `brand` | `--brand-primary-bg` | `--brand-primary-fg` |
| `success` | rgba(success, 0.12) | `--success` |
| `warning` | rgba(warning, 0.12) | `--warning` |
| `danger` | rgba(danger, 0.12) | `--danger` |
| `info` | rgba(info, 0.12) | `--info` |

Status (`open`, `pending_pickup`, `expired`), categoría tag, verified shield, **featured/boost glow** (brand variant + subtle pulse).

---

### Featured propuesta visual treatment

For boosted propuestas (Etapa 1 monetization):
- Border `2px solid var(--brand-primary)` instead of 1 px `--color-border`.
- Small "Destacada" badge top-right (brand variant).
- Optional subtle glow: `box-shadow: 0 0 0 4px var(--brand-primary-bg)`.
- Position: pinned to top of propuestas list regardless of filter (with subtle "Destacada" label — transparency for trust).

---

### Money display

```tsx
function Money({ value }: { value: number }) {
  return (
    <span className="tabular-nums" aria-label={`${value} soles`}>
      S/ {value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}
```

Never italic. Default `--color-text`. `--success` only for incoming money ("Recibirás S/ X"). `--danger` only for overdue/penalty.

---

### Photo upload (solicitud-photos)
- Dropzone (desktop) / button + native picker (mobile).
- Inline 96×96 thumbnails with `×` to remove.
- Per-file progress bar.
- Client-side compression via `browser-image-compression` (target <500 KB, 5 MB hard cap).
- Reject non-image MIMEs client AND server.

---

### Filters bar

- Sticky top (40 px below header) on mobile.
- Pills: `Categoría` `Distrito` `Monto` `Plazo` → bottom-sheet (mobile) / popover (desktop).
- "Limpiar" button when ≥1 filter active.
- Selected filters as removable chips below pills.

---

### Toast
- Bottom-center on mobile, top-right on desktop.
- 4 s auto-dismiss, dismissable.
- Variants: success / error / info.
- Stack vertically; max 3 visible.

---

### Modal / Bottom-sheet
- Modal on desktop (≥768 px), centered, max-width 480 / 640 / 800 px.
- Bottom-sheet on mobile, max 90 vh.
- Backdrop blur, dismiss on Escape + backdrop click.
- Focus trap; return focus on close.

---

### Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-border) 0%,
    var(--color-border-strong) 50%,
    var(--color-border) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

---

## Iconography
- **Lucide React** — single icon family.
- Default stroke 1.5, size 20 px (inline) / 24 px (buttons).
- Custom brand marks in `src/ui/icons/` as SVG with `currentColor` so they re-theme.

---

## Illustrations
- One consistent style. Recommended: **Open Doodles** or **unDraw**, recolored to brand green.
- Hero + empty states from the same family.

---

## Component library decision
- **shadcn/ui** primitives are already in `src/ui/primitives/*` — do not modify those files (per `.claude/CLAUDE.md` hard rule).
- No second component library.

---

## Theme toggle UX

- Tri-state: `Sistema` / `Claro` / `Oscuro`.
- Place: header dropdown (desktop), `Cuenta` tab (mobile).
- Default: `Sistema`. Don't auto-switch by time of day.
- Smooth transition: fade body bg over `--duration-base`. Don't fade text (jarring).

---

## Brand asset checklist
- [ ] Logo wordmark "EMPEÑALO" (SVG)
- [ ] Isotipo (mark only, narrow contexts)
- [ ] Light / dark / 1-color variants
- [ ] Favicon (32, 16) + Apple touch (180) + PWA (512)
- [ ] OG image (1200×630) — light + dark variants
- [ ] Brand guideline 1-pager PDF
- [ ] Email signature template

---

## Tailwind v4 integration

Project uses Tailwind v4 with CSS-first config in `src/styles.css`. Tokens are declared there via `@theme inline { ... }`:

```css
@import "tailwindcss";

@theme inline {
  --color-brand-50:  var(--brand-50);
  --color-brand-100: var(--brand-100);
  /* …all brand shades… */
  --color-bg:        var(--color-bg);
  --color-surface:   var(--color-surface);
  --color-border:    var(--color-border);
  --color-text:      var(--color-text);
  --color-muted:     var(--color-text-muted);
  --color-success:   var(--success);
  --color-warning:   var(--warning);
  --color-danger:    var(--danger);
  --color-info:      var(--info);

  --font-display: var(--font-jakarta), system-ui, sans-serif;
  --font-sans:    var(--font-inter), system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
}

/* dark variant selector */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Then in components: `class="bg-brand-500 text-white dark:bg-brand-400"` etc.

> **Do NOT** import a separate `tailwind.config.ts` — Tailwind v4 is CSS-first. The Lovable wrapper (`@lovable.dev/vite-tanstack-config`) already bundles the Tailwind v4 plugin.

---

## Open design decisions
- [ ] Logo (wordmark + isotipo) — designer or DIY Figma
- [ ] Lock `brand-500` shade after ≥10 user-test impressions
- [ ] Illustration family — pick before any empty state ships

---

**See also**: `UI-UX.md`, `PRODUCT.md`.
