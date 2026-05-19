# EMPEÑALO — Design System

> Visual tokens, component specs, brand identity. Reference for UI work.
> **Brand**: Black (#0A0A0A) + Acid Green (#AAFF00). Dark mode default.

---

## Brand

- **Name**: EMPEÑALO
- **Tagline**: "Empeña tu artículo y recibe múltiples ofertas reales."
- **Personality**: Bold, trustworthy, Peruvian fintech. Dark-tech aesthetic.
- **Logo**: "E" mark in acid green on black square.

---

## Colors

### Dark Mode (default)

```css
/* Surfaces */
--color-bg: #0a0a0a;
--color-surface: #111111;
--color-surface-2: #1a1a1a;
--color-surface-offset: #222222;
--color-border: rgba(255, 255, 255, 0.08);
--color-divider: rgba(255, 255, 255, 0.06);

/* Text */
--color-text: #f0f0f0;
--color-text-muted: #888888;
--color-text-faint: #555555;
--color-text-inverse: #0a0a0a;

/* Brand — Acid Green */
--color-primary: #aaff00;
--color-primary-hover: #bbff33;
--color-primary-active: #88cc00;
--color-primary-dim: rgba(170, 255, 0, 0.12);
--color-primary-text: #0a0a0a; /* black on green buttons */

/* Semantic */
--color-success: #4ade80;
--color-error: #f87171;
--color-warning: #fbbf24;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.6);
--shadow-glow: 0 0 20px rgba(170, 255, 0, 0.15);
```

### Light Mode

```css
[data-theme="light"] {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-surface-2: #f0f0f0;
  --color-border: rgba(0, 0, 0, 0.1);
  --color-text: #0a0a0a;
  --color-text-muted: #555555;
  --color-primary: #4a7a00; /* darker for contrast */
  --color-primary-text: #ffffff;
}
```

---

## Typography

```css
--font-display: "General Sans", "Helvetica Neue", sans-serif;
--font-body: "General Sans", "Helvetica Neue", sans-serif;
--font-mono: "JetBrains Mono", monospace;

/* Fluid scale */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.75vw, 1.5rem);
--text-xl: clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem);
--text-2xl: clamp(2rem, 1.2rem + 2.5vw, 3.5rem);
```

**Rules**: Headings weight 600-700, body weight 400, buttons/labels weight 500-600. Minimum body size 16px.

---

## Spacing (4px base unit)

```
--space-1: 0.25rem    --space-4: 1rem      --space-8: 2rem
--space-2: 0.5rem     --space-5: 1.25rem   --space-10: 2.5rem
--space-3: 0.75rem    --space-6: 1.5rem    --space-12: 3rem
```

---

## Border Radius

```
--radius-sm: 6px    --radius-lg: 14px    --radius-full: 9999px
--radius-md: 10px   --radius-xl: 20px
```

| Element       | Radius                                          |
| ------------- | ----------------------------------------------- |
| Buttons       | `--radius-md` (10px), pill CTAs `--radius-full` |
| Cards         | `--radius-lg` (14px)                            |
| Inputs        | `--radius-md` (10px)                            |
| Modals/sheets | `--radius-xl` top corners                       |
| Badges/chips  | `--radius-full`                                 |

---

## Components

### Button

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
  height: 44px; /* 48px mobile touch */
  font-weight: 600;
  border-radius: var(--radius-md);
  transition:
    background 180ms ease,
    box-shadow 180ms ease;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
}
.btn-primary:active {
  background: var(--color-primary-active);
  transform: scale(0.98);
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
```

### Input

```css
.input {
  height: 48px; /* 40px desktop via md: breakpoint */
  padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
}
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}
```

### Card

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}
.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Badge

```css
.badge-active {
  background: var(--color-success-dim);
  color: var(--color-success);
}
.badge-pending {
  background: var(--color-warning-dim);
  color: var(--color-warning);
}
.badge-best {
  background: var(--color-primary);
  color: var(--color-primary-text);
}
.badge-error {
  background: var(--color-error-dim);
  color: var(--color-error);
}
```

---

## Theme Toggle

```html
<button data-theme-toggle aria-label="Cambiar modo">
  <!-- sun/moon SVG, JS flips data-theme on documentElement -->
</button>
```

```js
(function () {
  const root = document.documentElement;
  let theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  root.setAttribute("data-theme", theme);
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
  });
})();
```

---

## Performance Requirements

- LCP < 2.5s on 4G Lima
- CLS < 0.1
- First-load JS < 200KB gzip per route
- `100dvh` not `100vh` (mobile browser chrome safe)
- `prefers-reduced-motion` respected

---

## Anti-patterns

- ❌ Teal/blue palette (different product — Fleteo)
- ❌ Gradient buttons (solid green CTA only)
- ❌ Colored side-borders on cards
- ❌ Mobile phone frame/chrome on desktop auth screens
- ❌ Purple/violet in any UI element
- ❌ Icons in colored circles (flat at natural size)
- ❌ `100vh` (use `100dvh`)
- ❌ Hover-only states (always provide tap equivalents)

---

**See also**: `UI-UX.md`, `ARCHITECTURE.md`, `responsive.md` (Documentation folder)
