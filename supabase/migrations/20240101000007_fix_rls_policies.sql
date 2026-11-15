-- ═══════════════════════════════════════════════════════════════════════
-- Migration 007 — Fix RLS policies for storage and product_images
-- This fixes: "new row violates row-level security policy" errors
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Fix storage.objects policies ──────────────────────────────────────────
-- Drop every existing policy (there are 7 conflicting ones)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Recreate exactly 4 clean, permissive policies
CREATE POLICY "storage_pub_read"
  ON storage.objects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "storage_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "storage_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (true);


-- ── 2. Fix product_images table policies ─────────────────────────────────────
-- Drop every existing policy on product_images
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_images'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images', r.policyname);
  END LOOP;
END $$;

-- Ensure RLS is on
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins logged in) can do everything
CREATE POLICY "pi_auth_all"
  ON public.product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can read (needed for storefront to show images)
CREATE POLICY "pi_anon_read"
  ON public.product_images FOR SELECT
  TO anon
  USING (true);
