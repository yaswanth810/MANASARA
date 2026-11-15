-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 004: Storage Bucket Policies
-- Creates public read + admin write policies for Storage buckets.
-- Note: Bucket creation itself is done via Supabase Dashboard or CLI.
--
-- Buckets:
--   • product-images  (public) — product photography
--   • store-assets    (public) — UPI QR codes, brand assets
--
-- Requires: is_active_admin() helper defined in migration 002.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── product-images ──────────────────────────────────────────────────────────

-- Anyone (including unauthenticated visitors) can view product images.
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Only active admins may upload new product images.
CREATE POLICY "product_images_admin_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_active_admin()
);

-- Only active admins may overwrite / replace product images.
CREATE POLICY "product_images_admin_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND public.is_active_admin()
);

-- Only active admins may delete product images.
CREATE POLICY "product_images_admin_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND public.is_active_admin()
);

-- ─── store-assets ────────────────────────────────────────────────────────────

-- Anyone can read store assets (UPI QR, brand logos, banners, etc.).
CREATE POLICY "store_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Only active admins may upload new store assets.
CREATE POLICY "store_assets_admin_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-assets'
  AND public.is_active_admin()
);

-- Only active admins may update existing store assets.
CREATE POLICY "store_assets_admin_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-assets'
  AND public.is_active_admin()
);

-- Only active admins may delete store assets.
CREATE POLICY "store_assets_admin_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-assets'
  AND public.is_active_admin()
);
