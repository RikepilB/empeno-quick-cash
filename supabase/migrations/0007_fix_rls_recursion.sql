-- ============================================================================
-- 0007_fix_rls_recursion.sql — Break solicitudes ↔ propuestas RLS recursion
-- ============================================================================
-- Bug: "infinite recursion detected in policy for relation 'solicitudes'"
-- Cause: solicitudes_business_read (0003) does EXISTS over propuestas. Reading
--   propuestas triggers propuestas_client_read, which does EXISTS over
--   solicitudes, which re-evaluates the same select policies → cycle.
-- Fix: replace the propuestas-existence subquery with a SECURITY DEFINER
--   helper that bypasses RLS on propuestas (runs as owner). The helper is
--   STABLE so the planner caches per-row evaluation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.biz_has_propuesta_on(p_solicitud_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.propuestas p
    JOIN public.businesses b ON b.id = p.business_id
    WHERE p.solicitud_id = p_solicitud_id
      AND b.owner_id = (select auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.biz_has_propuesta_on(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.biz_has_propuesta_on(uuid) TO authenticated;

DROP POLICY IF EXISTS "solicitudes_business_read" ON public.solicitudes;
CREATE POLICY "solicitudes_business_read" ON public.solicitudes
  FOR SELECT TO authenticated
  USING (
    (
      status = 'active'
      AND EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.subscriptions s ON s.business_id = b.id
        WHERE b.owner_id = (select auth.uid())
          AND s.status IN ('active', 'trialing')
      )
    )
    OR public.biz_has_propuesta_on(public.solicitudes.id)
  );
