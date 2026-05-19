# EMPEÑALO

Plataforma de empeños que conecta clientes con casas de empeño en Lima, Peru.

**Producción**: https://empenalo.netlify.app

---

## Flujo de usuario

```
┌────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (móvil)                           │
│                                                                    │
│  1. Registro      2. Publica         3. Recibe       4. Acepta     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │ Crea     │    │ Describe │    │ Compara  │    │ Elige la │    │
│  │ cuenta   │───▶│ artículo │───▶│ ofertas  │───▶│ mejor    │    │
│  │ cliente  │    │ + fotos  │    │ recibidas│    │ propuesta│    │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘    │
│                                                       │          │
│  5. Recibe código                                      │          │
│  ┌──────────┐                                          │          │
│  │ EMP-XXXX │◀─────────────────────────────────────────┘          │
│  │ Código de│                                                     │
│  │ redención│──▶ Presenta en tienda para completar                │
│  └──────────┘                                                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        NEGOCIO (escritorio)                        │
│                                                                    │
│  1. Registro      2. Explora        3. Envía         4. Concreta   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │ Crea     │    │ Navega   │    │ Propone  │    │ Cliente  │    │
│  │ cuenta   │───▶│ solicitu-│───▶│ monto +  │───▶│ llega con│    │
│  │ negocio  │    │ des      │    │ tasa +   │    │ código   │    │
│  │ + plan   │    │ activas  │    │ plazo    │    │ EMP-XXXX │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│                                                                    │
│  5. Dashboard — monitorea propuestas enviadas, aceptadas, historial│
└────────────────────────────────────────────────────────────────────┘
```

| Paso | Cliente (`/app/*`)                                                                    | Negocio (`/negocio/*`)                                  |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | Se registra con email + contraseña                                                    | Se registra con email + contraseña + nombre del negocio |
| 2    | Publica artículo: categoría, marca, modelo, descripción, monto esperado, plazo, fotos | Elige plan (Básico / Intermedio / Avanzado)             |
| 3    | Recibe ofertas de casas de empeño                                                     | Explora solicitudes activas con filtros                 |
| 4    | Compara montos, tasas, plazos                                                         | Envía propuesta con monto, tasa mensual, plazo          |
| 5    | Acepta la mejor propuesta → recibe código `EMP-XXXXX`                                 | Ve propuestas aceptadas + código de redención           |
| 6    | Presenta código en tienda para concretar                                              | Valida código en persona + marca operación completada   |

---

## Funcionalidades

### Portal Cliente (`/app/*`)

| Funcionalidad                  | Ruta                          |
| ------------------------------ | ----------------------------- |
| Registro / Login               | `/app/register`, `/app/login` |
| Dashboard (mis solicitudes)    | `/app/dashboard`              |
| Publicar artículo para empeñar | `/app/publish`                |
| Ver ofertas recibidas          | `/app/proposals`              |
| Comparar y aceptar propuesta   | `/app/proposal-detail`        |
| Código de redención            | `/app/code`                   |
| Historial de operaciones       | `/app/history`                |

### Portal Negocio (`/negocio/*`)

| Funcionalidad                           | Ruta                                  |
| --------------------------------------- | ------------------------------------- |
| Registro / Login                        | `/negocio/register`, `/negocio/login` |
| Dashboard (métricas)                    | `/negocio/dashboard`                  |
| Explorar solicitudes activas            | `/negocio/solicitudes`                |
| Detalle de solicitud + enviar propuesta | `/negocio/solicitud`                  |
| Mis propuestas enviadas                 | `/negocio/propuestas`                 |
| Detalle de propuesta + código           | `/negocio/propuesta`                  |
| Historial de operaciones                | `/negocio/historial`                  |
| Planes y facturación                    | `/negocio/plan`, `/negocio/perfil`    |

### Suscripciones

#### Estado actual (migraciones 0001–0005)

| Plan       | Precio (S/) | Propuestas/mes |
| ---------- | ----------- | -------------- |
| Básico     | S/ 10       | 5              |
| Intermedio | S/ 20       | 30             |
| Avanzado   | S/ 30       | Ilimitadas     |

#### Planeado en `0006_monetization.sql` (ver [docs/REDESIGN-ROADMAP.md](./docs/REDESIGN-ROADMAP.md))

| Plan      | Slug     | Propuestas/mes | Sucursales | Créditos destacar/mes | Notif RT | Dashboard | Reportes | Soporte |
| --------- | -------- | -------------- | ---------- | --------------------- | -------- | --------- | -------- | ------- |
| Gratuito  | `free`   | 10             | 1          | 0                     | —        | —         | —        | comunidad |
| Plus      | `starter`| 50             | 1          | 2                     | ✅       | simple    | —        | email   |
| Premium   | `pro`    | ilimitadas     | 5          | 10                    | ✅       | full      | ✅       | priority |
| Pro       | `unlim`  | ilimitadas     | 15         | 30                    | ✅       | full      | ✅       | priority |

Comisiones por trato cerrado, ofertas destacadas (créditos + compra) y pasarela Culqi (con fallback demo) se documentan en [docs/BILLING.md](./docs/BILLING.md).

---

## Stack técnico

| Capa        | Tecnología                                                |
| ----------- | --------------------------------------------------------- |
| Frontend    | React 19 + TypeScript                                     |
| Framework   | TanStack Start (SSR) + TanStack Router (file routes)      |
| Build       | Vite 7 vía `@lovable.dev/vite-tanstack-config`            |
| Estilos     | Tailwind CSS v4 (CSS-first en `src/styles.css`) + shadcn  |
| Estado     | TanStack Query (React Query)                              |
| Validación  | Zod + React Hook Form                                     |
| Backend     | Supabase (Auth + Postgres + Storage) — proyecto `raoprigiowskqnylapqs` |
| Pagos       | Culqi (Peru) — demo mode sin keys, live con HMAC webhook  |
| Deploy      | Netlify (`@netlify/vite-plugin-tanstack-start`)           |
| Runtime     | Node 22 (Netlify Functions)                               |
| Package mgr | Bun 1.3.13                                                |
| Tests       | Playwright (E2E wired — sin archivos aún)                |

---

## Empezar (desarrollo)

Requisitos: Bun >= 1.3 + cuenta Supabase + archivo `.dev.vars` con las llaves (ver `docs/DEVELOPMENT.md` — guía interna, no publicada).

```bash
bun install
bun dev          # http://localhost:8080
bun run build    # build producción
```

Migraciones y seeder:

```bash
npx supabase@latest db push   # aplicar migraciones
bun run seed                  # poblar datos demo
```

Setup completo (variables de entorno, cuentas de prueba, deploy) en `docs/DEVELOPMENT.md`.

---

## Estructura del proyecto

```
src/
  lib/
    db/               Clientes Supabase (server, browser, admin)
    payments/         Integración Culqi
    cache.ts          Cache en memoria (cache-aside)
    logger.ts         Logging estructurado + sanitizeError
    rate-limit.ts     Rate limiting por usuario
    photos.ts         URLs firmadas (bucket privado)
    categories.ts     Categorías y formateo
  services/           Lógica de negocio (server functions)
    auth.ts           Autenticación
    solicitudes.ts    CRUD solicitudes
    propuestas.ts     Ofertas y aceptación
    operations.ts     Operaciones y redención
    business.ts       Contexto del negocio
    billing.ts        Planes y facturación
  routes/
    app/              Portal cliente (móvil)
    negocio/          Portal negocio (escritorio)
  ui/                 Componentes compartidos (primitives shadcn)
supabase/
  migrations/         Migraciones SQL (aditivas, nunca modificar)
scripts/
  seed.ts             Seeder de datos demo
docs/
  API.md              Referencia de server functions + webhook
  ARCHITECTURE.md     Arquitectura + plan de escalado
```

---

## Documentación

Cualquier agente o developer nuevo debe leer primero [docs/REDESIGN-ROADMAP.md](./docs/REDESIGN-ROADMAP.md), que indica fase actual, qué está hecho y qué decisiones quedan abiertas.

| Doc | Cuándo leer |
| --- | ----------- |
| [docs/REDESIGN-ROADMAP.md](./docs/REDESIGN-ROADMAP.md) | Plan maestro, fases, decisiones pendientes |
| [docs/PRODUCT.md](./docs/PRODUCT.md) | Visión de producto, actores, planes |
| [docs/BILLING.md](./docs/BILLING.md) | Comisiones, suscripciones, ofertas destacadas, Culqi |
| [docs/UI-UX.md](./docs/UI-UX.md) | Comportamiento de pantallas, copy, responsive, formularios por categoría |
| [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) | Tokens, componentes, colores, tipografía |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Cableado del sistema, modelo de datos |
| [docs/API.md](./docs/API.md) | Server functions, RPCs, webhook |
| [docs/SCALABILITY.md](./docs/SCALABILITY.md) | Plan de escala Etapa 1 → 2 |
| [docs/TESTING.md](./docs/TESTING.md) | Cuentas de prueba, flujos QA |
| [docs/SEEDER.md](./docs/SEEDER.md) | Spec del seeder |
| `docs/DEVELOPMENT.md` | Setup local (privado, gitignored) |

## Enlaces

## Seguridad

Nunca cometer secretos, credenciales o keys al repositorio. Variables sensibles viven en `.dev.vars` (local, gitignored) o en variables de entorno del proveedor de deploy. Ejecutar `bash scripts/security-scan.sh` antes de cada PR para detectar patrones de secretos en el diff.
