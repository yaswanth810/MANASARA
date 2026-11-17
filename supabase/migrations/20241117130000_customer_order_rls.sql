-- ============================================================
-- MANASARA: Customer-facing RLS policies for order access
-- Allows authenticated users to read their own orders,
-- linked by phone or email through the customers table.
-- ============================================================

-- ── Orders: customers can read their own ─────────────────────────────────────

create policy "orders_customer_select"
  on public.orders for select
  using (
    exists (
      select 1
      from public.customers c
      join public.profiles p on p.id = auth.uid()
      where c.id = orders.customer_id
        and (
          (p.phone is not null and c.phone = p.phone)
          or c.email = (select email from auth.users where id = auth.uid())
        )
    )
  );

-- ── Order items: readable if the parent order belongs to the user ─────────────

create policy "order_items_customer_select"
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders o
      join public.customers c on c.id = o.customer_id
      join public.profiles p on p.id = auth.uid()
      where o.id = order_items.order_id
        and (
          (p.phone is not null and c.phone = p.phone)
          or c.email = (select email from auth.users where id = auth.uid())
        )
    )
  );

-- ── Order status history: readable if parent order belongs to user ────────────

create policy "order_status_history_customer_select"
  on public.order_status_history for select
  using (
    exists (
      select 1
      from public.orders o
      join public.customers c on c.id = o.customer_id
      join public.profiles p on p.id = auth.uid()
      where o.id = order_status_history.order_id
        and (
          (p.phone is not null and c.phone = p.phone)
          or c.email = (select email from auth.users where id = auth.uid())
        )
    )
  );

-- ── Payments: readable if parent order belongs to user ────────────────────────

create policy "payments_customer_select"
  on public.payments for select
  using (
    exists (
      select 1
      from public.orders o
      join public.customers c on c.id = o.customer_id
      join public.profiles p on p.id = auth.uid()
      where o.id = payments.order_id
        and (
          (p.phone is not null and c.phone = p.phone)
          or c.email = (select email from auth.users where id = auth.uid())
        )
    )
  );
