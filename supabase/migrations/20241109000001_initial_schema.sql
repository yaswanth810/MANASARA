-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 001: Initial Schema
-- Run: supabase db push
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE public.admin_role AS ENUM ('OWNER', 'ADMIN', 'VIEWER');
CREATE TYPE public.order_status AS ENUM (
  'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PRODUCTION',
  'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
);
CREATE TYPE public.payment_status AS ENUM (
  'PENDING', 'SUBMITTED', 'PARTIALLY_PAID',
  'PAID', 'REFUND_PENDING', 'REFUNDED'
);
CREATE TYPE public.product_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE public.inventory_transaction_type AS ENUM (
  'OPENING', 'PURCHASE', 'PRODUCTION_USAGE', 'ADJUSTMENT', 'RETURN', 'REVERSAL'
);

-- ── Helper: updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. admin_profiles ─────────────────────────────────────────────────────────
CREATE TABLE public.admin_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role        public.admin_role NOT NULL DEFAULT 'ADMIN',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_profiles_user_id_key UNIQUE (user_id)
);
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. categories ─────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_slug_key UNIQUE (slug)
);
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_categories_slug ON public.categories (slug);
CREATE INDEX idx_categories_active ON public.categories (is_active, display_order);

-- ── 3. products ───────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id               UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL,
  sku                       TEXT NOT NULL,
  description               TEXT,
  price_paise               BIGINT NOT NULL CHECK (price_paise > 0),
  compare_at_price_paise    BIGINT CHECK (compare_at_price_paise > 0),
  status                    public.product_status NOT NULL DEFAULT 'DRAFT',
  is_made_to_order          BOOLEAN NOT NULL DEFAULT TRUE,
  production_lead_days_min  INT NOT NULL DEFAULT 2 CHECK (production_lead_days_min >= 0),
  production_lead_days_max  INT NOT NULL DEFAULT 5 CHECK (production_lead_days_max >= production_lead_days_min),
  options                   JSONB,
  sort_order                INT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_slug_key UNIQUE (slug),
  CONSTRAINT products_sku_key  UNIQUE (sku)
);
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_products_slug       ON public.products (slug);
CREATE INDEX idx_products_status     ON public.products (status);
CREATE INDEX idx_products_category   ON public.products (category_id);
CREATE INDEX idx_products_sort       ON public.products (sort_order, created_at DESC);

-- ── 4. product_images ─────────────────────────────────────────────────────────
CREATE TABLE public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  alt_text      TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON public.product_images (product_id, display_order);

-- ── 5. customers ──────────────────────────────────────────────────────────────
CREATE TABLE public.customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_phone_key UNIQUE (phone),
  CONSTRAINT customers_phone_format CHECK (phone ~ '^[6-9][0-9]{9}$')
);
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_customers_phone ON public.customers (phone);

-- ── 6. orders ─────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code               TEXT NOT NULL,
  idempotency_key          TEXT NOT NULL,
  customer_id              UUID NOT NULL REFERENCES public.customers(id),
  status                   public.order_status   NOT NULL DEFAULT 'AWAITING_PAYMENT',
  payment_status           public.payment_status NOT NULL DEFAULT 'PENDING',
  subtotal_paise           BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  shipping_paise           BIGINT NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  total_paise              BIGINT NOT NULL CHECK (total_paise >= 0),
  -- Shipping address (snapshot at time of order)
  shipping_name            TEXT NOT NULL,
  shipping_phone           TEXT NOT NULL,
  shipping_email           TEXT,
  shipping_address_line1   TEXT NOT NULL,
  shipping_address_line2   TEXT,
  shipping_locality        TEXT,
  shipping_city            TEXT NOT NULL,
  shipping_district        TEXT NOT NULL,
  shipping_state           TEXT NOT NULL,
  shipping_pincode         TEXT NOT NULL CHECK (shipping_pincode ~ '^[1-9][0-9]{5}$'),
  customisation_note       TEXT,
  internal_notes           TEXT,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_order_code_key      UNIQUE (order_code),
  CONSTRAINT orders_idempotency_key_key UNIQUE (idempotency_key)
);
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_orders_customer        ON public.orders (customer_id);
CREATE INDEX idx_orders_status          ON public.orders (status);
CREATE INDEX idx_orders_payment_status  ON public.orders (payment_status);
CREATE INDEX idx_orders_code            ON public.orders (order_code);
CREATE INDEX idx_orders_created_at      ON public.orders (created_at DESC);

-- Function to generate order code (called from Edge Function)
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date TEXT   := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  v_seq  BIGINT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.orders
  WHERE TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') = v_date;
  RETURN 'MNS-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ── 7. order_items (immutable purchase snapshots) ─────────────────────────────
CREATE TABLE public.order_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id                UUID REFERENCES public.products(id) ON DELETE SET NULL,
  snapshot_product_name     TEXT NOT NULL,
  snapshot_sku              TEXT NOT NULL,
  snapshot_unit_price_paise BIGINT NOT NULL CHECK (snapshot_unit_price_paise > 0),
  snapshot_options          JSONB,
  quantity                  INT NOT NULL CHECK (quantity > 0),
  line_total_paise          BIGINT NOT NULL CHECK (line_total_paise > 0),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: order items are immutable
);
CREATE INDEX idx_order_items_order   ON public.order_items (order_id);
CREATE INDEX idx_order_items_product ON public.order_items (product_id);

-- ── 8. payments ───────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status                 public.payment_status NOT NULL DEFAULT 'PENDING',
  amount_expected_paise  BIGINT NOT NULL CHECK (amount_expected_paise >= 0),
  amount_received_paise  BIGINT CHECK (amount_received_paise >= 0),
  utr_reference          TEXT,
  customer_payment_note  TEXT,
  submitted_at           TIMESTAMPTZ,
  verified_amount_paise  BIGINT CHECK (verified_amount_paise >= 0),
  verified_reference     TEXT,
  verified_by            UUID REFERENCES public.admin_profiles(id),
  verified_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_order_id_key UNIQUE (order_id)
);
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_payments_order  ON public.payments (order_id);
CREATE INDEX idx_payments_status ON public.payments (status);

-- ── 9. order_status_history (append-only audit log) ──────────────────────────
CREATE TABLE public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status  public.order_status,
  new_status  public.order_status NOT NULL,
  changed_by  TEXT,  -- admin_profiles.id as text, or 'SYSTEM', or 'EDGE_FUNCTION'
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: immutable history
);
CREATE INDEX idx_osh_order ON public.order_status_history (order_id, created_at);

-- ── 10. materials ─────────────────────────────────────────────────────────────
CREATE TABLE public.materials (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  sku                  TEXT,
  unit                 TEXT NOT NULL DEFAULT 'pcs',
  cost_per_unit_paise  BIGINT NOT NULL DEFAULT 0 CHECK (cost_per_unit_paise >= 0),
  low_stock_threshold  INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT materials_sku_key UNIQUE (sku)
);
CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 11. product_recipes ───────────────────────────────────────────────────────
CREATE TABLE public.product_recipes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_id        UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity_per_unit  NUMERIC(10, 4) NOT NULL CHECK (quantity_per_unit > 0),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_recipes_product_material_key UNIQUE (product_id, material_id)
);
CREATE TRIGGER trg_product_recipes_updated_at
  BEFORE UPDATE ON public.product_recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_recipes_product  ON public.product_recipes (product_id);
CREATE INDEX idx_recipes_material ON public.product_recipes (material_id);

-- ── 12. inventory_transactions (append-only ledger) ──────────────────────────
CREATE TABLE public.inventory_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id      UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  type             public.inventory_transaction_type NOT NULL,
  quantity_delta   NUMERIC(10, 4) NOT NULL,
  balance_after    NUMERIC(10, 4) NOT NULL,
  reference_id     UUID,
  idempotency_key  TEXT,
  recorded_by      UUID REFERENCES public.admin_profiles(id),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_transactions_idempotency_key UNIQUE (idempotency_key)
);
CREATE INDEX idx_inv_material   ON public.inventory_transactions (material_id, created_at DESC);
CREATE INDEX idx_inv_idempotent ON public.inventory_transactions (idempotency_key);

-- ── 13. expenses ──────────────────────────────────────────────────────────────
CREATE TABLE public.expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category          TEXT NOT NULL,
  description       TEXT NOT NULL,
  amount_paise      BIGINT NOT NULL CHECK (amount_paise > 0),
  expense_date      DATE NOT NULL,
  receipt_reference TEXT,
  recorded_by       UUID NOT NULL REFERENCES public.admin_profiles(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_expenses_date ON public.expenses (expense_date DESC);

-- ── 14. store_settings ────────────────────────────────────────────────────────
CREATE TABLE public.store_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES public.admin_profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_settings_key_key UNIQUE (key)
);
CREATE INDEX idx_store_settings_key ON public.store_settings (key);

-- ── 15. serviceable_pincodes ──────────────────────────────────────────────────
CREATE TABLE public.serviceable_pincodes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode             TEXT NOT NULL,
  area_name           TEXT,
  city                TEXT,
  state               TEXT NOT NULL,
  shipping_rate_paise BIGINT NOT NULL DEFAULT 0 CHECK (shipping_rate_paise >= 0),
  estimated_days_min  INT NOT NULL DEFAULT 1 CHECK (estimated_days_min >= 0),
  estimated_days_max  INT NOT NULL DEFAULT 5 CHECK (estimated_days_max >= estimated_days_min),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT serviceable_pincodes_pincode_key UNIQUE (pincode),
  CONSTRAINT serviceable_pincodes_format CHECK (pincode ~ '^[1-9][0-9]{5}$')
);
CREATE TRIGGER trg_pincodes_updated_at
  BEFORE UPDATE ON public.serviceable_pincodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_pincodes_active ON public.serviceable_pincodes (pincode, is_active);
