# Clerk Migration Plan — EMPEÑALO Prototype 3

## Why migrate from Supabase Auth to Clerk

| Problem with Supabase Auth | Solved by Clerk |
|---------------------------|-----------------|
| Cross-browser cookie blocking (Firefox/Safari) | OAuth redirects, no cross-origin cookies |
| Custom login/register pages to maintain | Prebuilt `<SignIn />` `<SignUp />` components |
| No social logins | Google, Apple, Facebook OAuth built-in |
| Password reset is custom code | Built-in `<SignIn />` handles recovery |
| Session management per-framework | `@clerk/tanstack-start` handles SSR sessions |
| No multi-device session management | Built-in session management + device tracking |
| No passkeys / WebAuthn | Built-in passkey support |

---

## Migration Phases

### Phase 1: Setup (30 min)
1. Create Clerk account → `clerk.com`
2. Create application → copy Publishable Key + Secret Key
3. Install SDK:
   ```
   bun add @clerk/tanstack-start
   ```
4. Add env vars:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```

### Phase 2: Auth Pages (2 hours)
Replace all 8 custom auth pages with Clerk components:
| Current (Prototype 2) | Clerk replacement |
|----------------------|-------------------|
| `app.login.tsx` | `<SignIn />` with appearance customization |
| `app.register.tsx` | `<SignUp />` with `initialValues` for role=client |
| `app.forgot-password.tsx` | Built into `<SignIn />` flow |
| `negocio.login.tsx` | `<SignIn />` |
| `negocio.register.tsx` | `<SignUp />` with role=business |
| `negocio.forgot-password.tsx` | Built into `<SignIn />` flow |
| `app.tsx` (beforeLoad) | Clerk middleware `auth().protect()` |
| `negocio.tsx` (beforeLoad) | Clerk middleware `auth().protect()` |

Custom metadata to preserve: `role: "client" | "business"`, `full_name`, `dni`, `phone`

### Phase 3: Middleware (1 hour)
```ts
// Replace beforeLoad in app.tsx
import { auth } from "@clerk/tanstack-start/server";

export const Route = createFileRoute("/app")({
  async loader(ctx) {
    await auth().protect();
  },
});
```

### Phase 4: User Data Sync (2 hours)
1. Create Clerk webhook endpoint at `/api/clerk-webhook`
2. On `user.created` event → insert into Supabase `profiles` table
3. On `user.updated` event → update Supabase `profiles` table
4. Map Clerk user ID → Supabase profiles.id
5. Keep `role` in Clerk `publicMetadata`

### Phase 5: Supabase RLS with Clerk JWT (1 hour)
1. In Supabase Dashboard → Authentication → Settings → External OIDC
2. Add Clerk as OIDC provider (Clerk provides JWKS endpoint)
3. Configure JWT audience to match Clerk app
4. `auth.uid()` now resolves to Clerk user ID
5. All existing RLS policies continue working

### Phase 6: Session Replacement (2 hours)
Replace all Supabase auth calls:
| Current (Prototype 2) | Clerk replacement |
|----------------------|-------------------|
| `getCurrentUser()` | `auth().user` |
| `getSupabaseServer()` auth calls | Keep for data access, use Clerk token for auth |
| `getSupabaseBrowser()` auth calls | `useAuth()` hook, `useUser()` hook |
| `signOut()` | `auth().signOut()` |
| Profile queries | Clerk user object + Supabase profiles join |

### Phase 7: Testing (2 hours)
- [ ] Register as client → auto-creates profile → dashboard
- [ ] Register as business → auto-creates business + subscription → dashboard
- [ ] Login → session persists across page navigations
- [ ] Password reset via email
- [ ] Publish solicitud → RLS works with Clerk UID
- [ ] Business sends propuesta → RLS works
- [ ] Accept propuesta → operation created → code shown
- [ ] Sign out → session cleared
- [ ] Multi-tab session sync
- [ ] All 3 browsers: Chrome, Firefox, Safari

---

## What stays the same

| Component | Unchanged |
|-----------|-----------|
| Supabase database | All tables, migrations, RLS policies |
| Data services | `solicitudes.ts`, `propuestas.ts`, `operations.ts`, `billing.ts` |
| UI components | `ClientLayout`, `BusinessLayout`, all shadcn/ui primitives |
| Routes | All dashboard, publish, proposals, code, history, notifications pages |
| Landing page | Branding, how-it-works section |
| Billing/Culqi | Payments, invoices, plan management |

---

## Total Effort: ~11 hours
- Core migration: 8 hours
- Testing + edge cases: 3 hours
