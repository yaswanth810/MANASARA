-- ═══════════════════════════════════════════════════════════════
-- MANASARA — Final Storage Policy Fix
-- Run this in Supabase SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Nuke ALL existing policies on storage.objects for product-images
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON storage.objects',
      r.policyname
    );
  END LOOP;
END $$;

-- Step 2: Also nuke policies on storage.buckets
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'buckets'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON storage.buckets',
      r.policyname
    );
  END LOOP;
END $$;

-- Step 3: Recreate exactly 4 clean policies on storage.objects
-- Public can read any file (needed for product images to display)
CREATE POLICY "public_read_all_storage"
  ON storage.objects FOR SELECT
  TO public
  USING (true);

-- Authenticated users can upload files
CREATE POLICY "auth_insert_storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update files
CREATE POLICY "auth_update_storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete files
CREATE POLICY "auth_delete_storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (true);

-- Step 4: Verify — should show exactly 4 rows for storage.objects
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
