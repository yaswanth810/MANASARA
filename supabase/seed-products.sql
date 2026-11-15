-- ============================================================
-- MANASARA — Clean Product Seed (safe to run multiple times)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- ── STEP 1: Upsert Categories (safe — uses ON CONFLICT on slug) ──────────────
INSERT INTO categories (name, slug, description, display_order)
VALUES
  ('Friendship Dolls',  'friendship-dolls', 'BFF pairs and cute character dolls',         1),
  ('Wedding Couples',   'wedding-couples',  'Bride and groom chenille keepsakes',          2),
  ('Romantic Pairs',    'romantic-pairs',   'Love-themed couples for anniversaries',       3),
  ('Custom Orders',     'custom-orders',    'Your design, crafted to order',               4),
  ('Keychains',         'keychains',        'Cherry, flower and animal keychains',         5),
  ('Bouquets',          'bouquets',         'Handmade flower arrangements',                6)
ON CONFLICT (slug) DO UPDATE
  SET name         = EXCLUDED.name,
      description  = EXCLUDED.description,
      display_order = EXCLUDED.display_order;

-- ── STEP 2: Upsert Products ──────────────────────────────────────────────────
-- Uses ON CONFLICT on slug (not sku) to avoid duplicate-sku issues

INSERT INTO products (
  name, slug, sku, description, short_description,
  price_paise, category_id, status,
  production_lead_days_min, production_lead_days_max,
  sort_order, is_featured
)
SELECT
  v.name, v.slug, v.sku, v.description, v.short_description,
  v.price_paise,
  c.id AS category_id,
  v.status,
  v.min_days, v.max_days,
  v.sort_order, v.is_featured
FROM (VALUES
  -- Friendship Dolls
  ('BFF Friendship Doll Pair',       'bff-friendship-doll-pair',       'FRN-001',
   'A pair of chenille pipe-cleaner best-friend dolls, made to represent your unique bond. Each doll is handcrafted with carefully chosen colours and details.',
   'Handmade BFF chenille doll pair',                                   84900,  'friendship-dolls', 'ACTIVE', 2, 4, 1, true),

  -- Wedding Couples
  ('Wedding Couple Chenille Dolls',  'wedding-couple-chenille-dolls',  'WED-001',
   'A bride and groom set handcrafted from soft chenille pipe-cleaners. The bride wears a delicate white gown; the groom is dressed in a smart black suit.',
   'Handmade bride & groom keepsake dolls',                            129900, 'wedding-couples',  'ACTIVE', 3, 5, 1, true),

  -- Romantic Pairs
  ('Romantic Couple Doll Set',       'romantic-couple-doll-set',       'ROM-001',
   'A sweet couple doll set perfect for anniversaries, Valentine''s Day or just because. Customise hair and outfit colours.',
   'Handmade romantic couple keepsake',                                 99900, 'romantic-pairs',   'ACTIVE', 2, 4, 1, true),

  -- Custom Orders
  ('Custom Personalised Doll',       'custom-personalised-doll',       'CUS-001',
   'Send us photos and we''ll recreate the person in chenille doll form! Choose skin tone, hair colour, outfit and size. Perfect for birthdays.',
   'Fully personalised chenille doll',                                 149900, 'custom-orders',    'ACTIVE', 4, 7, 1, true),

  -- Keychains
  ('Cherry Pipe-Cleaner Keychain',   'cherry-pipe-cleaner-keychain',   'KAN-001',
   'Adorable handmade cherry keychain made from red and green chenille pipe-cleaners. A charming little accessory for bags and keys.',
   'Handmade cherry keychain charm',                                    29900, 'keychains',        'ACTIVE', 1, 2, 1, false),

  ('Flower Keychain Charm',          'flower-keychain-charm',          'KAN-004',
   'A delicate handmade flower keychain in your choice of colour. Lightweight and long-lasting — perfect as a gift or personal accessory.',
   'Handmade flower keychain',                                          34900, 'keychains',        'ACTIVE', 1, 2, 2, false),

  -- Bouquets
  ('Handmade Flower Bouquet',        'handmade-flower-bouquet',        'BQT-001',
   'A beautiful arrangement of chenille flowers wrapped in organza ribbon. Available in pink, yellow and mixed. Perfect for gifting.',
   'Handmade chenille flower bouquet',                                  74900, 'bouquets',         'ACTIVE', 2, 3, 1, true)
) AS v(name, slug, sku, description, short_description, price_paise, cat_slug, status, min_days, max_days, sort_order, is_featured)
JOIN categories c ON c.slug = v.cat_slug
ON CONFLICT (slug) DO UPDATE
  SET name                     = EXCLUDED.name,
      sku                      = EXCLUDED.sku,
      description              = EXCLUDED.description,
      short_description        = EXCLUDED.short_description,
      price_paise              = EXCLUDED.price_paise,
      category_id              = EXCLUDED.category_id,
      status                   = EXCLUDED.status,
      production_lead_days_min = EXCLUDED.production_lead_days_min,
      production_lead_days_max = EXCLUDED.production_lead_days_max,
      sort_order               = EXCLUDED.sort_order,
      is_featured              = EXCLUDED.is_featured;

-- ── STEP 3: Also activate the original Animal Keychain if it exists ──────────
UPDATE products
SET status = 'ACTIVE', sort_order = 3
WHERE slug = 'animal-keychain' OR sku = 'KAN-002';

-- ── STEP 4: Verify — you should see 7+ rows ──────────────────────────────────
SELECT
  p.name,
  p.sku,
  p.status,
  p.price_paise / 100.0 AS price_inr,
  c.name AS category
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
ORDER BY p.sort_order, p.created_at;
