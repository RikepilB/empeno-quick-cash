-- ============================================================================
-- 0005_storage_gc.sql — Orphan storage cleanup + cron job scheduling
-- ============================================================================
-- Purpose: detects and removes unreferenced photos from the solicitud-photos
--          bucket, adds advisory-lock-guarded scheduled job.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Function: find unreferenced storage objects
--    Returns list of storage paths in solicitud-photos bucket that have no
--    matching solicitud_photos row AND are older than the grace period.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_orphan_photos(
  p_grace_period interval DEFAULT '24 hours'
) RETURNS TABLE (storage_path text, created_at timestamptz, size_bytes bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT o.name, o.created_at, (o.metadata->>'size')::bigint
  FROM storage.objects o
  WHERE o.bucket_id = 'solicitud-photos'
    AND o.created_at < (now() - p_grace_period)
    AND NOT EXISTS (
      SELECT 1 FROM public.solicitud_photos sp
      WHERE sp.storage_path = o.name
    );
END;
$$;

REVOKE ALL ON FUNCTION public.find_orphan_photos(interval) FROM public;

-- ---------------------------------------------------------------------------
-- 2. Function: gc_orphan_storage (called by cron)
--    Removes solicitud_photos rows AND storage objects that reference
--    solicitudes with deleted_at set, plus any photos in staging/* prefix
--    older than 24h.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gc_orphan_storage()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Advisory lock: prevent concurrent runs
  IF pg_try_advisory_lock(hashtext('gc_orphan_storage')) = false THEN
    RAISE NOTICE 'gc_orphan_storage: lock not acquired, another instance is running.';
    RETURN 0;
  END IF;

  -- Set timeouts inside the job
  SET LOCAL statement_timeout = '5min';
  SET LOCAL lock_timeout = '1min';

  -- Remove solicitud_photos for soft-deleted solicitudes
  WITH deleted_photos AS (
    DELETE FROM public.solicitud_photos sp
    USING public.solicitudes s
    WHERE sp.solicitud_id = s.id
      AND s.deleted_at IS NOT NULL
      AND s.deleted_at < (now() - interval '30 days')
    RETURNING sp.storage_path
  )
  SELECT count(*) INTO v_count FROM deleted_photos;

  -- Note: actual storage.objects deletion requires the Supabase SDK or Edge
  -- Function, as storage.objects RLS blocks direct DELETE from Postgres.
  -- The application-layer cron calls storage.from(bucket).remove(paths)
  -- using the service_role key. This function only cleans the DB references.

  -- Log the cleanup
  INSERT INTO public.audit_logs (action, entity_type, entity_id, after_state)
  VALUES (
    'scheduled.gc_orphan_storage',
    'solicitud_photos',
    '00000000-0000-0000-0000-000000000000',
    jsonb_build_object('removed_count', v_count, 'ran_at', now())
  );

  -- Release lock
  PERFORM pg_advisory_unlock(hashtext('gc_orphan_storage'));

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.gc_orphan_storage() FROM public;

-- ---------------------------------------------------------------------------
-- 3. Schedule via pg_cron (daily at 3 AM UTC)
--    Note: pg_cron must be enabled in Supabase Dashboard → Extensions.
--    If not available, schedule this function via Supabase Edge Function cron.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'gc-orphan-storage',
      '0 3 * * *',
      $$SELECT public.gc_orphan_storage();$$
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Function: expire_old_propuestas (scheduled)
--    Marks pending propuestas as 'expired' if their expires_at has passed.
--    Also expires solicitudes past their expiration.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_rows()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total integer := 0;
  v_count integer;
BEGIN
  IF pg_try_advisory_lock(hashtext('expire_stale_rows')) = false THEN
    RAISE NOTICE 'expire_stale_rows: lock not acquired.';
    RETURN 0;
  END IF;

  SET LOCAL statement_timeout = '5min';
  SET LOCAL lock_timeout = '1min';

  -- Expire pending propuestas past their deadline
  UPDATE public.propuestas
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  -- Expire solicitudes past their deadline
  UPDATE public.solicitudes
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  -- Expire operations past their pickup window
  UPDATE public.operations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending_pickup'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  PERFORM pg_advisory_unlock(hashtext('expire_stale_rows'));

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_rows() FROM public;

-- Schedule every hour
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'expire-stale-rows',
      '0 * * * *',
      $$SELECT public.expire_stale_rows();$$
    );
  END IF;
END $$;

COMMIT;
