-- ============================================================================
-- 0010_fix_propuestas_client_recursion.sql
-- Break the RLS recursion cycle between solicitudes ←→ propuestas for clients
-- ============================================================================
-- Root cause: When listMySolicitudes queries solicitudes with
--   propuestas(count, id, accepted_at), Supabase evaluates propuestas_client_read
--   policy which does:
--     solicitud_id IN (SELECT id FROM solicitudes WHERE client_id = auth.uid())
--   This subquery re-evaluates solicitudes_client_all → recursion → fail/empty.
--
-- Fix: Replace the subquery in propuestas_client_read with a SECURITY DEFINER
--   helper that bypasses RLS on both tablas.
-- ============================================================================

BEGIN;

-- Helper: does the authenticated client own a propuesta on this solicitud?
CREATE OR REPLACE FUNCTION public.client_owns_propuesta_on(p_solicitud_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.propuestas p
    JOIN public.solicitudes s ON s.id = p.solicitud_id
    WHERE p.solicitud_id = p_solicitud_id
      AND s.client_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.client_owns_propuesta_on(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.client_owns_propuesta_on(uuid) TO authenticated;

-- Replace propuestas_client_read — now uses SECURITY DEFINER helper, no recursion
DROP POLICY IF EXISTS "propuestas_client_read" ON public.propuestas;
CREATE POLICY "propuestas_client_read" ON public.propuestas
  FOR SELECT TO authenticated
  USING (public.client_owns_propuesta_on(solicitud_id));

-- Also fix propuestas_client_update_status: same recursive subquery pattern
-- Replace with SECURITY DEFINER helper check
DROP POLICY IF EXISTS "propuestas_client_update_status" ON public.propuestas;
CREATE POLICY "propuestas_client_update_status" ON public.propuestas
  FOR UPDATE TO authenticated
  USING (public.client_owns_propuesta_on(solicitud_id))
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Confirm the recursion is broken: no subquery on solicitudes in either policy now
-- and solicitudes_client_all doesn't touch propuestas at all.

COMMIT;