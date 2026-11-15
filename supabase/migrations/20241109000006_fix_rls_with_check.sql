-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 006: Fix RLS policies for admin writes
-- product_images INSERT/UPDATE need WITH CHECK, not just USING.
-- Also fixes: products, categories, materials, expenses, store_settings,
--             serviceable_pincodes, product_recipes.
-- Run: supabase db push --remote
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Drop and recreate the broken "FOR ALL" admin policies ─────────────────────
-- PostgreSQL: FOR ALL with only USING works for SELECT/UPDATE/DELETE but
-- silently blocks INSERT because INSERT has no existing row to check USING against.
-- We need explicit WITH CHECK for any policy covering INSERT.

-- product_images
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can select product images"
  ON public.product_images FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  USING (public.is_active_admin());

-- products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can select products"
  ON public.products FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_active_admin());

-- categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can select categories"
  ON public.categories FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_active_admin());

-- materials
DROP POLICY IF EXISTS "Admins can manage materials" ON public.materials;
CREATE POLICY "Admins can select materials"
  ON public.materials FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert materials"
  ON public.materials FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update materials"
  ON public.materials FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete materials"
  ON public.materials FOR DELETE
  USING (public.is_active_admin());

-- product_recipes
DROP POLICY IF EXISTS "Admins can manage recipes" ON public.product_recipes;
CREATE POLICY "Admins can select recipes"
  ON public.product_recipes FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert recipes"
  ON public.product_recipes FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update recipes"
  ON public.product_recipes FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete recipes"
  ON public.product_recipes FOR DELETE
  USING (public.is_active_admin());

-- expenses
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can select expenses"
  ON public.expenses FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update expenses"
  ON public.expenses FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (public.is_active_admin());

-- store_settings (there were two overlapping policies — consolidate)
DROP POLICY IF EXISTS "Admins can read all store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can upsert store settings"   ON public.store_settings;
CREATE POLICY "Admins can select store settings"
  ON public.store_settings FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update store settings"
  ON public.store_settings FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- serviceable_pincodes
DROP POLICY IF EXISTS "Admins can manage pincodes" ON public.serviceable_pincodes;
CREATE POLICY "Admins can select pincodes"
  ON public.serviceable_pincodes FOR SELECT
  USING (public.is_active_admin());
CREATE POLICY "Admins can insert pincodes"
  ON public.serviceable_pincodes FOR INSERT
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can update pincodes"
  ON public.serviceable_pincodes FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
CREATE POLICY "Admins can delete pincodes"
  ON public.serviceable_pincodes FOR DELETE
  USING (public.is_active_admin());

-- payments: add INSERT policy for Edge Function compatibility
CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (public.is_active_admin());
