# Goal

Finish Phases 3 + 4 of EMPEÑALO (Peru pawn-shop marketplace), test end-to-end, and harden the supply chain. Phase 4 (Culqi billing) must walk in demo mode while live keys are pending.

## Current state

- Branch: `feat/phase-3-persistence`, HEAD `af32109`.
- Phase 1+2 (Supabase + auth): shipped on `caba6b9`.
- Phase 3 (persist solicitudes/propuestas/photos/operations): shipped on `b3babeb`. E2E verified via Playwright in this session: publish → bid → accept → code `EMP-PEELD` → mark concretada.
- Phase 3 hotfix `00c840e`: defensive `Array.isArray` on nested Supabase selects.
- Phase 4 (Culqi billing): shipped on `af32109`. Demo path E2E verified — biz upgraded Básico → Intermedio (S/20 demo invoice) → Avanzado (S/30 demo invoice, ilimitadas). Sidebar + invoice history update correctly.
- Security plan executed end-to-end: 7-day Bun release-age guard, deps pinned exact, `safeRedirect` on logins, `.env*` gitignored, `scripts/security-scan.sh` IOC scanner. `bun install --frozen-lockfile`: "Checked 519 installs across 655 packages (no changes)". Scan: all PASS.
- Dev server background id `b0e3xak2k`, http://localhost:8080 (still running).
- Codex CLI ready: `0.130.0`, ChatGPT login active for ridi.pillaca@gmail.com. Review gate off.

## Files in flight

None. All edits committed.

## Changed

This session's commits (newest first):

- `af32109` Phase 4 — Culqi subscription billing (demo + live). Files:
  - `supabase/migrations/0003_billing.sql` — invoices table, RPCs `change_subscription_plan`, `record_invoice`, `increment_propuestas_used`, `reset_period_usage`; relaxes solicitudes biz-read RLS.
  - `src/lib/culqi.ts` — REST client + HMAC signature verification + demo fallback when `CULQI_SECRET_KEY` missing.
  - `src/server-fns/billing.ts` — `listPlans`, `listMyInvoices`, `startCheckout`, `getBillingMode`.
  - `src/routes/api.culqi-webhook.ts` — TanStack Start API route, signature-verified.
  - `src/routes/negocio.perfil.tsx` — real plan card + plan picker + invoice history.
  - `src/server-fns/propuestas.ts` — uses `increment_propuestas_used` RPC instead of direct subscriptions update.
- `00c840e` fix(propuestas): handle array/object shape for nested supabase selects.

Configuration/infra (already committed earlier in branch):

- `bunfig.toml` — `minimumReleaseAge = 604800`, empty excludes.
- `package.json` + `bun.lock` — top-level deps pinned exact (no carets).
- `src/lib/safe-redirect.ts` + login route imports — blocks `//evil.com`, `javascript:`, `\\evil`.
- `.gitignore` — `.env`, `.env.*`, `!.env.example`, `SESSION-STATE.md`, `.claude/`.
- `scripts/security-scan.sh` — IOC scanner (router_init.*, install hooks, registry URLs, spoofed Claude commits, .claude/.vscode exec files).
- `CLAUDE.md` — supply-chain rules section appended (gitignored).

User-level (this session):

- `~/.claude/hooks/handoff-check.js` — Stop hook enforcing handoff.md before session end.
- `~/.claude/settings.json` — registered Stop hook.
- Memory: `feedback_handoff_rule.md` + MEMORY.md index entry.

## Failed attempts

- Initial `node /tmp/extract_versions.js` heredoc failed: heredoc mangled regex backslash escaping (`/[.*+?^${}()|[\]\\]/`). Fix: wrote the script with the Write tool to a `.cjs` file instead of relying on shell-quoted heredoc.
- Initial `r.solicitudes?.category` access in `listMyPropuestas` returned undefined for biz "Mis propuestas" rows, showing category "Otro". Hypothesis was Supabase array-vs-object shape — wrote `Array.isArray` defensive code (`00c840e`). Real cause turned out to be RLS: the old `solicitudes_business_read_active` policy only allowed `status='active'` rows for biz reads, so after accept the solicitud disappeared from biz view. Fixed in migration `0003_billing.sql` (drop + recreate as `solicitudes_business_read` with an additional propuesta-ownership OR clause).
- Initial `createPropuesta` quota counter was a direct `supabase.from('subscriptions').update(...)`. Silently failed because subscriptions RLS is server-only — the counter stuck at 0. Fixed by routing the increment through a SECURITY DEFINER RPC `increment_propuestas_used` (`0003_billing.sql`), called via `supabase.rpc(...)` in `src/server-fns/propuestas.ts`.
- Tried `mcp__claude_ai_Supabase__execute_sql` to inspect propuesta join shape: returned `MCP error -32600: You do not have permission to perform this action`. Worked around by reading the migration source + defensive code.
- Playwright tab was closed once mid-session ("Target page, context or browser has been closed") after migration apply. Reopened via `browser_navigate` — sessions survived through cookies.

## Next steps

Open the PR `feat/phase-3-persistence` → `develop` on the `m2dataperu-star/empeno-quick-cash` fork with title "Phases 3+4: persistence + Culqi billing (demo)". Include in the body that live billing activates the moment `CULQI_SECRET_KEY` lands in `.dev.vars` and the webhook URL gets registered in the Culqi dashboard at `https://<deploy-host>/api/culqi-webhook`.
