-- ============================================================================
-- 0009_solicitud_lifecycle_management.sql
-- Adds 'borrado' status + soft-delete + hard-delete for clientSolicitud lifecycle
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extend status CHECK to include 'borrado'
-- ---------------------------------------------------------------------------
ALTER TABLE public.solicitudes
  DROP CONSTRAINT IF EXISTS solicitudes_status_check,
  ADD CONSTRAINT solicitudes_status_check
    CHECK (status IN ('active', 'accepted', 'closed', 'expired', 'suspended', 'borrado'));

-- ---------------------------------------------------------------------------
-- 2. Function: soft_delete_solicitud(id uuid)
--    Sets status = 'borrado', deleted_at = now() — recoverable for 24h
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_solicitud(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.solicitudes
  SET status = 'borrado', deleted_at = now()
  WHERE id = p_id
    AND client_id = (SELECT auth.uid())
    AND status NOT IN ('accepted', 'closed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no editable';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_solicitud(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.soft_delete_solicitud(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Function: restore_borrado_solicitud(id uuid)
--    Restores a 'borrado' solicitud to 'active' if within 24h recovery window
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_borrado_solicitud(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.solicitudes
  SET status = 'active', deleted_at = NULL
  WHERE id = p_id
    AND client_id = (SELECT auth.uid())
    AND status = 'borrado'
    AND deleted_at > (now() - interval '24 hours');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no disponible para recuperación';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_borrado_solicitud(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.restore_borrado_solicitud(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Function: hard_delete_borrado_solicitud(id uuid)
--    Removes solicitud + photos + storage objects if deleted > 24h ago
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hard_delete_borrado_solicitud(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_client_uuid uuid;
  v_photo_paths text[];
BEGIN
  SELECT client_id INTO v_client_uuid
  FROM public.solicitudes
  WHERE id = p_id AND status = 'borrado';

  IF v_client_uuid IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no en estado borrado';
  END IF;

  IF v_client_uuid != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF (SELECT deleted_at FROM public.solicitudes WHERE id = p_id) > (now() - interval '24 hours') THEN
    RAISE EXCEPTION 'Debes esperar 24h antes de eliminar permanentemente';
  END IF;

  SELECT array_agg(storage_path) INTO v_photo_paths
  FROM public.solicitud_photos
  WHERE solicitud_id = p_id;

  DELETE FROM public.solicitud_photos WHERE solicitud_id = p_id;

  DELETE FROM public.solicitudes WHERE id = p_id;

  IF v_photo_paths IS NOT NULL AND array_length(v_photo_paths, 1) > 0 THEN
    DELETE FROM storage.objects
    WHERE name = ANY(v_photo_paths)
      AND bucket_id = 'solicitud-photos';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.hard_delete_borrado_solicitud(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hard_delete_borrado_solicitud(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Cron: purge_borrado_solicitudes (nightly 3am)
--    Hard-deletes solicitudes in 'borrado' state older than 24h
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.hard_delete_borrado_solicitud(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hard_delete_borrado_solicitud(uuid) TO authenticated;

-- NOTE: To schedule nightly purge, enable pg_cron extension in Supabase dashboard
-- (Database → Extensions → pg_cron) then create the purge function and schedule it.
-- The purge function calls hard_delete_borrado_solicitud() for any 'borrado' rows
-- older than 24 hours. A reference implementation:
--
-- CREATE OR REPLACE FUNCTION public.purge_borrado_solicitudes()
-- RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- BEGIN
--   DELETE FROM public.solicitudes
--   WHERE status = 'borrado' AND deleted_at < (now() - interval '24 hours');
-- END;
-- $$;
-- SELECT cron.schedule('purge-borrado-solicitudes', '0 3 * * *', 'SELECT public.purge_borrado_solicitudes()');

COMMIT;

-- Verification queries (run in SQL editor):
--
-- 1. Check status constraint now includes 'borrado'
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'public.solicitudes'::regclass AND conname = 'solicitudes_status_check';
--
-- 2. Check soft-delete sets deleted_at
-- SELECT id, status, deleted_at
--   FROM public.solicitudes WHERE status = 'borrado' LIMIT 5;
--
-- 3. Supabase Advisor → Security → 3 findings should clear (same as 0008)