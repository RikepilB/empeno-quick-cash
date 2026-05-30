-- ============================================================================
-- 0012_beta_full_access.sql
-- Beta phase: all businesses get full access (avanzado plan).
-- Plans exist in schema but limits are not enforced until Prototype 3+.
-- ============================================================================

BEGIN;

-- Move all existing subscriptions to avanzado (unlimited)
UPDATE public.subscriptions
SET plan_id = 'avanzado',
    propuestas_used_this_period = 0
WHERE plan_id IN ('basico', 'intermedio', 'free', 'starter', 'pro');

-- Update the new-user trigger to assign avanzado instead of basico
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_full_name text;
  v_business_name text;
  v_district text;
  v_business_id uuid;
BEGIN
  v_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_business_name := new.raw_user_meta_data->>'business_name';
  v_district := new.raw_user_meta_data->>'district';

  IF v_role NOT IN ('client','business') THEN
    RAISE EXCEPTION 'Invalid role: %', v_role;
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (new.id, v_role, v_full_name);

  IF v_role = 'business' THEN
    IF v_business_name IS NULL OR length(trim(v_business_name)) = 0 THEN
      RAISE EXCEPTION 'business_name is required for role=business';
    END IF;

    INSERT INTO public.businesses (owner_id, name, district)
    VALUES (new.id, v_business_name, v_district)
    RETURNING id INTO v_business_id;

    INSERT INTO public.subscriptions (business_id, plan_id, status, propuestas_used_this_period)
    VALUES (v_business_id, 'avanzado', 'trialing', 0);
  END IF;

  RETURN new;
END
$$;

COMMIT;
