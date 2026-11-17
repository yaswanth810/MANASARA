-- ============================================================
-- MANASARA: Add missing columns to payments table
-- database.types.ts was ahead of the actual schema.
-- These columns are required by submit-payment-reference
-- and verify-payment edge functions.
-- ============================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS submitted_amount_paise  bigint,
  ADD COLUMN IF NOT EXISTS rejection_reason         text,
  ADD COLUMN IF NOT EXISTS rejected_at              timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by              uuid REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz NOT NULL DEFAULT now();

-- Back-fill updated_at for existing rows
UPDATE public.payments SET updated_at = created_at WHERE updated_at IS NULL;

-- Auto-maintain updated_at on future updates
-- (re-use or create the set_updated_at trigger function)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Also add upi_qr_path to the public-readable store_settings keys
-- so customers can see the QR code on the order confirmation page
-- even after a page refresh (currently blocked by RLS).
DROP POLICY IF EXISTS "Public can read safe store settings" ON public.store_settings;
CREATE POLICY "Public can read safe store settings"
  ON public.store_settings FOR SELECT
  USING (
    key IN (
      'announcement_text',
      'announcement_visible',
      'upi_id',
      'upi_qr_path',
      'store_name',
      'contact_email',
      'instagram_url'
    )
  );
