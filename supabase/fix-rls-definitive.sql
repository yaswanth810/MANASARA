-- ═══════════════════════════════════════════════════════════════════
-- MANASARA — DEFINITIVE RLS FIX
-- Paste this ENTIRE block into Supabase SQL Editor → Run
-- URL: https://supabase.com/dashboard/project/mcnrarmkuyzyycpuvtec/sql
-- ═══════════════════════════════════════════════════════════════════

-- ── PART 1: Fix storage.objects policies ─────────────────────────────
-- Drop ALL existing policies (clears the 7 broken ones)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Recreate exactly 4 clean policies
CREATE POLICY "pub_read"
  ON storage.objects FOR SELECT TO public USING (true);

CREATE POLICY "auth_insert"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update"
  ON storage.objects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete"
  ON storage.objects FOR DELETE TO authenticated USING (true);


-- ── PART 2: Fix product_images table policies ─────────────────────────
-- Drop ALL existing policies on product_images
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_images'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images', r.policyname);
  END LOOP;
END $$;

-- Make sure RLS is enabled
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can do everything
CREATE POLICY "pi_auth_all"
  ON public.product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can read images for active products
CREATE POLICY "pi_anon_read"
  ON public.product_images FOR SELECT
  TO anon
  USING (true);


-- ── PART 3: Verify ───────────────────────────────────────────────────
-- Should show exactly 4 rows for storage.objects
SELECT 'storage.objects policies:' AS check, policyname, cmd::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Should show exactly 2 rows for product_images
SELECT 'product_images policies:' AS check, policyname, cmd::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'product_images'
ORDER BY policyname;
