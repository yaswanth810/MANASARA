// MANASARA Edge Function: submit-payment-reference
// Public (no auth required). Called by OrderConfirmationPage when a customer
// submits their UPI UTR reference after completing payment.
// Sets payment status to SUBMITTED — not confirmed until admin verifies.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb          = createClient(supabaseUrl, serviceKey)

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    order_code: string
    phone: string
    utr_reference: string
    submitted_amount_paise?: number
    payment_note?: string
  }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  // ── Validate & normalise inputs ───────────────────────────────────────────

  // order_code: required, trim, uppercase
  const orderCode = (body.order_code ?? '').toString().trim().toUpperCase()
  if (!orderCode) return error('order_code is required')

  // phone: required, normalise to 10 digits (strip +91, country code, spaces)
  const rawPhone = (body.phone ?? '').toString().replace(/\s+/g, '').replace(/^(\+91|91)/, '')
  if (!rawPhone || !/^\d{10}$/.test(rawPhone)) {
    return error('A valid 10-digit phone number is required')
  }

  // utr_reference: required, 6–64 chars, alphanumeric + hyphens + spaces allowed
  const utrRaw = (body.utr_reference ?? '').toString().trim()
  if (!utrRaw) return error('utr_reference is required')
  if (utrRaw.length < 6)  return error('utr_reference must be at least 6 characters')
  if (utrRaw.length > 64) return error('utr_reference must be at most 64 characters')
  if (!/^[A-Za-z0-9\-\s]+$/.test(utrRaw)) {
    return error('utr_reference must contain only alphanumeric characters and hyphens')
  }
  const utrReference = utrRaw.replace(/\s+/g, '').toUpperCase()

  // submitted_amount_paise: optional, must be positive number
  if (
    body.submitted_amount_paise !== undefined &&
    (typeof body.submitted_amount_paise !== 'number' || body.submitted_amount_paise <= 0)
  ) return error('submitted_amount_paise must be a positive number')

  // payment_note: optional, max 500 chars
  const paymentNote = body.payment_note !== undefined
    ? (body.payment_note ?? '').toString()
    : undefined
  if (paymentNote !== undefined && paymentNote.length > 500) {
    return error('payment_note must be at most 500 characters')
  }

  // ── Look up order + customer phone (single join) ──────────────────────────
  const { data: order } = await sb
    .from('orders')
    .select('id, status, customer_id, customers(phone)')
    .eq('order_code', orderCode)
    .maybeSingle()

  if (!order) return error('Order not found', 404)

  // Verify phone matches the customer's phone on record
  const customerPhone: string = (order.customers as { phone: string } | null)?.phone ?? ''
  const normCustomerPhone = customerPhone.replace(/\s+/g, '').replace(/^(\+91|91)/, '')
  if (normCustomerPhone !== rawPhone) {
    return error('Phone number does not match the order', 403)
  }

  // Verify order is in a state that accepts payment submission
  if (order.status !== 'AWAITING_PAYMENT') {
    return error(`Order cannot accept payment in its current status: ${order.status}`, 409)
  }

  // ── Look up payment record (PENDING or REJECTED = allow; SUBMITTED/PAID = block) ──
  const { data: payment } = await sb
    .from('payments')
    .select('id, status')
    .eq('order_id', order.id)
    .in('status', ['PENDING', 'REJECTED', 'SUBMITTED', 'PAID'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) return error('No payment record found for this order', 404)

  if (payment.status === 'SUBMITTED') {
    return error('Payment reference already submitted. Please wait for admin verification.', 409)
  }
  if (payment.status === 'PAID') {
    return error('Payment has already been verified and completed.', 409)
  }
  // payment.status is PENDING or REJECTED — allow submission / resubmission

  // ── Prevent duplicate UTR across all orders ───────────────────────────────
  const { data: duplicateUtr } = await sb
    .from('payments')
    .select('id')
    .eq('utr_reference', utrReference)
    .neq('id', payment.id)   // allow same record to reuse the same UTR (idempotent resubmit)
    .limit(1)
    .maybeSingle()

  if (duplicateUtr) {
    return error('This UTR reference has already been used for another order.', 409)
  }

  // ── Build update payload ──────────────────────────────────────────────────
  // Note: updated_at is handled automatically by a DB trigger; do not set it here.
  const now = new Date().toISOString()

  const updatePayload: Record<string, unknown> = {
    status:        'SUBMITTED',
    utr_reference: utrReference,
    submitted_at:  now,
  }

  if (body.submitted_amount_paise !== undefined) {
    updatePayload.submitted_amount_paise = body.submitted_amount_paise
  }

  if (paymentNote !== undefined) {
    updatePayload.customer_payment_note = paymentNote
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const { error: updateErr } = await sb
    .from('payments')
    .update(updatePayload)
    .eq('id', payment.id)

  if (updateErr) {
    console.error('submit-payment-reference: failed to update payment:', updateErr)
    return error('Failed to submit payment reference. Please try again.', 500)
  }

  return json({ success: true, message: 'Payment reference submitted successfully' })
})
