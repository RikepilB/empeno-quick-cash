-- ============================================================================
-- 0008_rls_advisor_fixes.sql — Resolve Supabase Advisor RLS findings
-- ============================================================================
-- Findings reported by Supabase Advisor before PR #31 (develop → main):
--   1. public.audit_logs                 — RLS DISABLED (regressed from 0004).
--   2. public.commissions                — RLS enabled but no policies live
--                                          (commissions_owner_read from 0006
--                                          missing on remote).
--   3. public.v_active_featured_propuestas — flagged as SECURITY DEFINER view;
--                                            must honor caller's RLS.
--
-- App-runtime impact: none. No code in src/ reads/writes these objects
-- directly. accept_propuesta + boost_propuesta RPCs (SECURITY DEFINER) handle
-- writes; commissions_owner_read covers the business-facing read use case.
--
-- Strategy: idempotent — re-ENABLE RLS, REVOKE direct grants, DROP IF EXISTS
-- then CREATE policies, ALTER view to security_invoker. Safe to re-run.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. audit_logs — append-only, service_role-only
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.audit_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "audit_logs_authenticated_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_owner_read"         ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_anon_read"          ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert"             ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update"             ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete"             ON public.audit_logs;
-- No policies for authenticated/anon: deny-by-default. service_role bypasses RLS.

-- ---------------------------------------------------------------------------
-- 2. commissions — business members read their own; writes via RPC only
-- ---------------------------------------------------------------------------
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.commissions FROM anon;
GRANT SELECT ON public.commissions TO authenticated;

DROP POLICY IF EXISTS "commissions_owner_read"   ON public.commissions;
DROP POLICY IF EXISTS "commissions_insert"       ON public.commissions;
DROP POLICY IF EXISTS "commissions_update"       ON public.commissions;
DROP POLICY IF EXISTS "commissions_delete"       ON public.commissions;

CREATE POLICY "commissions_owner_read" ON public.commissions
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (select auth.uid())
    )
  );
-- No INSERT/UPDATE/DELETE policies: writes only via accept_propuesta RPC
-- (SECURITY DEFINER, bypasses RLS as table owner). Append-only ledger.

-- ---------------------------------------------------------------------------
-- 3. v_active_featured_propuestas — switch to SECURITY INVOKER
-- ---------------------------------------------------------------------------
-- Default view behavior runs as definer (owner) and bypasses caller RLS.
-- security_invoker = true makes the view honor the caller's RLS on the
-- underlying tables (featured_offers + propuestas), which is what we want
-- since both already have appropriate authenticated-read policies.
ALTER VIEW public.v_active_featured_propuestas SET (security_invoker = true);

COMMIT;

-- ============================================================================
-- Post-apply verification (run manually in Supabase SQL editor, NOT via push):
-- ============================================================================
-- -- 1. audit_logs RLS enabled + no policies
-- SELECT relrowsecurity, relforcerowsecurity
--   FROM pg_class WHERE relname = 'audit_logs' AND relnamespace = 'public'::regnamespace;
-- -- expected: t, t
-- SELECT polname FROM pg_policy
--   WHERE polrelid = 'public.audit_logs'::regclass;
-- -- expected: zero rows
--
-- -- 2. commissions RLS enabled + owner_read present
-- SELECT relrowsecurity, relforcerowsecurity
--   FROM pg_class WHERE relname = 'commissions' AND relnamespace = 'public'::regnamespace;
-- -- expected: t, t
-- SELECT polname FROM pg_policy
--   WHERE polrelid = 'public.commissions'::regclass;
-- -- expected: commissions_owner_read
--
-- -- 3. view is security_invoker
-- SELECT reloptions FROM pg_class
--   WHERE relname = 'v_active_featured_propuestas'
--     AND relnamespace = 'public'::regnamespace;
-- -- expected: {security_invoker=true}
