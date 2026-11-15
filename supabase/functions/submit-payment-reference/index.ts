// MANASARA Edge Function: submit-payment-reference
// Customer submits UTR after paying via UPI.
// This sets payment status to SUBMITTED — NOT confirmed.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { order_code: string; phone: string; utr_reference: string; payment_note?: string }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  const { order_code, phone, utr_reference, payment_note } = body

  // Validate inputs
  if (!order_code?.trim()) return error('Order code required')
  if (!phone?.trim()) return error('Phone number required')
  if (!utr_reference?.trim() || utr_reference.trim().length < 6) return error('Valid payment reference (UTR) required')

  const phoneClean = phone.replace(/[^0-9]/g, '').replace(/^91/, '')
  if (!/^[6-9][0-9]{9}$/.test(phoneClean)) return error('Invalid phone number')

  // Look up order
  const { data: order } = await sb
    .from('orders')
    .select('id, payment_status, customer_id')
    .eq('order_code', order_code.trim().toUpperCase())
    .single()

  if (!order) return error('Order not found')

  // Verify phone matches customer
  const { data: customer } = await sb
    .from('customers')
    .select('phone')
    .eq('id', order.customer_id)
    .single()

  if (!customer || customer.phone !== phoneClean) return error('Order not found')

  // Check payment status allows submission
  if (!['PENDING', 'SUBMITTED'].includes(order.payment_status)) {
    return error(`Payment cannot be submitted in status: ${order.payment_status}`)
  }

  // Rate limit: max 3 UTR submissions per order
  const { data: payment } = await sb
    .from('payments')
    .select('id, status, utr_reference')
    .eq('order_id', order.id)
    .single()

  if (!payment) return error('Payment record not found')
  if (payment.status === 'PAID') return error('Payment already verified')

  // Update payment
  const { error: updateErr } = await sb
    .from('payments')
    .update({
      utr_reference: utr_reference.trim(),
      customer_payment_note: payment_note?.trim() || null,
      submitted_at: new Date().toISOString(),
      status: 'SUBMITTED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  if (updateErr) return error('Failed to submit payment reference', 500)

  // Update order payment_status
  await sb.from('orders').update({ payment_status: 'SUBMITTED', updated_at: new Date().toISOString() }).eq('id', order.id)

  return json({ success: true, message: 'Payment reference submitted. We will verify within 2–4 hours.' })
})
