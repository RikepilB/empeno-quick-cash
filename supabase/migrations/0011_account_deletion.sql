-- ============================================================================
-- 0011_account_deletion.sql
-- Cascade-clean a user's pawn-shop data before auth.users row is deleted
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_business uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM operations o
    JOIN propuestas p ON p.id = o.propuesta_id
    JOIN solicitudes s ON s.id = p.solicitud_id
    WHERE s.client_id = v_user
      AND o.status = 'pending_pickup'
  ) THEN
    RAISE EXCEPTION 'Tienes una operación pendiente de retiro. Complétala antes de eliminar tu cuenta.';
  END IF;

  SELECT id INTO v_business FROM businesses WHERE owner_id = v_user;
  IF v_business IS NOT NULL AND EXISTS (
    SELECT 1
    FROM operations o
    JOIN propuestas p ON p.id = o.propuesta_id
    WHERE p.business_id = v_business
      AND o.status = 'pending_pickup'
  ) THEN
    RAISE EXCEPTION 'Tu negocio tiene operaciones pendientes de retiro. Complétalas antes de eliminar tu cuenta.';
  END IF;

  DELETE FROM solicitud_photos
    WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE client_id = v_user);

  DELETE FROM operations
    WHERE propuesta_id IN (
      SELECT p.id FROM propuestas p
      JOIN solicitudes s ON s.id = p.solicitud_id
      WHERE s.client_id = v_user
    );

  DELETE FROM propuestas
    WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE client_id = v_user);

  DELETE FROM solicitudes WHERE client_id = v_user;

  SELECT id INTO v_business FROM businesses WHERE owner_id = v_user;
  IF v_business IS NOT NULL THEN
    DELETE FROM operations
      WHERE propuesta_id IN (SELECT id FROM propuestas WHERE business_id = v_business);
    DELETE FROM propuestas WHERE business_id = v_business;
    DELETE FROM invoices WHERE subscription_id IN (
      SELECT id FROM subscriptions WHERE business_id = v_business
    );
    DELETE FROM subscriptions WHERE business_id = v_business;
    DELETE FROM business_members WHERE business_id = v_business;
    DELETE FROM businesses WHERE id = v_business;
  END IF;

  DELETE FROM profiles WHERE id = v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

COMMIT;
