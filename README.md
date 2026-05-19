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

| Plan       | Precio (S/) | Propuestas/mes |
| ---------- | ----------- | -------------- |
| Básico     | S/ 10       | 5              |
| Intermedio | S/ 20       | 30             |
| Avanzado   | S/ 30       | Ilimitadas     |

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
| Runtime    | Bun 1.3+                                        |

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

- Referencia de API: [docs/API.md](docs/API.md)
- Arquitectura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Setup de desarrollo (privado): `docs/DEVELOPMENT.md`

## Seguridad

Nunca cometer secretos, credenciales o keys al repositorio. Variables sensibles viven en `.dev.vars` (local, gitignored) o en variables de entorno del proveedor de deploy. Ejecutar `bash scripts/security-scan.sh` antes de cada PR para detectar patrones de secretos en el diff.
