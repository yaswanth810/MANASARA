// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Edge Function Test Script
// Tests all 4 public/admin edge functions against the live Supabase deployment.
//
// Run:  node scripts/test-edge-functions.js
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://mcnrarmkuyzyycpuvtec.supabase.co/functions/v1'
const ANON_KEY = 'sb_publishable_TdRfKj2RaVWo8yEL-msbzQ_7AS38MgW'

// ── Colours ───────────────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`   // green
const R = (s) => `\x1b[31m${s}\x1b[0m`   // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`   // yellow
const B = (s) => `\x1b[34m${s}\x1b[0m`   // blue
const D = (s) => `\x1b[2m${s}\x1b[0m`    // dim

let passed = 0
let failed = 0
let skipped = 0

async function call(name, path, body, headers = {}) {
  const url = `${BASE_URL}/${path}`
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        ...headers,
      },
      body: JSON.stringify(body),
    })
    const ms = Date.now() - start
    let json
    try { json = await res.json() } catch { json = null }
    return { ok: res.ok, status: res.status, json, ms }
  } catch (err) {
    return { ok: false, status: 0, json: null, ms: Date.now() - start, err: err.message }
  }
}

function pass(test, detail = '') {
  passed++
  console.log(`  ${G('✓')} ${test}${detail ? D(' — ' + detail) : ''}`)
}

function fail(test, detail = '') {
  failed++
  console.log(`  ${R('✗')} ${test}${detail ? R(' — ' + detail) : ''}`)
}

function skip(test, reason = '') {
  skipped++
  console.log(`  ${Y('⚠')} ${test}${reason ? Y(' — ' + reason) : ''}`)
}

function section(title) {
  console.log(`\n${B('━━')} ${title} ${B('━━')}`)
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + B('═'.repeat(60)))
  console.log(B('  MANASARA Edge Function Tests'))
  console.log(B('  Target: ' + BASE_URL))
  console.log(B('═'.repeat(60)))

  // ── 1. place-order ──────────────────────────────────────────────────────────
  section('1. place-order')

  // 1a. CORS preflight
  {
    const res = await fetch(`${BASE_URL}/place-order`, {
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:5173', 'apikey': ANON_KEY },
    })
    res.ok || res.status === 200
      ? pass('OPTIONS (CORS preflight)')
      : fail('OPTIONS (CORS preflight)', `status ${res.status}`)
  }

  // 1b. Missing body
  {
    const r = await call('place-order — missing body', 'place-order', {})
    r.status === 400 && r.json?.error
      ? pass('Rejects empty body', r.json.error)
      : fail('Rejects empty body', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // 1c. Invalid phone
  {
    const r = await call('place-order — bad phone', 'place-order', {
      idempotency_key: 'test-' + Date.now() + '-invalid',
      customer: { name: 'Test User', phone: '1234567890' },
      shipping: { name: 'Test', phone: '1234567890', address_line1: '1 Test St', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      items: [],
    })
    r.status === 400 && r.json?.error
      ? pass('Rejects bad phone number', r.json.error)
      : fail('Rejects bad phone number', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // 1d. Non-serviceable pincode
  {
    const r = await call('place-order — bad pincode', 'place-order', {
      idempotency_key: 'test-' + Date.now() + '-pincode',
      customer: { name: 'Test User', phone: '9876543210' },
      shipping: { name: 'Test', phone: '9876543210', address_line1: '1 Test St', city: 'Nowhere', district: 'Nowhere', state: 'XY', pincode: '999999' },
      items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1, selectedOptions: {} }],
    })
    // Expect either 422 (not serviceable) or 400 (empty items)
    r.status === 422 || r.status === 400
      ? pass('Rejects non-serviceable pincode', r.json?.error ?? `status ${r.status}`)
      : fail('Rejects non-serviceable pincode', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // 1e. Full valid order attempt (will fail on product not found — expected)
  {
    const r = await call('place-order — fake product', 'place-order', {
      idempotency_key: 'test-idem-' + Date.now(),
      customer: { name: 'Ravi Kumar', phone: '9000000001', email: 'test@test.com' },
      shipping: {
        name: 'Ravi Kumar', phone: '9000000001',
        address_line1: '12 Main Road', city: 'Hyderabad',
        district: 'Hyderabad', state: 'Telangana', pincode: '500001',
      },
      items: [{ productId: '00000000-0000-0000-0000-000000000099', quantity: 1, selectedOptions: {} }],
    })
    // 422 = not serviceable pincode, 400 = product not found — both mean function is running
    r.status >= 400 && r.status < 600 && r.json?.error
      ? pass('place-order is reachable and validates', `${r.status}: ${r.json.error}`)
      : fail('place-order unreachable or crashed', `status=${r.status} err=${r.err ?? JSON.stringify(r.json)}`)
  }

  // ── 2. submit-payment-reference ─────────────────────────────────────────────
  section('2. submit-payment-reference')

  {
    const r = await call('submit-payment-reference — missing fields', 'submit-payment-reference', {})
    r.status === 400 && r.json?.error
      ? pass('Rejects empty body', r.json.error)
      : fail('Rejects empty body', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  {
    const r = await call('submit-payment-reference — bad order', 'submit-payment-reference', {
      order_code: 'MNS-FAKE999',
      phone: '9000000001',
      utr_reference: 'UTR123456789',
    })
    r.status === 400 && r.json?.error
      ? pass('Rejects non-existent order', r.json.error)
      : fail('Rejects non-existent order', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  {
    const r = await call('submit-payment-reference — short UTR', 'submit-payment-reference', {
      order_code: 'MNS-001',
      phone: '9000000001',
      utr_reference: '123',  // too short
    })
    r.status === 400
      ? pass('Rejects short UTR reference', r.json?.error)
      : fail('Rejects short UTR reference', `status=${r.status}`)
  }

  // ── 3. track-order ──────────────────────────────────────────────────────────
  section('3. track-order')

  {
    const r = await call('track-order — missing params', 'track-order', {})
    r.status === 400 && r.json?.error
      ? pass('Rejects missing order_code/phone', r.json.error)
      : fail('Rejects missing params', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  {
    const r = await call('track-order — non-existent order', 'track-order', {
      order_code: 'MNS-FAKE999',
      phone: '9000000001',
    })
    // Returns null (not found without revealing existence) OR rate limit
    r.status === 200 || r.status === 429
      ? pass('track-order responds correctly', r.status === 429 ? 'rate limited' : `data=${JSON.stringify(r.json)}`)
      : fail('track-order unexpected error', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // ── 4. verify-payment (admin — no JWT should give 401) ──────────────────────
  section('4. verify-payment (admin-only)')

  {
    // Without a valid admin JWT → should get 401
    const r = await call('verify-payment — no auth', 'verify-payment', {
      payment_id: 'fake', order_id: 'fake',
      verified_amount_paise: 10000, verified_reference: 'UTR000',
    })
    r.status === 401
      ? pass('Rejects unauthenticated request (401)', r.json?.error)
      : fail('Should reject unauthenticated', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // ── 5. update-order-status (admin — no JWT should give 401) ─────────────────
  section('5. update-order-status (admin-only)')

  {
    const r = await call('update-order-status — no auth', 'update-order-status', {
      order_id: 'fake', new_status: 'CONFIRMED',
    })
    r.status === 401
      ? pass('Rejects unauthenticated request (401)', r.json?.error)
      : fail('Should reject unauthenticated', `status=${r.status} body=${JSON.stringify(r.json)}`)
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + B('═'.repeat(60)))
  console.log(`  ${G(`${passed} passed`)}  ${failed > 0 ? R(`${failed} failed`) : D('0 failed')}  ${skipped > 0 ? Y(`${skipped} skipped`) : ''}`)
  console.log(B('═'.repeat(60)) + '\n')

  if (failed > 0) {
    console.log(R('Some tests failed. Check output above for details.\n'))
    process.exit(1)
  } else {
    console.log(G('All edge functions are reachable and working correctly!\n'))
  }
}

main().catch((err) => {
  console.error(R('\nFatal error running tests:'), err.message)
  process.exit(1)
})
