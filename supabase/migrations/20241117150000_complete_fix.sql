-- ============================================================
-- MANASARA: Complete fix migration (run this in Supabase SQL Editor)
-- Covers: payments missing columns, store_settings RLS,
--         user profiles, saved addresses, customer order RLS.
-- Safe to run multiple times (all IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ── 1. payments table: add missing columns ────────────────────────────────────

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS submitted_amount_paise  bigint,
  ADD COLUMN IF NOT EXISTS rejection_reason         text,
  ADD COLUMN IF NOT EXISTS rejected_at              timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by              uuid REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz NOT NULL DEFAULT now();

-- Back-fill updated_at for existing rows
UPDATE public.payments SET updated_at = created_at WHERE updated_at IS NULL;

-- Auto-maintain updated_at on future updates
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

-- ── 2. store_settings: allow public read of upi_qr_path ──────────────────────

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

-- Make sure upi_qr_path row exists so the hook doesn't get a 404
-- value is JSONB so must be valid JSON — use JSON null literal (not SQL NULL)
INSERT INTO public.store_settings (key, value)
VALUES ('upi_qr_path', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 3. User profiles table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  phone       text UNIQUE,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 4. Saved addresses table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label          text DEFAULT 'Home',
  address_line1  text NOT NULL,
  address_line2  text,
  locality       text,
  city           text NOT NULL,
  district       text,
  state          text NOT NULL,
  pincode        text NOT NULL,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.saved_addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.saved_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. Customer-linked order RLS (lets signed-in users see their orders) ──────

-- Drop both old and new policy names to avoid conflicts
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
CREATE POLICY "orders_customer_select"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = orders.customer_id
        AND (
          (p.phone IS NOT NULL AND c.phone = p.phone)
          OR c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_customer_select" ON public.order_items;
CREATE POLICY "order_items_customer_select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = order_items.order_id
        AND (
          (p.phone IS NOT NULL AND c.phone = p.phone)
          OR c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Customers can read own payments" ON public.payments;
DROP POLICY IF EXISTS "payments_customer_select" ON public.payments;
CREATE POLICY "payments_customer_select"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = payments.order_id
        AND (
          (p.phone IS NOT NULL AND c.phone = p.phone)
          OR c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Customers can read own order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "order_status_history_customer_select" ON public.order_status_history;
CREATE POLICY "order_status_history_customer_select"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = order_status_history.order_id
        AND (
          (p.phone IS NOT NULL AND c.phone = p.phone)
          OR c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
  );

-- ── 6. Ensure store-assets storage bucket exists ──────────────────────────────
-- (If this errors, create the bucket manually in Storage → New bucket → "store-assets", Public)

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read of store-assets
DROP POLICY IF EXISTS "Public can read store assets" ON storage.objects;
CREATE POLICY "Public can read store assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

-- Allow admin users to upload/delete store assets
DROP POLICY IF EXISTS "Admins can upload store assets" ON storage.objects;
CREATE POLICY "Admins can upload store assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update store assets" ON storage.objects;
CREATE POLICY "Admins can update store assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete store assets" ON storage.objects;
CREATE POLICY "Admins can delete store assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true
    )
  );
