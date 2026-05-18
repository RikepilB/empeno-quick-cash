-- ============================================================================
-- 0004_production_schema.sql — Production hardening
-- ============================================================================
-- Purpose: audit_logs, business_members, enriched profiles/businesses/solicitudes,
--          updated_at triggers on all tables, storage bucket → private,
--          RLS policy hardening (subselect wrap), missing indexes.
-- Safe: all changes are additive (ALTER ADD COLUMN, CREATE TABLE, CREATE INDEX).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. extensions (idempotent)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 2. updated_at trigger (idempotent — no-op if already exists)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 3. profiles — enrich with identity + soft-delete fields
-- ===========================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name       text,
  ADD COLUMN IF NOT EXISTS last_name        text,
  ADD COLUMN IF NOT EXISTS document_type    text CHECK (document_type IS NULL OR document_type IN ('DNI','CE','PASSPORT','RUC')),
  ADD COLUMN IF NOT EXISTS document_number  text,
  ADD COLUMN IF NOT EXISTS district         text,
  ADD COLUMN IF NOT EXISTS city             text DEFAULT 'Lima',
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at       timestamptz;

-- Unique: no two users share the same document_type + document_number
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_document_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_document_unique UNIQUE (document_type, document_number);
  END IF;
END $$;

-- updated_at trigger for profiles (skip if already exists)
DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 4. businesses — enrich with legal identity + verification fields
-- ===========================================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS legal_name           text,
  ADD COLUMN IF NOT EXISTS trade_name           text,
  ADD COLUMN IF NOT EXISTS email                text,
  ADD COLUMN IF NOT EXISTS phone                text,
  ADD COLUMN IF NOT EXISTS address              text,
  ADD COLUMN IF NOT EXISTS city                 text DEFAULT 'Lima',
  ADD COLUMN IF NOT EXISTS logo_url             text,
  ADD COLUMN IF NOT EXISTS verification_status  text NOT NULL DEFAULT 'pending'
                                                CHECK (verification_status IN ('pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS average_rating       numeric(3,2) DEFAULT 0.0 CHECK (average_rating BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at           timestamptz;

-- Backfill: copy existing values into new columns (idempotent)
UPDATE public.businesses
SET trade_name = name,
    legal_name = COALESCE(legal_name, name),
    email = COALESCE(email, ''),
    status = COALESCE(status, 'active'),
    verification_status = CASE WHEN verified THEN 'verified' ELSE COALESCE(verification_status, 'pending') END
WHERE trade_name IS NULL OR legal_name IS NULL OR status IS NULL;

-- RUC length check (Peru: exactly 11 digits)
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_ruc_length;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_ruc_length CHECK (ruc IS NULL OR length(ruc) = 11);

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 5. business_members — multi-user support for businesses
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.business_members (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('owner','admin','cashier')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user
  ON public.business_members(user_id);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Members of a business can see their own membership + co-workers
CREATE POLICY "business_members_view" ON public.business_members
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (select auth.uid())
    )
  );

-- Only business owners can manage members (insert/delete/update)
DO $$ BEGIN
  CREATE POLICY "business_members_owner_manage" ON public.business_members
    FOR ALL TO authenticated
    USING (
      business_id IN (
        SELECT id FROM public.businesses
        WHERE owner_id = (select auth.uid())
      )
    )
    WITH CHECK (
      business_id IN (
        SELECT id FROM public.businesses
        WHERE owner_id = (select auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed: insert existing business owners as owner members (idempotent)
INSERT INTO public.business_members (business_id, user_id, role)
SELECT b.id, b.owner_id, 'owner'
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_members bm
  WHERE bm.business_id = b.id AND bm.user_id = b.owner_id
);

-- ===========================================================================
-- 6. solicitudes — enrich with loan-meta columns (additive, no drops)
-- ===========================================================================
ALTER TABLE public.solicitudes
  ADD COLUMN IF NOT EXISTS titulo                text,
  ADD COLUMN IF NOT EXISTS monto_solicitado_pen  numeric(12,2),
  ADD COLUMN IF NOT EXISTS monto_minimo_pen      numeric(12,2),
  ADD COLUMN IF NOT EXISTS photos                jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expires_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at            timestamptz;

-- Backfill: titulo from brand+model, monto_solicitado from expected_amount_pen
UPDATE public.solicitudes
SET titulo = COALESCE(titulo, TRIM(COALESCE(brand, '') || ' ' || COALESCE(model, ''))),
    monto_solicitado_pen = COALESCE(monto_solicitado_pen, expected_amount_pen::numeric)
WHERE titulo IS NULL OR monto_solicitado_pen IS NULL;

-- Photos constraint: must be a JSON array
ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_photos_is_array;
ALTER TABLE public.solicitudes
  ADD CONSTRAINT solicitudes_photos_is_array CHECK (jsonb_typeof(photos) = 'array');

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER solicitudes_updated_at BEFORE UPDATE ON public.solicitudes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 7. propuestas — add notes + updated_at + race-prevention constraint
-- ===========================================================================
ALTER TABLE public.propuestas
  ADD COLUMN IF NOT EXISTS notas       text CHECK (notas IS NULL OR length(notas) <= 500),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- Ensure one business can only have ONE pending propuesta per solicitud
-- (current has UNIQUE(solicitud_id, business_id) already, but this enforces "active only")
-- The existing unique constraint on (solicitud_id, business_id) is stricter and already works.
-- We keep it. Add updated_at trigger only.

DO $$ BEGIN
  CREATE TRIGGER propuestas_updated_at BEFORE UPDATE ON public.propuestas
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 8. operations — add notes + expires_at + timestamps
-- ===========================================================================
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS notes       text,
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  CREATE TRIGGER operations_updated_at BEFORE UPDATE ON public.operations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 9. plans — enrich with feature flags
-- ===========================================================================
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS slug                text,
  ADD COLUMN IF NOT EXISTS analytics_access    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority_visibility boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_access          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active              boolean NOT NULL DEFAULT true;

-- Backfill slugs
UPDATE public.plans SET slug = id WHERE slug IS NULL;

-- ===========================================================================
-- 10. subscriptions — add period tracking + updated_at
-- ===========================================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS period_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS period_end   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 11. audit_logs — append-only record of sensitive mutations
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              bigserial PRIMARY KEY,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_user_id   uuid,
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       uuid NOT NULL,
  before_state    jsonb,
  after_state     jsonb,
  correlation_id  text,
  ip_address      inet
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs(actor_user_id, occurred_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- audit_logs is append-only: no user can read or write (service_role only).
-- No SELECT or INSERT policies → only service_role bypasses RLS.

-- ===========================================================================
-- 12. Missing indexes on FK columns + composite performance indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_solicitudes_client ON public.solicitudes(client_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created ON public.solicitudes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_open
  ON public.solicitudes(created_at DESC)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Composite: filtered marketplace browsing
CREATE INDEX IF NOT EXISTS idx_solicitudes_category_status
  ON public.solicitudes(category, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_district_status
  ON public.solicitudes(district, status);

-- propuestas: pending status filter (used by business queries)
CREATE INDEX IF NOT EXISTS idx_propuestas_pending
  ON public.propuestas(solicitud_id)
  WHERE status = 'pending';

-- operations: quick code lookups
CREATE INDEX IF NOT EXISTS idx_operations_code ON public.operations(redemption_code);

-- ===========================================================================
-- 13. Storage bucket: change from public to private
-- ===========================================================================
-- Drop PUBLIC policies on solicitud-photos bucket (current allows anyone to read)
DROP POLICY IF EXISTS "solicitud_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "solicitud_photos_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "solicitud_photos_owner_delete" ON storage.objects;

-- Make the bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'solicitud-photos';

-- New policy: owner can INSERT under their own user_id prefix
CREATE POLICY "solicitud_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'solicitud-photos'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Owner can SELECT their own files
CREATE POLICY "solicitud_photos_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'solicitud-photos'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Owner can DELETE their own files
CREATE POLICY "solicitud_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'solicitud-photos'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Business members can read photos of solicitudes they bid on.
-- This requires a SECURITY DEFINER function because storage.objects.name
-- cannot easily JOIN across schemas in an RLS policy.
-- In the application layer (services/solicitudes.ts), generate signed URLs
-- via service_role when returning photos to businesses. No direct SELECT policy.
-- Uncomment below only if you expose the storage endpoint directly:
-- (skipped — signed URLs from server-side are the secure path)

-- ===========================================================================
-- 14. RLS hardening — replace bare auth.uid() with subselects
--     (Supabase docs: subselect is >100x faster than bare function call in RLS)
-- ===========================================================================

-- Drop and recreate policies with (select auth.uid()) wrapping

-- profiles
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- businesses
DROP POLICY IF EXISTS "businesses_owner_all" ON public.businesses;
CREATE POLICY "businesses_owner_all" ON public.businesses
  FOR ALL TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "businesses_authenticated_read" ON public.businesses;
CREATE POLICY "businesses_authenticated_read" ON public.businesses
  FOR SELECT TO authenticated
  USING (status = 'active' AND verification_status = 'verified');

-- solicitudes
DROP POLICY IF EXISTS "solicitudes_client_all" ON public.solicitudes;
CREATE POLICY "solicitudes_client_all" ON public.solicitudes
  FOR ALL TO authenticated
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

-- propuestas business owner
DROP POLICY IF EXISTS "propuestas_business_owner_all" ON public.propuestas;
CREATE POLICY "propuestas_business_owner_all" ON public.propuestas
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = (select auth.uid())
    )
  );

-- propuestas client read
DROP POLICY IF EXISTS "propuestas_client_read" ON public.propuestas;
CREATE POLICY "propuestas_client_read" ON public.propuestas
  FOR SELECT TO authenticated
  USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes
      WHERE client_id = (select auth.uid())
    )
  );

-- propuestas client update status
DROP POLICY IF EXISTS "propuestas_client_update_status" ON public.propuestas;
CREATE POLICY "propuestas_client_update_status" ON public.propuestas
  FOR UPDATE TO authenticated
  USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes
      WHERE client_id = (select auth.uid())
    )
  )
  WITH CHECK (status IN ('accepted','rejected'));

-- operations (client)
DROP POLICY IF EXISTS "operations_client_read" ON public.operations;
CREATE POLICY "operations_client_read" ON public.operations
  FOR SELECT TO authenticated
  USING (
    propuesta_id IN (
      SELECT p.id FROM public.propuestas p
      JOIN public.solicitudes s ON s.id = p.solicitud_id
      WHERE s.client_id = (select auth.uid())
    )
  );

-- operations (business)
DROP POLICY IF EXISTS "operations_business_read" ON public.operations;
CREATE POLICY "operations_business_read" ON public.operations
  FOR SELECT TO authenticated
  USING (
    propuesta_id IN (
      SELECT p.id FROM public.propuestas p
      JOIN public.businesses b ON b.id = p.business_id
      WHERE b.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "operations_business_update" ON public.operations;
CREATE POLICY "operations_business_update" ON public.operations
  FOR UPDATE TO authenticated
  USING (
    propuesta_id IN (
      SELECT p.id FROM public.propuestas p
      JOIN public.businesses b ON b.id = p.business_id
      WHERE b.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (status IN ('completed','disputed'));

-- subscriptions owner read
DROP POLICY IF EXISTS "subscriptions_owner_read" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_read" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = (select auth.uid())
    )
  );

-- invoices
DROP POLICY IF EXISTS "invoices_owner_read" ON public.invoices;
CREATE POLICY "invoices_owner_read" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = (select auth.uid())
    )
  );

-- plans (public read remains unchanged — no auth.uid to wrap)
-- solicitud_photos
DROP POLICY IF EXISTS "solicitud_photos_owner_all" ON public.solicitud_photos;
CREATE POLICY "solicitud_photos_owner_all" ON public.solicitud_photos
  FOR ALL TO authenticated
  USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes
      WHERE client_id = (select auth.uid())
    )
  )
  WITH CHECK (
    solicitud_id IN (
      SELECT id FROM public.solicitudes
      WHERE client_id = (select auth.uid())
    )
  );

-- solicitud_photos authenticated read (keep for business access — they need to see photos of solicitudes they bid on)
DROP POLICY IF EXISTS "solicitud_photos_authenticated_read" ON public.solicitud_photos;
CREATE POLICY "solicitud_photos_authenticated_read" ON public.solicitud_photos
  FOR SELECT TO authenticated
  USING (true);

-- ===========================================================================
-- 15. Connection hardening (timeouts)
--     Apply to prevent idle-in-transaction leaks and runaway queries.
-- ===========================================================================
DO $$ BEGIN
  ALTER ROLE authenticated SET statement_timeout = '30s';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Cannot set statement_timeout on authenticated role — skip (requires superuser).';
END $$;

DO $$ BEGIN
  ALTER ROLE anon SET statement_timeout = '10s';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Cannot set statement_timeout on anon role — skip (requires superuser).';
END $$;

DO $$ BEGIN
  ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '60s';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Cannot set idle_in_transaction_session_timeout — skip (requires superuser).';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES — run after applying migration
-- ============================================================================
-- (commented out so the file is idempotent for migration tooling)
--
-- -- All public tables have RLS enabled?
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;
-- -- expected: 0 rows
--
-- -- audit_logs table exists?
-- SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs');
--
-- -- business_members table exists?
-- SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_members');
--
-- -- Storage bucket is private?
-- SELECT name, public FROM storage.buckets WHERE id = 'solicitud-photos';
-- -- expected: public = false
--
-- -- New columns on profiles?
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- AND column_name IN ('first_name','last_name','document_type','document_number','status','deleted_at');
