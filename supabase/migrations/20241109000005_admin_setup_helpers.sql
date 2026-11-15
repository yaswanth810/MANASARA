-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Admin Setup Helpers
-- ─────────────────────────────────────────────────────────────────────────
-- PURPOSE : One-time / on-demand manual operations for the MANASARA team.
-- HOW     : Copy the relevant block into Supabase Dashboard → SQL Editor
--           and run it there. Do NOT run via `supabase db push`.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── Step 1: Register an admin user ──────────────────────────────────────────
-- After creating the user in Supabase Auth → Users (Dashboard),
-- paste their UUID below and run this insert.
/*
INSERT INTO public.admin_profiles (user_id, display_name, role, is_active)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- replace with auth.users UUID
  'Founder Name',                          -- replace with display name
  'OWNER',                                 -- OWNER | ADMIN | VIEWER
  TRUE
);
*/


-- ─── Step 2: Verify the admin was registered correctly ───────────────────────
/*
SELECT
  ap.display_name,
  ap.role,
  au.email,
  ap.is_active,
  ap.created_at
FROM public.admin_profiles ap
JOIN auth.users au ON ap.user_id = au.id
ORDER BY ap.created_at;
*/


-- ─── Step 3: Activate products once prices are confirmed ─────────────────────
-- Change DRAFT products to ACTIVE one at a time after reviewing prices and
-- ensuring product images are uploaded to the product-images bucket.
/*
UPDATE public.products
SET status = 'ACTIVE', updated_at = NOW()
WHERE slug = 'cherry-keychain';  -- repeat for each product slug

-- To activate all DRAFT products at once (use with caution):
-- UPDATE public.products SET status = 'ACTIVE', updated_at = NOW()
-- WHERE status = 'DRAFT';
*/


-- ─── Step 4: Set the live UPI ID ─────────────────────────────────────────────
-- The value column is JSONB — wrap the UPI string in double quotes.
/*
UPDATE public.store_settings
SET value = '"your-actual-upi-id@upi"', updated_at = NOW()
WHERE key = 'upi_id';
*/


-- ─── Step 5: Review all current store settings ───────────────────────────────
/*
SELECT key, value, updated_at
FROM public.store_settings
ORDER BY key;
*/


-- ─── Step 6: Deactivate an admin account (e.g., team member leaves) ──────────
/*
UPDATE public.admin_profiles
SET is_active = FALSE, updated_at = NOW()
WHERE user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
*/


-- ─── Step 7: Check inventory levels (low stock alert) ────────────────────────
-- Lists materials whose current stock is at or below their reorder threshold.
/*
SELECT
  m.name,
  m.unit,
  m.reorder_threshold,
  COALESCE(SUM(it.quantity_change), 0) AS current_stock
FROM public.materials m
LEFT JOIN public.inventory_transactions it ON it.material_id = m.id
GROUP BY m.id, m.name, m.unit, m.reorder_threshold
HAVING COALESCE(SUM(it.quantity_change), 0) <= m.reorder_threshold
ORDER BY current_stock ASC;
*/
