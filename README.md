# EMPEÑALO

Plataforma de empeños que conecta clientes con casas de empeño en Lima, Peru.

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

| Plan       | Precio (S/) | Propuestas/mes |
| ---------- | ----------- | -------------- |
| Básico     | S/ 10       | 5              |
| Intermedio | S/ 20       | 30             |
| Avanzado   | S/ 30       | Ilimitadas     |

---

## Cuentas de prueba

### Clientes de demo

| Email                          | Contraseña  | Nombre         |
| ------------------------------ | ----------- | -------------- |
| `demo.cliente1@empenalo.local` | `Demo2026!` | María González |
| `demo.cliente2@empenalo.local` | `Demo2026!` | Carlos Mendoza |
| `demo.cliente3@empenalo.local` | `Demo2026!` | Lucía Torres   |
| `demo.cliente4@empenalo.local` | `Demo2026!` | Javier Ruiz    |
| `demo.cliente5@empenalo.local` | `Demo2026!` | Ana Castillo   |

### Negocios de demo

| Email                          | Contraseña  | Negocio               | Distrito          |
| ------------------------------ | ----------- | --------------------- | ----------------- |
| `demo.negocio1@empenalo.local` | `Demo2026!` | Joyería Miraflores    | Miraflores        |
| `demo.negocio2@empenalo.local` | `Demo2026!` | Empeños Lima Centro   | Cercado de Lima   |
| `demo.negocio3@empenalo.local` | `Demo2026!` | Casa Oro Surco        | Santiago de Surco |
| `demo.negocio4@empenalo.local` | `Demo2026!` | Préstamos San Isidro  | San Isidro        |
| `demo.negocio5@empenalo.local` | `Demo2026!` | Oro Express San Borja | San Borja         |

### Cuentas de desarrollo

| Rol     | Email                         | Contraseña         |
| ------- | ----------------------------- | ------------------ |
| Cliente | `cliente.test@empenalo.local` | `TestCliente2026!` |
| Negocio | `negocio.test@empenalo.local` | `TestNegocio2026!` |

---

## Seeder

El script `scripts/seed.ts` genera datos de demo completos: 5 clientes, 5 negocios, 20 solicitudes, propuestas aleatorias y operaciones aceptadas.

### Requisitos

- `.dev.vars` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configurados
- Email confirmation deshabilitado en Supabase Dashboard (Auth → Settings)

### Ejecutar

```bash
bun run seed
```

### Lo que crea

- 5 clientes demo con perfiles
- 5 negocios demo (trigger `handle_new_user` auto-crea negocio + suscripción trialing)
- 20 solicitudes en categorías: celular, laptop, joya, reloj, vehículo, otro
- 0-4 propuestas por solicitud (montos, tasas, plazos realistas)
- 5 propuestas aceptadas con código de redención `EMP-XXXXX`

---

## Stack técnico

| Capa       | Tecnología                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 19 + TypeScript                           |
| Framework  | TanStack Start (SSR) + TanStack Router          |
| Estilos    | Tailwind CSS v4 + Radix UI                      |
| Estado     | TanStack Query (React Query)                    |
| Validación | Zod + React Hook Form                           |
| Backend    | Supabase (Auth + Postgres + Storage)            |
| Pagos      | Culqi (Peru) — demo mode sin keys               |
| Deploy     | Netlify (`@netlify/vite-plugin-tanstack-start`) |
| Runtime    | Bun 1.3.13                                      |

---

## Empezar

### Requisitos

- Bun >= 1.3
- Cuenta Supabase (proyecto `raoprigiowskqnylapqs`)
- `.dev.vars` con `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Instalación

```bash
bun install
```

### Desarrollo

```bash
bun dev          # http://localhost:8080
```

### Base de datos

```bash
npx supabase@latest db push   # aplicar migraciones
bun run seed                  # poblar datos demo
```

### Build

```bash
bun run build      # build producción
bun run lint       # ESLint
bun run format     # Prettier
```

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
docs/                 Documentación (arquitectura, roadmap)
```

---

## Enlaces

- Producción: https://empenalo.netlify.app
- Supabase Dashboard: https://supabase.com/dashboard/project/raoprigiowskqnylapqs
