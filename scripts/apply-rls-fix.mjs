/**
 * MANASARA — Apply RLS Fix Directly
 * This script applies the storage + product_images RLS fix
 * using the Supabase service role key (bypasses all permissions).
 *
 * Run: node scripts/apply-rls-fix.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcnrarmkuyzyycpuvtec.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL  = process.env.SUPABASE_ADMIN_EMAIL || 'manikrishna424h@gmail.com'

if (!SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.')
  console.error('   Copy .env.scripts.example → .env.scripts, fill in the keys, then run:')
  console.error('   node -r dotenv/config --env-file=.env.scripts scripts/apply-rls-fix.mjs')
  process.exit(1)
}
const PASSWORD     = process.argv[2]  // optional — for final verification
const PRODUCT_ID   = '22222222-0000-0000-0000-000000000003'
const BUCKET       = 'product-images'

const service = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})
const anon = createClient(SUPABASE_URL, ANON_KEY)

function ok(msg)   { console.log('  ✅', msg) }
function fail(msg) { console.log('  ❌', msg) }
function step(msg) { console.log('\n━━', msg) }

async function sql(query) {
  // Use the REST API's /rest/v1/rpc endpoint with service key to run SQL
  // We'll use a workaround: create a temporary function, call it, drop it
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query }),
  })
  return response
}

async function applyFix() {
  console.log('\n═══════════════════════════════════════════')
  console.log('  MANASARA — Applying RLS Fix')
  console.log('═══════════════════════════════════════════')

  // ── Step 1: Create a helper SQL function via RPC ────────────────────────
  // Supabase service role can run SQL via the pg_net or Management API
  // We'll use the Supabase Management API (REST) to run SQL directly

  step('Applying fix via Supabase Management API...')

  const fixSQL = `
    -- Drop ALL storage.objects policies
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname); END LOOP;
    END $$;

    -- Recreate 4 clean storage policies
    CREATE POLICY "storage_pub_read"    ON storage.objects FOR SELECT    TO public      USING (true);
    CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT    TO authenticated WITH CHECK (true);
    CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE    TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE    TO authenticated USING (true);

    -- Drop ALL product_images policies
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='product_images'
      LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images', r.policyname); END LOOP;
    END $$;

    -- Ensure RLS enabled
    ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

    -- Recreate 2 clean product_images policies
    CREATE POLICY "pi_auth_all"  ON public.product_images FOR ALL    TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "pi_anon_read" ON public.product_images FOR SELECT TO anon           USING (true);
  `

  // Try Supabase Management API
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/mcnrarmkuyzyycpuvtec/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: fixSQL }),
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      ok('SQL applied via Management API!')
    } else {
      console.log('  ℹ️  Management API not available:', body?.message ?? res.status)
      console.log('  ℹ️  Trying alternative approach...')
      await applyViaInsertTrick()
    }
  } catch (e) {
    console.log('  ℹ️  Management API error:', e.message)
    await applyViaInsertTrick()
  }

  // ── Step 2: Verify by testing authenticated upload ──────────────────────
  if (PASSWORD) {
    await verifyWithAuth()
  } else {
    console.log('\n━━ Verification (optional)')
    console.log('  ℹ️  To verify the fix worked, run:')
    console.log('  node scripts/apply-rls-fix.mjs YOUR_ADMIN_PASSWORD')
  }
}

async function applyViaInsertTrick() {
  // Alternative: use supabase-js to call a stored procedure
  // This only works if exec_sql function exists — it usually doesn't by default
  // So fall back to giving the user the SQL to run manually
  console.log('\n  ⚠️  Cannot apply SQL automatically.')
  console.log('  You MUST run the SQL manually in Supabase SQL Editor.')
  console.log('\n  Open this URL:')
  console.log('  https://supabase.com/dashboard/project/mcnrarmkuyzyycpuvtec/sql\n')
  console.log('  Paste this SQL and click Run:\n')
  console.log('─────────────────────────────────────────────────────────')
  console.log(`DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname); END LOOP;
END $$;
CREATE POLICY "storage_pub_read"    ON storage.objects FOR SELECT    TO public      USING (true);
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE    TO authenticated USING (true);

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='product_images'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images', r.policyname); END LOOP;
END $$;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_auth_all"  ON public.product_images FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pi_anon_read" ON public.product_images FOR SELECT TO anon           USING (true);`)
  console.log('─────────────────────────────────────────────────────────')
}

async function verifyWithAuth() {
  step(`Verifying with admin login (${ADMIN_EMAIL})...`)
  const { data: auth, error: authErr } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: PASSWORD
  })
  if (authErr) {
    fail(`Sign-in failed: ${authErr.message}`)
    return
  }
  ok(`Signed in as ${auth.user.email}`)

  // Test storage
  process.stdout.write('  Testing storage upload... ')
  const path = `${PRODUCT_ID}/verify_${Date.now()}.txt`
  const blob = new Blob(['ok'], { type: 'text/plain' })
  const { data: up, error: upErr } = await anon.storage.from(BUCKET).upload(path, blob, { upsert: true })
  if (upErr) {
    fail(`Storage upload STILL failing: ${upErr.message}`)
    fail('→ The SQL fix was NOT applied. Go to Supabase SQL Editor and run it manually.')
  } else {
    ok('Storage upload works! ✓')
    await service.storage.from(BUCKET).remove([path])
  }

  // Test DB insert
  process.stdout.write('  Testing DB insert... ')
  const { data: row, error: rowErr } = await anon
    .from('product_images')
    .insert({ product_id: PRODUCT_ID, storage_path: 'verify/x.txt', display_order: 999, is_primary: false })
    .select().single()
  if (rowErr) {
    fail(`DB insert STILL failing: ${rowErr.message}`)
    fail('→ The SQL fix was NOT applied. Go to Supabase SQL Editor and run it manually.')
  } else {
    ok('DB insert works! ✓')
    await service.from('product_images').delete().eq('id', row.id)
  }

  if (!upErr && !rowErr) {
    console.log('\n═══════════════════════════════════════════')
    console.log('  🎉 ALL GOOD! Upload pipeline is working.')
    console.log('  Go to: localhost:3000/admin/products/.../edit')
    console.log('  Hard refresh: Ctrl+Shift+R')
    console.log('  Click upload zone → pick an image → done!')
    console.log('═══════════════════════════════════════════\n')
  }

  await anon.auth.signOut()
}

applyFix().catch(console.error)
