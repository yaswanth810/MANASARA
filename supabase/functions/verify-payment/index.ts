// MANASARA Edge Function: verify-payment
// Admin-only. Marks a payment as PAID after real bank/UPI verification,
// or REJECTED when the submitted UTR is invalid/not found.
// NEVER auto-verify. Requires admin JWT + active admin_profile.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return error('Authentication required', 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb          = createClient(supabaseUrl, serviceKey)

  // Verify the calling user's JWT and check admin profile
  const userToken = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await createClient(
    supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!
  ).auth.getUser(userToken)

  if (authErr || !user) return error('Invalid or expired session', 401)

  const { data: adminProfile } = await sb
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('user_id', user.id)
    .single()

  if (!adminProfile?.is_active) return error('Admin access required', 403)

  let body: {
    payment_id: string
    order_id: string
    action?: 'verify' | 'reject'
    // verify fields
    verified_amount_paise?: number
    verified_reference?: string
    // reject fields
    rejection_reason?: string
  }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  const { payment_id, order_id } = body
  if (!payment_id || !order_id) return error('payment_id and order_id required')

  // Default action is 'verify' for backward compatibility
  const action = body.action ?? 'verify'
  if (action !== 'verify' && action !== 'reject') return error("action must be 'verify' or 'reject'")

  // Look up the payment
  const { data: payment } = await sb
    .from('payments').select('*').eq('id', payment_id).eq('order_id', order_id).single()
  if (!payment) return error('Payment not found')

  // Verify the order exists
  const { data: order } = await sb
    .from('orders').select('id, status, payment_status').eq('id', order_id).single()
  if (!order) return error('Order not found')

  const now = new Date().toISOString()

  // ── REJECT action ─────────────────────────────────────────────────────────
  if (action === 'reject') {
    const rejectionReason = (body.rejection_reason ?? '').toString().trim()
    if (!rejectionReason || rejectionReason.length < 5) {
      return error('rejection_reason is required and must be at least 5 characters')
    }

    if (payment.status === 'PAID') return error('Cannot reject a payment that is already verified')
    if (payment.status === 'REJECTED') return error('Payment is already rejected')

    // Mark payment as REJECTED
    const { error: rejectErr } = await sb.from('payments').update({
      status:           'REJECTED',
      rejection_reason: rejectionReason,
      rejected_by:      adminProfile.id,
      rejected_at:      now,
      updated_at:       now,
    }).eq('id', payment_id)

    if (rejectErr) return error('Failed to reject payment', 500)

    // Keep order status as AWAITING_PAYMENT — customer can resubmit a corrected UTR
    // (Do NOT cancel the order)
    await sb.from('orders').update({
      updated_at: now,
    }).eq('id', order_id)

    // Log rejection to order_status_history
    await sb.from('order_status_history').insert({
      order_id,
      old_status:  order.status,
      new_status:  order.status,  // status unchanged
      changed_by:  adminProfile.id,
      note:        `Payment reference rejected: ${rejectionReason}`,
    })

    return json({ success: true, action: 'rejected' })
  }

  // ── VERIFY action (default, backward-compatible) ──────────────────────────
  const { verified_amount_paise, verified_reference } = body

  if (!verified_amount_paise || verified_amount_paise <= 0) return error('verified_amount_paise must be positive')
  if (!verified_reference?.trim()) return error('verified_reference required')

  if (payment.status === 'PAID') return error('Payment already verified')

  // Mark payment as PAID
  const { error: paymentErr } = await sb.from('payments').update({
    status:                'PAID',
    verified_amount_paise,
    verified_reference:    verified_reference.trim(),
    verified_by:           adminProfile.id,
    verified_at:           now,
    amount_received_paise: verified_amount_paise,
    updated_at:            now,
  }).eq('id', payment_id)

  if (paymentErr) return error('Failed to verify payment', 500)

  // Update order: payment_status → PAID
  // If order was AWAITING_PAYMENT → automatically transition to CONFIRMED
  const newOrderStatus = order.status === 'AWAITING_PAYMENT' ? 'CONFIRMED' : order.status

  await sb.from('orders').update({
    payment_status: 'PAID',
    status:         newOrderStatus,
    updated_at:     now,
  }).eq('id', order_id)

  // Log status change if order status transitioned
  if (newOrderStatus !== order.status) {
    await sb.from('order_status_history').insert({
      order_id,
      old_status:  order.status,
      new_status:  newOrderStatus,
      changed_by:  adminProfile.id,
      note:        `Payment verified — ₹${(verified_amount_paise / 100).toFixed(2)} confirmed`,
    })
  }

  return json({ success: true, action: 'verified', newOrderStatus, newPaymentStatus: 'PAID' })
})
