-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 002: Row Level Security
-- Every table gets RLS enabled with explicit least-privilege policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE public.admin_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceable_pincodes   ENABLE ROW LEVEL SECURITY;

-- ── Admin helper function ─────────────────────────────────────────────────────
-- Returns TRUE if the calling user has an active admin_profile.
-- SECURITY DEFINER so it can query admin_profiles without recursion.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
      AND is_active = TRUE
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PUBLIC (anon + authenticated) READ policies
-- ═══════════════════════════════════════════════════════════════════════════

-- categories: active only
CREATE POLICY "Public can read active categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE);

-- products: active only
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (status = 'ACTIVE');

-- product_images: images of active products only
CREATE POLICY "Public can read images of active products"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.status = 'ACTIVE'
    )
  );

-- store_settings: safe public keys only
CREATE POLICY "Public can read safe store settings"
  ON public.store_settings FOR SELECT
  USING (
    key IN (
      'announcement_text',
      'announcement_visible',
      'upi_id',
      'store_name',
      'contact_email',
      'instagram_url'
    )
  );

-- serviceable_pincodes: active only
CREATE POLICY "Public can read active pincodes"
  ON public.serviceable_pincodes FOR SELECT
  USING (is_active = TRUE);

-- ═══════════════════════════════════════════════════════════════════════════
-- NO anonymous direct INSERT/SELECT on orders, customers, payments, etc.
-- All guest mutations go through Edge Functions using the SERVICE_ROLE key,
-- which bypasses RLS entirely.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN policies (authenticated + active admin_profile required)
-- ═══════════════════════════════════════════════════════════════════════════

-- admin_profiles: admins can read their own profile
CREATE POLICY "Admins can read admin profiles"
  ON public.admin_profiles FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins can update their own profile"
  ON public.admin_profiles FOR UPDATE
  USING (user_id = auth.uid() AND public.is_active_admin());

-- categories: full CRUD for admins
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_active_admin());

-- products: full CRUD for admins
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_active_admin());

-- product_images: full CRUD for admins
CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_active_admin());

-- customers: admins can read; Edge Functions write via service role
CREATE POLICY "Admins can read customers"
  ON public.customers FOR SELECT
  USING (public.is_active_admin());

-- orders: admins can read; restricted update (not full replace)
CREATE POLICY "Admins can read all orders"
  ON public.orders FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_active_admin());

-- order_items: admins read-only (immutable — no UPDATE/DELETE allowed)
CREATE POLICY "Admins can read order items"
  ON public.order_items FOR SELECT
  USING (public.is_active_admin());

-- payments: admins read + update (for verification)
CREATE POLICY "Admins can read payments"
  ON public.payments FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.is_active_admin());

-- order_status_history: admins can read; INSERT via Edge Function
CREATE POLICY "Admins can read status history"
  ON public.order_status_history FOR SELECT
  USING (public.is_active_admin());

-- materials: full CRUD for admins
CREATE POLICY "Admins can manage materials"
  ON public.materials FOR ALL
  USING (public.is_active_admin());

-- product_recipes: full CRUD for admins
CREATE POLICY "Admins can manage recipes"
  ON public.product_recipes FOR ALL
  USING (public.is_active_admin());

-- inventory_transactions: admins can read and INSERT; no UPDATE/DELETE (append-only)
CREATE POLICY "Admins can read inventory transactions"
  ON public.inventory_transactions FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins can insert inventory transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (public.is_active_admin());

-- expenses: full CRUD for admins
CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL
  USING (public.is_active_admin());

-- store_settings: admins can read all and upsert
CREATE POLICY "Admins can read all store settings"
  ON public.store_settings FOR SELECT
  USING (public.is_active_admin());

CREATE POLICY "Admins can upsert store settings"
  ON public.store_settings FOR ALL
  USING (public.is_active_admin());

-- serviceable_pincodes: full CRUD for admins
CREATE POLICY "Admins can manage pincodes"
  ON public.serviceable_pincodes FOR ALL
  USING (public.is_active_admin());
