// MANASARA Edge Function: verify-payment
// Admin-only. Marks a payment as PAID after real bank/UPI verification.
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

  let body: { payment_id: string; order_id: string; verified_amount_paise: number; verified_reference: string }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  const { payment_id, order_id, verified_amount_paise, verified_reference } = body

  if (!payment_id || !order_id) return error('payment_id and order_id required')
  if (!verified_amount_paise || verified_amount_paise <= 0) return error('verified_amount_paise must be positive')
  if (!verified_reference?.trim()) return error('verified_reference required')

  // Look up the payment
  const { data: payment } = await sb.from('payments').select('*').eq('id', payment_id).eq('order_id', order_id).single()
  if (!payment) return error('Payment not found')
  if (payment.status === 'PAID') return error('Payment already verified')

  // Verify the order exists
  const { data: order } = await sb.from('orders').select('id, status, payment_status').eq('id', order_id).single()
  if (!order) return error('Order not found')

  const now = new Date().toISOString()

  // Mark payment as PAID
  const { error: paymentErr } = await sb.from('payments').update({
    status: 'PAID',
    verified_amount_paise,
    verified_reference: verified_reference.trim(),
    verified_by: adminProfile.id,
    verified_at: now,
    amount_received_paise: verified_amount_paise,
    updated_at: now,
  }).eq('id', payment_id)

  if (paymentErr) return error('Failed to verify payment', 500)

  // Update order: payment_status → PAID
  // If order was AWAITING_PAYMENT → automatically transition to CONFIRMED
  const newOrderStatus = order.status === 'AWAITING_PAYMENT' ? 'CONFIRMED' : order.status

  await sb.from('orders').update({
    payment_status: 'PAID',
    status: newOrderStatus,
    updated_at: now,
  }).eq('id', order_id)

  // Log status change if transitioned
  if (newOrderStatus !== order.status) {
    await sb.from('order_status_history').insert({
      order_id,
      old_status: order.status,
      new_status: newOrderStatus,
      changed_by: adminProfile.id,
      note: `Payment verified — ₹${(verified_amount_paise / 100).toFixed(2)} confirmed`,
    })
  }

  return json({ success: true, newOrderStatus, newPaymentStatus: 'PAID' })
})
