// MANASARA Edge Function: update-order-status
// Admin-only. Validates allowed transitions and logs to order_status_history.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

type OrderStatus = 'AWAITING_PAYMENT'|'CONFIRMED'|'IN_PRODUCTION'|'READY'|'OUT_FOR_DELIVERY'|'DELIVERED'|'CANCELLED'

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION:    ['READY', 'CANCELLED'],
  READY:            ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return error('Authentication required', 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb          = createClient(supabaseUrl, serviceKey)

  // Verify admin JWT
  const userToken = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(userToken)
  if (!user) return error('Invalid session', 401)

  const { data: adminProfile } = await sb
    .from('admin_profiles').select('id, is_active').eq('user_id', user.id).single()
  if (!adminProfile?.is_active) return error('Admin access required', 403)

  let body: { order_id: string; new_status: OrderStatus; note?: string }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  if (!body.order_id || !body.new_status) return error('order_id and new_status required')

  // Look up current status
  const { data: order } = await sb.from('orders').select('id, status').eq('id', body.order_id).single()
  if (!order) return error('Order not found')

  const currentStatus = order.status as OrderStatus
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

  if (!allowed.includes(body.new_status)) {
    return error(`Cannot transition from ${currentStatus} to ${body.new_status}. Allowed: ${allowed.join(', ') || 'none'}`)
  }

  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    status: body.new_status,
    updated_at: now,
  }
  if (body.new_status === 'CANCELLED') {
    updateData.cancelled_at = now
    updateData.cancellation_reason = body.note ?? null
  }

  const { error: updateErr } = await sb.from('orders').update(updateData).eq('id', body.order_id)
  if (updateErr) return error('Failed to update order status', 500)

  // Log to history
  await sb.from('order_status_history').insert({
    order_id: body.order_id,
    old_status: currentStatus,
    new_status: body.new_status,
    changed_by: adminProfile.id,
    note: body.note ?? null,
  })

  return json({ success: true, oldStatus: currentStatus, newStatus: body.new_status })
})
