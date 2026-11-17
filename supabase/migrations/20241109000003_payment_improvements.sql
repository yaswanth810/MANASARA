-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Migration 003: Payment Improvements
-- Adds: rate_limit_attempts table, payment rejection columns,
--       REJECTED enum value, advance payment settings, UTR index
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. rate_limit_attempts (used by track-order Edge Function) ────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time
  ON public.rate_limit_attempts (key, created_at);

-- RLS: allow service role only (Edge Functions run with service role key)
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'rate_limit_attempts'
      AND policyname = 'rate_limit_service_only'
  ) THEN
    CREATE POLICY "rate_limit_service_only" ON public.rate_limit_attempts
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END;
$$;

-- Cleanup RPC called by track-order Edge Function to prune old records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Add REJECTED to payment_status enum ───────────────────────────────────
-- IF NOT EXISTS is supported in Postgres 9.6+; safe to run multiple times.
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- ── 3. Add rejection + submitted_amount columns to payments ──────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS submitted_amount_paise BIGINT,
  ADD COLUMN IF NOT EXISTS rejection_reason       TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by            UUID REFERENCES public.admin_profiles(id);

-- ── 4. Index on payments.utr_reference for fast duplicate detection ───────────
CREATE INDEX IF NOT EXISTS idx_payments_utr
  ON public.payments (utr_reference)
  WHERE utr_reference IS NOT NULL;

-- ── 5. Advance payment settings in store_settings ────────────────────────────
-- store_settings.value is JSONB — string values must be JSON-encoded strings.
-- store_settings has no description column (confirmed from migration 001).
INSERT INTO public.store_settings (key, value) VALUES
  ('custom_order_advance_percent', '"50"'),
  ('upi_name',                     '"MANASARA"')
ON CONFLICT (key) DO NOTHING;
