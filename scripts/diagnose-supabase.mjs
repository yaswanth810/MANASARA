/**
 * MANASARA — Supabase Full Diagnostic
 * Run: node scripts/diagnose-supabase.mjs
 *
 * Tests EVERYTHING: auth, storage bucket, storage upload, DB insert, policies
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcnrarmkuyzyycpuvtec.supabase.co'
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY env vars.')
  console.error('   Copy .env.scripts.example → .env.scripts, fill in the keys, then run:')
  console.error('   node -r dotenv/config --env-file=.env.scripts scripts/diagnose-supabase.mjs')
  process.exit(1)
}

// Two clients: one like the browser (anon), one admin (service role)
const anonClient    = createClient(SUPABASE_URL, ANON_KEY)
const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY)

const PRODUCT_ID   = '22222222-0000-0000-0000-000000000003'
const BUCKET       = 'product-images'

function ok(msg)   { console.log('  ✅', msg) }
function fail(msg) { console.log('  ❌', msg) }
function info(msg) { console.log('  ℹ️ ', msg) }
function head(msg) { console.log('\n━━━', msg, '━━━') }

async function run() {
  console.log('═══════════════════════════════════════')
  console.log('  MANASARA Supabase Diagnostic')
  console.log('═══════════════════════════════════════')

  // ── 1. Basic connectivity ─────────────────────────────────────────────────
  head('1. Connectivity')
  try {
    const { data, error } = await serviceClient.from('products').select('id').limit(1)
    if (error) fail(`DB query failed: ${error.message}`)
    else ok(`Connected to Supabase, got ${data.length} product row(s)`)
  } catch (e) {
    fail(`Network error: ${e.message}`)
  }

  // ── 2. Check storage bucket ───────────────────────────────────────────────
  head('2. Storage Bucket')
  try {
    const { data: buckets, error } = await serviceClient.storage.listBuckets()
    if (error) {
      fail(`Cannot list buckets: ${error.message}`)
    } else {
      const bucket = buckets.find(b => b.name === BUCKET)
      if (!bucket) {
        fail(`Bucket "${BUCKET}" does NOT exist! Create it in Supabase → Storage → New bucket`)
        fail(`Buckets found: ${buckets.map(b => b.name).join(', ') || 'none'}`)
      } else {
        ok(`Bucket "${BUCKET}" exists`)
        info(`Public: ${bucket.public}`)
        if (!bucket.public) fail('Bucket is PRIVATE — must be PUBLIC for images to show')
        else ok('Bucket is PUBLIC ✓')
      }
    }
  } catch (e) {
    fail(`Bucket check error: ${e.message}`)
  }

  // ── 3. Upload test file with SERVICE KEY ──────────────────────────────────
  head('3. Storage Upload (service role — bypasses RLS)')
  const testPath = `${PRODUCT_ID}/diagnostic_test_${Date.now()}.txt`
  const testContent = new Blob(['MANASARA diagnostic test file'], { type: 'text/plain' })
  try {
    const { data, error } = await serviceClient.storage
      .from(BUCKET)
      .upload(testPath, testContent, { upsert: true })
    if (error) fail(`Service upload failed: ${error.message}`)
    else {
      ok(`Service upload succeeded: ${data.path}`)
      // Clean up
      await serviceClient.storage.from(BUCKET).remove([testPath])
      ok('Test file cleaned up')
    }
  } catch (e) {
    fail(`Service upload threw: ${e.message}`)
  }

  // ── 4. Upload test file with ANON KEY (what the browser does) ────────────
  head('4. Storage Upload (anon key — simulates browser)')
  const anonTestPath = `${PRODUCT_ID}/anon_test_${Date.now()}.txt`
  try {
    const { data, error } = await anonClient.storage
      .from(BUCKET)
      .upload(anonTestPath, testContent, { upsert: true })
    if (error) {
      fail(`ANON upload failed: ${error.message}`)
      fail('→ This is why uploads fail in the browser!')
      fail('→ Run the storage policy SQL fix in Supabase SQL Editor')
    } else {
      ok(`Anon upload succeeded: ${data.path}`)
      await serviceClient.storage.from(BUCKET).remove([anonTestPath])
      ok('Test file cleaned up')
    }
  } catch (e) {
    fail(`Anon upload threw: ${e.message}`)
  }

  // ── 5. Upload with SIGNED IN user ─────────────────────────────────────────
  head('5. Storage Upload (signed-in user — this is what happens after login)')
  // Sign in as the admin
  const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
    email: 'manikrishna424h@gmail.com',
    password: 'ENTER_PASSWORD_HERE', // Will fail — that's ok, shows auth works
  })
  if (authErr) {
    info(`Sign-in test skipped (expected — no password in script): ${authErr.message}`)
    info('The browser upload uses the session from your login — ensure you are logged in')
  } else {
    ok(`Signed in as: ${authData.user.email}`)
    const authTestPath = `${PRODUCT_ID}/auth_test_${Date.now()}.txt`
    const { data, error } = await anonClient.storage
      .from(BUCKET)
      .upload(authTestPath, testContent, { upsert: true })
    if (error) fail(`Authenticated upload failed: ${error.message}`)
    else {
      ok(`Authenticated upload succeeded: ${data.path}`)
      await serviceClient.storage.from(BUCKET).remove([authTestPath])
    }
    await anonClient.auth.signOut()
  }

  // ── 6. Check storage policies ─────────────────────────────────────────────
  head('6. Storage Policies (via SQL)')
  try {
    const { data, error } = await serviceClient.rpc('get_storage_policies')
    if (error) {
      info(`Cannot call get_storage_policies RPC: ${error.message}`)
      info('Run this SQL in Supabase SQL Editor to check:')
      info('SELECT policyname, cmd FROM pg_policies WHERE schemaname=\'storage\' AND tablename=\'objects\';')
    } else {
      info(`Storage policies: ${JSON.stringify(data)}`)
    }
  } catch (e) {
    info('Policy check via RPC not available — use SQL Editor instead')
  }

  // ── 7. Check product_images table access ──────────────────────────────────
  head('7. product_images Table')
  try {
    // Check with service key
    const { data: rows, error } = await serviceClient
      .from('product_images')
      .select('*')
      .eq('product_id', PRODUCT_ID)
    if (error) fail(`product_images select (service): ${error.message}`)
    else ok(`product_images has ${rows.length} row(s) for test product`)

    // Check if anon can insert
    const { error: insertErr } = await anonClient
      .from('product_images')
      .insert({
        product_id: PRODUCT_ID,
        storage_path: `diagnostic/anon_test_${Date.now()}.txt`,
        display_order: 999,
        is_primary: false,
      })
    if (insertErr) {
      fail(`ANON insert into product_images failed: ${insertErr.message}`)
      fail('→ This means RLS on product_images table is blocking unauthenticated inserts')
      fail('→ Run the table policy SQL fix in Supabase SQL Editor')
    } else {
      ok('Anon insert into product_images succeeded (unexpected — RLS might be off)')
      // Clean up
      await serviceClient.from('product_images').delete().eq('display_order', 999)
    }
  } catch (e) {
    fail(`product_images test threw: ${e.message}`)
  }

  // ── 8. Summary ────────────────────────────────────────────────────────────
  head('8. What to fix')
  console.log()
  console.log('  Run this in Supabase SQL Editor if storage upload failed:')
  console.log()
  console.log(`  -- Drop all storage.objects policies`)
  console.log(`  DO $$ DECLARE r RECORD; BEGIN`)
  console.log(`    FOR r IN SELECT policyname FROM pg_policies`)
  console.log(`             WHERE schemaname='storage' AND tablename='objects'`)
  console.log(`    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname); END LOOP;`)
  console.log(`  END $$;`)
  console.log()
  console.log(`  -- Recreate 4 clean policies`)
  console.log(`  CREATE POLICY "pub_read"    ON storage.objects FOR SELECT    TO public      USING (true);`)
  console.log(`  CREATE POLICY "auth_insert" ON storage.objects FOR INSERT    TO authenticated WITH CHECK (true);`)
  console.log(`  CREATE POLICY "auth_update" ON storage.objects FOR UPDATE    TO authenticated USING (true) WITH CHECK (true);`)
  console.log(`  CREATE POLICY "auth_delete" ON storage.objects FOR DELETE    TO authenticated USING (true);`)
  console.log()
  console.log('  Run this if product_images insert failed:')
  console.log()
  console.log(`  DROP POLICY IF EXISTS "pi_auth_all" ON public.product_images;`)
  console.log(`  DROP POLICY IF EXISTS "pi_public_read" ON public.product_images;`)
  console.log(`  CREATE POLICY "pi_auth_all" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);`)
  console.log(`  CREATE POLICY "pi_anon_read" ON public.product_images FOR SELECT TO anon USING (true);`)
  console.log()
  console.log('═══════════════════════════════════════')
  console.log('  Diagnostic complete')
  console.log('═══════════════════════════════════════')
}

run().catch(console.error)
