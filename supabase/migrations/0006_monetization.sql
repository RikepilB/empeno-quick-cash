-- ============================================================================
-- 0006_monetization.sql — Etapa 1 monetization expansion
-- ============================================================================
-- Adds: Etapa 1 plan matrix (alias slugs alongside existing basico/intermedio/
--       avanzado), commission_config, featured_offers, payments ledger,
--       commissions ledger, compute_commission helper, boost_propuesta RPC,
--       extended accept_propuesta (commission write, same signature),
--       v_active_featured_propuestas view.
--
-- Decisions locked (see docs/REDESIGN-ROADMAP.md):
--   - Plans:  ADD free/starter/pro/unlim alongside existing rows (no rename).
--   - Commission: tiered_percentage 3% (min S/10, max S/100) default, all
--                 categorías and plans.
--   - Boost: S/9 (24h), S/15 (48h), S/20 (72h).
--   - Free trial: none. Annual discount: none. Refunds: not granted mid-period.
--   - Propuestas: sealed-bid — business cannot see competitors' offers.
--   - DNI verification: optional to publish (Etapa 1 scaffolding).
--   - Stripe fallback: parked. Culqi-only Peru.
--
-- Safe: all changes additive. No drop/rename of existing rows or columns.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extend plans with Etapa 1 capability matrix columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS monthly_featured_credits integer NOT NULL DEFAULT 0
    CHECK (monthly_featured_credits >= 0),
  ADD COLUMN IF NOT EXISTS max_sucursales            integer NOT NULL DEFAULT 1
    CHECK (max_sucursales >= 1),
  ADD COLUMN IF NOT EXISTS max_users_per_sucursal    integer NOT NULL DEFAULT 1
    CHECK (max_users_per_sucursal >= 1),
  ADD COLUMN IF NOT EXISTS realtime_notifications    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dashboard_tier            text    NOT NULL DEFAULT 'none'
    CHECK (dashboard_tier IN ('none','simple','full')),
  ADD COLUMN IF NOT EXISTS monthly_reports           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_tier              text    NOT NULL DEFAULT 'community'
    CHECK (support_tier IN ('community','email','priority')),
  ADD COLUMN IF NOT EXISTS account_manager           boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2. Add new Etapa 1 plan slugs (alongside existing rows; no rename)
-- ---------------------------------------------------------------------------
INSERT INTO public.plans
  (id, name, price_pen, monthly_propuestas, features,
   monthly_featured_credits, max_sucursales, max_users_per_sucursal,
   realtime_notifications, dashboard_tier, monthly_reports, support_tier, account_manager)
VALUES
  ('free',    'Gratuito', 0,  10,
    '["Hasta 10 propuestas/mes","Acceso básico","Soporte comunidad"]'::jsonb,
    0,  1,  1, false, 'none',   false, 'community', false),
  ('starter', 'Plus',     19, 50,
    '["Hasta 50 propuestas/mes","Notificaciones en tiempo real","Visualización de otras propuestas","Soporte por email","2 destacados/mes"]'::jsonb,
    2,  1,  1, true,  'simple', false, 'email',     false),
  ('pro',     'Premium',  49, NULL,
    '["Propuestas ilimitadas","Hasta 5 sucursales","Reportes mensuales","10 destacados/mes","Soporte priority","Gerente de cuenta"]'::jsonb,
    10, 5,  2, true,  'full',   true,  'priority',  true),
  ('unlim',   'Pro',      99, NULL,
    '["Propuestas ilimitadas","Hasta 15 sucursales","Sub-gerentes regionales","30 destacados/mes","Reportes mensuales","Soporte priority","Gerente de cuenta"]'::jsonb,
    30, 15, 3, true,  'full',   true,  'priority',  true)
ON CONFLICT (id) DO NOTHING;

-- Backfill slug for the legacy 3 rows (0004 added the column; ensure populated)
UPDATE public.plans SET slug = id WHERE slug IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Extend subscriptions with featured credit + gateway tracking
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS featured_credits_used_this_period integer NOT NULL DEFAULT 0
    CHECK (featured_credits_used_this_period >= 0),
  ADD COLUMN IF NOT EXISTS payment_gateway          text
    CHECK (payment_gateway IS NULL OR payment_gateway IN ('culqi','manual')),
  ADD COLUMN IF NOT EXISTS gateway_customer_id      text,
  ADD COLUMN IF NOT EXISTS gateway_subscription_id  text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway
  ON public.subscriptions(payment_gateway, gateway_subscription_id)
  WHERE gateway_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. commission_config — configurable per categoría / plan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commission_config (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria      text,
  plan_slug      text REFERENCES public.plans(id) ON DELETE CASCADE,
  mode           text NOT NULL CHECK (mode IN ('percentage','flat','tiered_percentage')),
  percentage_bps integer CHECK (percentage_bps IS NULL OR (percentage_bps >= 0 AND percentage_bps <= 10000)),
  flat_pen       numeric(10,2) CHECK (flat_pen IS NULL OR flat_pen >= 0),
  min_pen        numeric(10,2) CHECK (min_pen IS NULL OR min_pen >= 0),
  max_pen        numeric(10,2) CHECK (max_pen IS NULL OR max_pen >= 0),
  active         boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to   timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commission_mode_fields_match CHECK (
    (mode = 'percentage'           AND percentage_bps IS NOT NULL AND flat_pen IS NULL)
    OR (mode = 'flat'              AND flat_pen IS NOT NULL AND percentage_bps IS NULL)
    OR (mode = 'tiered_percentage' AND percentage_bps IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_config_unique_active
  ON public.commission_config(COALESCE(categoria, '*'), COALESCE(plan_slug, '*'))
  WHERE active = true AND (effective_to IS NULL OR effective_to > now());

DO $$ BEGIN
  CREATE TRIGGER commission_config_updated_at BEFORE UPDATE ON public.commission_config
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default: 3% with min S/10 max S/100, all categorías and plans
INSERT INTO public.commission_config
  (categoria, plan_slug, mode, percentage_bps, min_pen, max_pen, notes)
VALUES
  (NULL, NULL, 'tiered_percentage', 300, 10.00, 100.00,
   'Default Etapa 1: 3% min S/10 max S/100')
ON CONFLICT DO NOTHING;

-- Helper: compute commission for a (monto, categoría, plan_slug)
CREATE OR REPLACE FUNCTION public.compute_commission(
  p_monto_pen integer,
  p_categoria text,
  p_plan_slug text
) RETURNS numeric(10,2)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_cfg    RECORD;
  v_amount numeric(10,2);
BEGIN
  SELECT * INTO v_cfg
  FROM public.commission_config
  WHERE active = true
    AND (effective_to IS NULL OR effective_to > now())
    AND (categoria = p_categoria OR categoria IS NULL)
    AND (plan_slug = p_plan_slug OR plan_slug IS NULL)
  ORDER BY
    (CASE WHEN categoria IS NOT NULL THEN 2 ELSE 0 END
     + CASE WHEN plan_slug IS NOT NULL THEN 1 ELSE 0 END) DESC,
    effective_from DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_amount := CASE v_cfg.mode
    WHEN 'percentage' THEN
      ROUND(p_monto_pen * v_cfg.percentage_bps / 10000.0, 2)
    WHEN 'flat' THEN
      v_cfg.flat_pen
    WHEN 'tiered_percentage' THEN
      LEAST(
        GREATEST(
          ROUND(p_monto_pen * v_cfg.percentage_bps / 10000.0, 2),
          COALESCE(v_cfg.min_pen, 0)
        ),
        COALESCE(v_cfg.max_pen, p_monto_pen::numeric(10,2))
      )
  END;

  RETURN v_amount;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. featured_offers — boosted propuestas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.featured_offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propuesta_id   uuid NOT NULL REFERENCES public.propuestas(id) ON DELETE CASCADE,
  business_id    uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source         text NOT NULL CHECK (source IN ('plan_credit','purchased')),
  duration_hours integer NOT NULL CHECK (duration_hours IN (24, 48, 72)),
  cost_pen       numeric(10,2) NOT NULL DEFAULT 0 CHECK (cost_pen >= 0),
  starts_at      timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  payment_id     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_offer_window CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_featured_offers_propuesta ON public.featured_offers(propuesta_id);
CREATE INDEX IF NOT EXISTS idx_featured_offers_business  ON public.featured_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_featured_offers_active
  ON public.featured_offers(propuesta_id)
  WHERE expires_at > now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_offers_no_overlap
  ON public.featured_offers(propuesta_id)
  WHERE expires_at > now();

DO $$ BEGIN
  CREATE TRIGGER featured_offers_updated_at BEFORE UPDATE ON public.featured_offers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 6. payments — gateway-abstracted payment ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  amount_pen            numeric(10,2) NOT NULL CHECK (amount_pen > 0),
  currency              text NOT NULL DEFAULT 'PEN' CHECK (currency = 'PEN'),
  purpose               text NOT NULL CHECK (purpose IN ('subscription','featured_boost','commission')),
  related_entity_type   text CHECK (related_entity_type IN ('subscription','featured_offer','operation')),
  related_entity_id     uuid,
  gateway               text NOT NULL CHECK (gateway IN ('culqi','manual')),
  gateway_charge_id     text,
  gateway_status        text,
  status                text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','succeeded','failed','refunded','disputed')),
  idempotency_key       text NOT NULL UNIQUE,
  failure_reason        text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_charge
  ON public.payments(gateway, gateway_charge_id)
  WHERE gateway_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_related
  ON public.payments(related_entity_type, related_entity_id);

DO $$ BEGIN
  CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Link featured_offers.payment_id → payments.id
DO $$ BEGIN
  ALTER TABLE public.featured_offers
    ADD CONSTRAINT featured_offers_payment_fk
    FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 7. commissions — append-only ledger, one row per accepted propuesta
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id    uuid NOT NULL UNIQUE REFERENCES public.operations(id) ON DELETE RESTRICT,
  business_id     uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  monto_pen       numeric(10,2) NOT NULL CHECK (monto_pen >= 0),
  config_id       uuid REFERENCES public.commission_config(id),
  config_snapshot jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','invoiced','paid','waived')),
  payment_id      uuid REFERENCES public.payments(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_business ON public.commissions(business_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status   ON public.commissions(status);

DO $$ BEGIN
  CREATE TRIGGER commissions_updated_at BEFORE UPDATE ON public.commissions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 8. RLS on new tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions       ENABLE ROW LEVEL SECURITY;

-- commission_config: service_role only (no policy = no access for authenticated)

-- featured_offers: business members read their own
CREATE POLICY "featured_offers_owner_read" ON public.featured_offers
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (select auth.uid())
    )
  );

-- Public read for active boosts (clients see badge ordering)
CREATE POLICY "featured_offers_public_active_read" ON public.featured_offers
  FOR SELECT TO authenticated
  USING (expires_at > now());

-- No direct INSERT — must go through boost_propuesta RPC

-- payments: business members read their own
CREATE POLICY "payments_owner_read" ON public.payments
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (select auth.uid())
    )
  );

-- commissions: business members read their own
CREATE POLICY "commissions_owner_read" ON public.commissions
  FOR SELECT TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 9. boost_propuesta RPC — atomic credit deduct OR record purchased boost
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.boost_propuesta(
  p_propuesta_id   uuid,
  p_duration_hours integer,
  p_use_credit     boolean,
  p_payment_id     uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller      uuid := (select auth.uid());
  v_business_id uuid;
  v_sub         RECORD;
  v_offer_id    uuid;
  v_source      text;
  v_cost_pen    numeric(10,2) := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_duration_hours NOT IN (24, 48, 72) THEN
    RAISE EXCEPTION 'invalid_duration' USING ERRCODE = 'P0001';
  END IF;

  -- Lock propuesta + grab business
  SELECT business_id INTO v_business_id
  FROM public.propuestas
  WHERE id = p_propuesta_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'propuesta_not_found_or_not_pending' USING ERRCODE = 'P0002';
  END IF;

  -- Caller must be a member of the business
  IF NOT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE user_id = v_caller AND business_id = v_business_id
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Reject if another active boost exists on this propuesta
  IF EXISTS (
    SELECT 1 FROM public.featured_offers
    WHERE propuesta_id = p_propuesta_id AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'already_boosted' USING ERRCODE = 'P0001';
  END IF;

  IF p_use_credit THEN
    SELECT s.id            AS sub_id,
           s.featured_credits_used_this_period AS used,
           p.monthly_featured_credits          AS quota
    INTO v_sub
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = v_business_id
      AND s.status IN ('active','trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
    LIMIT 1
    FOR UPDATE OF s;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'no_active_subscription' USING ERRCODE = 'P0001';
    END IF;

    IF v_sub.used >= v_sub.quota THEN
      RAISE EXCEPTION 'no_credits_remaining' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.subscriptions
    SET featured_credits_used_this_period = featured_credits_used_this_period + 1
    WHERE id = v_sub.sub_id;

    v_source   := 'plan_credit';
    v_cost_pen := 0;
  ELSE
    -- Purchased path: payment_id must reference a succeeded payment
    IF p_payment_id IS NULL THEN
      RAISE EXCEPTION 'payment_required' USING ERRCODE = 'P0001';
    END IF;

    SELECT amount_pen INTO v_cost_pen
    FROM public.payments
    WHERE id = p_payment_id
      AND business_id = v_business_id
      AND purpose = 'featured_boost'
      AND status = 'succeeded';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'payment_invalid_or_not_succeeded' USING ERRCODE = 'P0001';
    END IF;

    v_source := 'purchased';
  END IF;

  INSERT INTO public.featured_offers
    (propuesta_id, business_id, source, duration_hours, cost_pen,
     starts_at, expires_at, payment_id)
  VALUES (
    p_propuesta_id,
    v_business_id,
    v_source,
    p_duration_hours,
    v_cost_pen,
    now(),
    now() + (p_duration_hours || ' hours')::interval,
    CASE WHEN v_source = 'purchased' THEN p_payment_id ELSE NULL END
  )
  RETURNING id INTO v_offer_id;

  -- Audit
  INSERT INTO public.audit_logs
    (actor_user_id, action, entity_type, entity_id, after_state)
  VALUES (
    v_caller, 'propuesta.boosted', 'featured_offer', v_offer_id,
    jsonb_build_object(
      'propuesta_id',   p_propuesta_id,
      'source',         v_source,
      'duration_hours', p_duration_hours,
      'cost_pen',       v_cost_pen
    )
  );

  RETURN v_offer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.boost_propuesta(uuid, integer, boolean, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.boost_propuesta(uuid, integer, boolean, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 10. Extend accept_propuesta — same signature, add commission write
-- ---------------------------------------------------------------------------
-- Existing signature: accept_propuesta(p_propuesta_id uuid, p_redemption_code text)
--   RETURNS public.operations
-- We REPLACE the body to also write the commission ledger row. Service code
-- in src/services/propuestas.ts is unchanged.
CREATE OR REPLACE FUNCTION public.accept_propuesta(
  p_propuesta_id     uuid,
  p_redemption_code  text
) RETURNS public.operations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_solicitud_id  uuid;
  v_client_id     uuid;
  v_business_id   uuid;
  v_monto_pen     integer;
  v_categoria     text;
  v_plan_slug     text;
  v_operation     public.operations;
  v_commission    numeric(10,2);
  v_cfg_id        uuid;
BEGIN
  -- Lookup propuesta basics + lock
  SELECT solicitud_id, business_id, monto_pen
  INTO v_solicitud_id, v_business_id, v_monto_pen
  FROM public.propuestas
  WHERE id = p_propuesta_id
  FOR UPDATE;

  IF v_solicitud_id IS NULL THEN
    RAISE EXCEPTION 'Propuesta not found';
  END IF;

  -- Owner check + grab categoría
  SELECT client_id, category
  INTO v_client_id, v_categoria
  FROM public.solicitudes
  WHERE id = v_solicitud_id;

  IF v_client_id <> (select auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Mark chosen propuesta accepted (idempotent on state)
  UPDATE public.propuestas
  SET status = 'accepted'
  WHERE id = p_propuesta_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Propuesta no longer pending';
  END IF;

  -- Expire siblings
  UPDATE public.propuestas
  SET status = 'expired'
  WHERE solicitud_id = v_solicitud_id
    AND id <> p_propuesta_id
    AND status = 'pending';

  -- Close solicitud
  UPDATE public.solicitudes SET status = 'accepted' WHERE id = v_solicitud_id;

  -- Create operation row
  INSERT INTO public.operations (propuesta_id, redemption_code)
  VALUES (p_propuesta_id, p_redemption_code)
  RETURNING * INTO v_operation;

  -- Lookup active plan slug for commission tier
  SELECT pl.id INTO v_plan_slug
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.business_id = v_business_id
    AND s.status IN ('active','trialing')
    AND (s.current_period_end IS NULL OR s.current_period_end > now())
  LIMIT 1;

  v_plan_slug := COALESCE(v_plan_slug, 'free');

  -- Compute commission + snapshot the config used
  v_commission := public.compute_commission(v_monto_pen, v_categoria, v_plan_slug);

  SELECT id INTO v_cfg_id
  FROM public.commission_config
  WHERE active = true
    AND (effective_to IS NULL OR effective_to > now())
    AND (categoria = v_categoria OR categoria IS NULL)
    AND (plan_slug = v_plan_slug OR plan_slug IS NULL)
  ORDER BY
    (CASE WHEN categoria IS NOT NULL THEN 2 ELSE 0 END
     + CASE WHEN plan_slug IS NOT NULL THEN 1 ELSE 0 END) DESC,
    effective_from DESC
  LIMIT 1;

  IF v_cfg_id IS NOT NULL THEN
    INSERT INTO public.commissions
      (operation_id, business_id, monto_pen, config_id, config_snapshot)
    SELECT v_operation.id, v_business_id, v_commission, cc.id,
      jsonb_build_object(
        'mode',           cc.mode,
        'percentage_bps', cc.percentage_bps,
        'flat_pen',       cc.flat_pen,
        'min_pen',        cc.min_pen,
        'max_pen',        cc.max_pen,
        'plan_slug',      v_plan_slug,
        'categoria',      v_categoria
      )
    FROM public.commission_config cc WHERE cc.id = v_cfg_id;
  END IF;

  -- Audit
  INSERT INTO public.audit_logs
    (actor_user_id, action, entity_type, entity_id, after_state)
  VALUES (
    (select auth.uid()),
    'propuesta.accepted',
    'propuesta',
    p_propuesta_id,
    jsonb_build_object(
      'operation_id',    v_operation.id,
      'redemption_code', p_redemption_code,
      'commission_pen',  v_commission
    )
  );

  RETURN v_operation;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_propuesta(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_propuesta(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 11. v_active_featured_propuestas view — for feed-side ordering
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_active_featured_propuestas AS
SELECT
  p.id           AS propuesta_id,
  p.solicitud_id,
  p.business_id,
  fo.expires_at  AS featured_until
FROM public.propuestas p
JOIN public.featured_offers fo ON fo.propuesta_id = p.id
WHERE fo.expires_at > now() AND p.status = 'pending';

GRANT SELECT ON public.v_active_featured_propuestas TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION (run manually after push)
-- ============================================================================
--   SELECT compute_commission(1000, 'celular', 'free');   -- expect 30.00
--   SELECT compute_commission(100,  'celular', 'free');   -- expect 10.00 (min)
--   SELECT compute_commission(10000,'celular', 'free');   -- expect 100.00 (max)
--   SELECT id, slug, name, monthly_propuestas, monthly_featured_credits
--   FROM public.plans ORDER BY price_pen;
--     -- expect: free, starter, pro, unlim alongside basico/intermedio/avanzado
-- ============================================================================
