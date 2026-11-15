-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 003: Order tracking function
-- Secure, rate-limited lookup callable by anon via Edge Function.
-- ═══════════════════════════════════════════════════════════════════════════

-- Rate limit tracking table (used by track-order Edge Function)
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL,            -- IP or order_code hash
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_key ON public.rate_limit_attempts (key, created_at DESC);

-- Auto-cleanup old rate limit records (keep 1 hour only)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < NOW() - INTERVAL '1 hour';
$$;

-- Secure order tracking function
-- Returns only minimal non-sensitive data after verifying phone matches.
CREATE OR REPLACE FUNCTION public.get_order_tracking(
  p_order_code TEXT,
  p_phone      TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order   public.orders%ROWTYPE;
  v_customer public.customers%ROWTYPE;
  v_history JSON;
  v_phone_clean TEXT;
BEGIN
  -- Sanitise inputs
  IF p_order_code IS NULL OR p_phone IS NULL THEN
    RETURN NULL;
  END IF;

  v_phone_clean := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  -- Strip leading 91 (country code) if present
  IF LENGTH(v_phone_clean) = 12 AND v_phone_clean LIKE '91%' THEN
    v_phone_clean := SUBSTRING(v_phone_clean FROM 3);
  END IF;

  -- Look up order
  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = UPPER(TRIM(p_order_code));

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Look up customer and verify phone matches
  SELECT * INTO v_customer
  FROM public.customers
  WHERE id = v_order.customer_id;

  IF v_customer.phone != v_phone_clean THEN
    -- Do NOT reveal the order exists; just return null
    RETURN NULL;
  END IF;

  -- Build status history (minimal: status label + timestamp only)
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'status',    h.new_status,
      'timestamp', h.created_at
    ) ORDER BY h.created_at ASC
  )
  INTO v_history
  FROM public.order_status_history h
  WHERE h.order_id = v_order.id;

  -- Return ONLY safe, minimal fields — no address, no payment details, no customer name
  RETURN JSON_BUILD_OBJECT(
    'order_code',      v_order.order_code,
    'status',          v_order.status,
    'payment_status',  v_order.payment_status,
    'created_at',      v_order.created_at,
    'updated_at',      v_order.updated_at,
    'history',         COALESCE(v_history, '[]'::JSON)
  );
END;
$$;

-- Grant execute to anon (called via Edge Function which passes through)
GRANT EXECUTE ON FUNCTION public.get_order_tracking TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_tracking TO authenticated;

-- RLS for rate_limit_attempts (service role only via Edge Functions)
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;
-- No public access; Edge Function uses service role to bypass RLS
