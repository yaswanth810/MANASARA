-- ═══════════════════════════════════════════════════════════════════════════
-- MANASARA — Seed Data
-- ⚠ DEMO / DRAFT DATA — All prices are illustrative.
-- Founders must confirm prices and change status to ACTIVE before launch.
-- Run: supabase db seed  (or psql < seed.sql)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Categories ────────────────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, description, display_order, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Keychains',   'keychains',  'Handmade pipe-cleaner and chenille-stem keychains', 1, TRUE),
  ('11111111-0000-0000-0000-000000000002', 'Flower Stems','flowers',    'Single handcrafted flower stems',                  2, TRUE),
  ('11111111-0000-0000-0000-000000000003', 'Bouquets',    'bouquets',   'Mini bouquets and arrangements',                   3, TRUE),
  ('11111111-0000-0000-0000-000000000004', 'Gift Sets',   'gift-sets',  'Curated gifting combinations',                     4, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Products (DRAFT — confirm prices before activating) ───────────────────────
INSERT INTO public.products (
  id, category_id, name, slug, sku,
  description, price_paise, compare_at_price_paise,
  status, is_made_to_order,
  production_lead_days_min, production_lead_days_max,
  sort_order, options
) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Cherry Keychain',
    'cherry-keychain',
    'KCH-001',
    'A handcrafted cherry charm keychain made from soft chenille stems. Each cherry is shaped by hand and comes with a sturdy keychain ring. A charming little keepsake that fits in any bag.',
    14900, NULL,
    'DRAFT', TRUE, 2, 4, 1,
    '[
      {"key":"colour","label":"Colour","type":"select","required":false,"choices":[
        {"value":"red","label":"Red","price_adjustment_paise":0,"available":true},
        {"value":"dark_red","label":"Dark Red","price_adjustment_paise":0,"available":true},
        {"value":"pink","label":"Pink","price_adjustment_paise":0,"available":true}
      ]},
      {"key":"note_card","label":"Add a note card","type":"boolean","required":false}
    ]'::JSONB
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'Flower Keychain',
    'flower-keychain',
    'KFL-001',
    'A delicate flower-shaped keychain crafted from chenille stems. Available in several petal colours. Perfect as a bag charm, gift topper, or everyday carry.',
    14900, NULL,
    'DRAFT', TRUE, 2, 4, 2,
    '[
      {"key":"colour","label":"Petal Colour","type":"select","required":true,"choices":[
        {"value":"blush","label":"Blush Pink","price_adjustment_paise":0,"available":true},
        {"value":"lavender","label":"Lavender","price_adjustment_paise":0,"available":true},
        {"value":"white","label":"White","price_adjustment_paise":0,"available":true},
        {"value":"yellow","label":"Butter Yellow","price_adjustment_paise":0,"available":true},
        {"value":"red","label":"Red","price_adjustment_paise":0,"available":true}
      ]},
      {"key":"note_card","label":"Add a note card","type":"boolean","required":false}
    ]'::JSONB
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    'Animal Keychain',
    'animal-keychain',
    'KAN-001',
    'An adorable animal charm keychain — bear, bunny, or cat — shaped from chenille stems with tiny detail work. A sweet, pocket-sized companion for anyone who loves cute things.',
    17900, NULL,
    'DRAFT', TRUE, 3, 5, 3,
    '[
      {"key":"animal","label":"Animal","type":"select","required":true,"choices":[
        {"value":"bear","label":"Bear","price_adjustment_paise":0,"available":true},
        {"value":"bunny","label":"Bunny","price_adjustment_paise":0,"available":true},
        {"value":"cat","label":"Cat","price_adjustment_paise":0,"available":true}
      ]},
      {"key":"colour","label":"Colour","type":"select","required":false,"choices":[
        {"value":"brown","label":"Brown","price_adjustment_paise":0,"available":true},
        {"value":"white","label":"White","price_adjustment_paise":0,"available":true},
        {"value":"pink","label":"Pink","price_adjustment_paise":0,"available":true}
      ]},
      {"key":"note_card","label":"Add a note card","type":"boolean","required":false}
    ]'::JSONB
  ),
  (
    '22222222-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    'Single Flower Stem',
    'single-flower-stem',
    'FLS-001',
    'A single handcrafted flower stem made from pipe cleaners — no watering required. A lasting, affordable alternative to real flowers. Makes a sweet standalone gift or pairs well as a gift topper.',
    12900, NULL,
    'DRAFT', TRUE, 2, 3, 4,
    '[
      {"key":"colour","label":"Petal Colour","type":"select","required":true,"choices":[
        {"value":"blush","label":"Blush Pink","price_adjustment_paise":0,"available":true},
        {"value":"lavender","label":"Lavender","price_adjustment_paise":0,"available":true},
        {"value":"white","label":"White","price_adjustment_paise":0,"available":true},
        {"value":"yellow","label":"Butter Yellow","price_adjustment_paise":0,"available":true},
        {"value":"red","label":"Red","price_adjustment_paise":0,"available":true}
      ]},
      {"key":"stem_length","label":"Stem Length","type":"select","required":false,"choices":[
        {"value":"short","label":"Short (~15 cm)","price_adjustment_paise":0,"available":true},
        {"value":"long","label":"Long (~25 cm)","price_adjustment_paise":2000,"available":true}
      ]}
    ]'::JSONB
  ),
  (
    '22222222-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000003',
    '3-Flower Mini Bouquet',
    'mini-bouquet-3',
    'BQ3-001',
    'A sweet mini bouquet of three handcrafted pipe-cleaner flowers, wrapped in kraft paper with a ribbon. The perfect small gift for birthdays, thank-yous, or just-because moments.',
    34900, NULL,
    'DRAFT', TRUE, 3, 5, 5,
    '[
      {"key":"colours","label":"Colour Preference","type":"text","required":false,"max_length":100,"placeholder":"e.g. all pink, or pink + white + lavender"},
      {"key":"note_card","label":"Add a note card","type":"boolean","required":false},
      {"key":"note_message","label":"Note card message","type":"text","required":false,"max_length":150,"placeholder":"What would you like it to say?"}
    ]'::JSONB
  ),
  (
    '22222222-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000003',
    '5-Flower Bouquet',
    'bouquet-5',
    'BQ5-001',
    'A five-flower handcrafted bouquet — fuller, more impactful, and still very giftable. Wrapped beautifully with kraft paper and ribbon. Great for birthdays, anniversaries, and special occasions.',
    54900, NULL,
    'DRAFT', TRUE, 4, 7, 6,
    '[
      {"key":"colours","label":"Colour Preference","type":"text","required":false,"max_length":100,"placeholder":"e.g. all blush, or mix of your choice"},
      {"key":"note_card","label":"Add a note card","type":"boolean","required":false},
      {"key":"note_message","label":"Note card message","type":"text","required":false,"max_length":150,"placeholder":"What would you like it to say?"}
    ]'::JSONB
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Store Settings ────────────────────────────────────────────────────────────
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name',                '"MANASARA"'),
  ('announcement_text',         '"Free delivery on orders above ₹499 · Handmade to order · UPI payments accepted"'),
  ('announcement_visible',      'true'),
  ('upi_id',                    '"update-this@upi"'),
  ('upi_qr_path',               'null'),
  ('contact_email',             '"hello@manasara.in"'),
  ('instagram_url',             '"https://instagram.com/manasara"'),
  ('default_shipping_rate_paise', '4900')
ON CONFLICT (key) DO NOTHING;

-- ── Serviceable PIN codes (AP + Telangana major areas) ────────────────────────
INSERT INTO public.serviceable_pincodes
  (pincode, area_name, city, state, shipping_rate_paise, estimated_days_min, estimated_days_max, is_active)
VALUES
  ('500001','Hyderabad Central',  'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500008','Secunderabad',       'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500032','Gachibowli',         'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500034','Madhapur',           'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500072','Kondapur',           'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500081','Kukatpally',         'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500016','Jubilee Hills',      'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500033','Banjara Hills',      'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('500018','Ameerpet',           'Hyderabad',      'Telangana',      4900, 1, 2, TRUE),
  ('506001','Warangal',           'Warangal',       'Telangana',      5900, 2, 3, TRUE),
  ('520001','Vijayawada Central', 'Vijayawada',     'Andhra Pradesh', 4900, 1, 2, TRUE),
  ('520010','Vijayawada East',    'Vijayawada',     'Andhra Pradesh', 4900, 1, 2, TRUE),
  ('530001','Visakhapatnam',      'Visakhapatnam',  'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('530003','Dwaraka Nagar',      'Visakhapatnam',  'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('522001','Guntur',             'Guntur',         'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('516001','Kurnool',            'Kurnool',        'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('515001','Anantapur',          'Anantapur',      'Andhra Pradesh', 6900, 3, 5, TRUE),
  ('517001','Tirupati',           'Tirupati',       'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('533001','Rajahmundry',        'Rajahmundry',    'Andhra Pradesh', 5900, 2, 3, TRUE),
  ('534001','Eluru',              'Eluru',          'Andhra Pradesh', 5900, 2, 3, TRUE)
ON CONFLICT (pincode) DO NOTHING;

-- ── Sample Materials ──────────────────────────────────────────────────────────
-- ⚠ Update costs to match what you actually pay for materials.
INSERT INTO public.materials (id, name, sku, unit, cost_per_unit_paise, low_stock_threshold, notes) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Pipe Cleaners - Assorted (pack of 100)', 'MAT-PC-001', 'pcs',   8,  200, 'Standard 30cm pipe cleaners'),
  ('33333333-0000-0000-0000-000000000002', 'Keychain Rings - 25mm Silver',           'MAT-KR-001', 'pcs', 200,   50, 'Metal split rings'),
  ('33333333-0000-0000-0000-000000000003', 'Floral Wire - 24 gauge',                 'MAT-FW-001', 'cm',    2,  500, 'For flower stems'),
  ('33333333-0000-0000-0000-000000000004', 'Craft Ribbon - 1cm Satin',               'MAT-RB-001', 'cm',    5,  300, 'For bouquet wrapping'),
  ('33333333-0000-0000-0000-000000000005', 'Kraft Paper Sheet A4',                   'MAT-KP-001', 'sheet', 300,  50, 'Bouquet wrapping paper'),
  ('33333333-0000-0000-0000-000000000006', 'Gift Box - Small (10x10x5cm)',            'MAT-GB-001', 'pcs', 2500,  20, 'For gift set packaging'),
  ('33333333-0000-0000-0000-000000000007', 'Note Cards',                              'MAT-NC-001', 'pcs', 500,   50, 'Small blank note cards with envelopes'),
  ('33333333-0000-0000-0000-000000000008', 'Hot Glue Sticks',                        'MAT-GL-001', 'pcs', 300,   30, 'For securing stems and charms')
ON CONFLICT (sku) DO NOTHING;

-- ── Sample Recipes (illustrative — update quantities to match your actual use) ──
INSERT INTO public.product_recipes (product_id, material_id, quantity_per_unit, notes) VALUES
  -- Cherry Keychain: ~8 pipe cleaners + 1 ring
  ('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001', 8,    'Body and stem'),
  ('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000002', 1,    'Keychain ring'),
  ('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000008', 0.25, 'Glue stick fraction'),
  -- Flower Keychain
  ('22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001', 10,   'Petals and stem'),
  ('22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000002', 1,    'Keychain ring'),
  ('22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000008', 0.25, 'Glue'),
  -- Single Stem
  ('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000001', 12,   'Petals and leaves'),
  ('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000003', 25,   '25cm wire stem'),
  ('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000008', 0.1,  'Glue'),
  -- 3-Flower Mini Bouquet
  ('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001', 36,   '3 flowers × 12 pipe cleaners'),
  ('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000003', 75,   '3 × 25cm stems'),
  ('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000004', 50,   'Ribbon wrap'),
  ('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000005', 1,    'Kraft paper wrap'),
  ('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000008', 0.5,  'Glue'),
  -- 5-Flower Bouquet
  ('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001', 60,   '5 flowers'),
  ('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000003', 125,  '5 × 25cm stems'),
  ('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000004', 80,   'Ribbon'),
  ('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000005', 2,    'Kraft paper'),
  ('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000008', 0.75, 'Glue')
ON CONFLICT (product_id, material_id) DO NOTHING;
