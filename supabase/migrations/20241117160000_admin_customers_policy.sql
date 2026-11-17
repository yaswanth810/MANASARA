-- ============================================================
-- MANASARA: Fix admin order detail + user my-orders
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Admin can read customers table (needed for order detail page) ──────────
DROP POLICY IF EXISTS "Admins can read all customers" ON public.customers;
CREATE POLICY "Admins can read all customers"
  ON public.customers FOR SELECT
  USING (public.is_active_admin());

-- ── 2. Admin can update orders (save internal notes, status) ──────────────────
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- ── 3. Admin can update payments (verify/reject) ──────────────────────────────
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- ── 4. Admin can insert order_status_history (when updating order status) ─────
DROP POLICY IF EXISTS "Admins can insert order status history" ON public.order_status_history;
CREATE POLICY "Admins can insert order status history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.is_active_admin());

-- ── 5. User my-orders: allow authenticated users to read customers table
--       (needed for the OR query by email/phone to find their customer record)
--       But only their own record.
DROP POLICY IF EXISTS "Users can read own customer record" ON public.customers;
CREATE POLICY "Users can read own customer record"
  ON public.customers FOR SELECT
  USING (
    email = auth.email()
    OR phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
  );

-- ── 6. Ensure order_items RLS allows users to see their own items via orders RLS
--       (The join in the orders query should work if order_items policy is set)
--       Already added in previous migration but re-add safely:
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items"
  ON public.order_items FOR SELECT
  USING (public.is_active_admin());
