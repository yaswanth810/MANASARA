/**
 * MANASARA — After running migration 007, run this to confirm everything works.
 * Usage: node scripts/test-auth-upload.mjs <your_admin_password>
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcnrarmkuyzyycpuvtec.supabase.co'
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL  = process.env.SUPABASE_ADMIN_EMAIL || 'manikrishna424h@gmail.com'

if (!SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY env vars.')
  console.error('   Copy .env.scripts.example → .env.scripts, fill in the keys, then run:')
  console.error('   node -r dotenv/config --env-file=.env.scripts scripts/test-auth-upload.mjs <password>')
  process.exit(1)
}
const PASSWORD     = process.argv[2]
const PRODUCT_ID   = '22222222-0000-0000-0000-000000000003'
const BUCKET       = 'product-images'

if (!PASSWORD) {
  console.log('\nUsage: node scripts/test-auth-upload.mjs <your_password>')
  console.log('Example: node scripts/test-auth-upload.mjs MyPass123\n')
  process.exit(1)
}

const client  = createClient(SUPABASE_URL, ANON_KEY)
const service = createClient(SUPABASE_URL, SERVICE_KEY)
const blob    = new Blob(['manasara-test'], { type: 'text/plain' })

async function run() {
  let allPassed = true
  console.log('\n════════════════════════════════════')
  console.log('  MANASARA Auth Upload Test')
  console.log('════════════════════════════════════\n')

  // 1. Sign in
  process.stdout.write('1. Signing in... ')
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: PASSWORD
  })
  if (authErr) {
    console.log('❌ FAILED:', authErr.message)
    console.log('   Wrong password? Try again.')
    process.exit(1)
  }
  console.log('✅', auth.user.email)

  // 2. Storage upload
  process.stdout.write('2. Storage upload (authenticated)... ')
  const path = `${PRODUCT_ID}/test_${Date.now()}.txt`
  const { data: up, error: upErr } = await client.storage
    .from(BUCKET).upload(path, blob, { upsert: true })
  if (upErr) {
    console.log('❌ FAILED:', upErr.message)
    console.log('\n   → The storage policy migration did not apply.')
    console.log('   → Run this in Supabase SQL Editor:')
    console.log('     supabase db push  (from E:\\MANASARA)')
    allPassed = false
  } else {
    console.log('✅', up.path)
    await service.storage.from(BUCKET).remove([path])
  }

  // 3. DB insert
  process.stdout.write('3. product_images insert (authenticated)... ')
  const { data: row, error: rowErr } = await client
    .from('product_images')
    .insert({ product_id: PRODUCT_ID, storage_path: 'test/x.txt', display_order: 999, is_primary: false })
    .select().single()
  if (rowErr) {
    console.log('❌ FAILED:', rowErr.message)
    allPassed = false
  } else {
    console.log('✅ row id:', row.id)
    await service.from('product_images').delete().eq('id', row.id)
  }

  await client.auth.signOut()

  console.log('\n════════════════════════════════════')
  if (allPassed) {
    console.log('  🎉 ALL PASSED — upload pipeline works!')
    console.log('  Now try uploading an image in the admin panel.')
    console.log('  (Exit Chrome mobile simulation mode if file picker')
    console.log('   does not open — click 📱 icon in DevTools toolbar)')
  } else {
    console.log('  ❌ Some tests failed — see errors above.')
    console.log('  Run: supabase db push  (from E:\\MANASARA)')
  }
  console.log('════════════════════════════════════\n')
}

run().catch(console.error)
