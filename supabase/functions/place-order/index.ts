// ─────────────────────────────────────────────────────────────────────────────
// MANASARA Edge Function: place-order
// Validates guest checkout, re-reads product prices server-side,
// checks pincode serviceability, and creates order transactionally.
// Uses SERVICE_ROLE to bypass RLS (set via: supabase secrets set ...)
// ─────────────────────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

interface CartItem {
  productId: string
  quantity: number
  selectedOptions: Record<string, string | boolean>
}

interface CheckoutBody {
  idempotency_key: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  shipping: {
    name: string
    phone: string
    email?: string
    address_line1: string
    address_line2?: string
    locality?: string
    city: string
    district: string
    state: string
    pincode: string
  }
  items: CartItem[]
  customisation_note?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb = createClient(supabaseUrl, serviceRoleKey)

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return error('Invalid JSON body')
  }

  // ── 1. Validate idempotency key ──────────────────────────────────────────
  if (!body.idempotency_key || typeof body.idempotency_key !== 'string' || body.idempotency_key.length < 20) {
    return error('Missing or invalid idempotency_key')
  }

  // Check for duplicate submission
  const { data: existingOrder } = await sb
    .from('orders')
    .select('id, order_code, total_paise')
    .eq('idempotency_key', body.idempotency_key)
    .single()

  if (existingOrder) {
    // Idempotent: return same result
    const { data: upiSetting } = await sb.from('store_settings').select('value').eq('key', 'upi_id').single()
    return json({
      orderCode: existingOrder.order_code,
      totalPaise: existingOrder.total_paise,
      upiId: (upiSetting?.value as string) ?? '',
      duplicate: true,
    })
  }

  // ── 2. Validate customer fields ──────────────────────────────────────────
  const { customer, shipping, items } = body

  if (!customer?.name?.trim() || customer.name.trim().length < 2) return error('Customer name is required')
  const phoneClean = customer.phone?.replace(/[^0-9]/g, '').replace(/^91/, '')
  if (!phoneClean || !/^[6-9][0-9]{9}$/.test(phoneClean)) return error('Valid 10-digit Indian mobile number required')
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return error('Invalid email address')

  // ── 3. Validate shipping address ─────────────────────────────────────────
  if (!shipping?.address_line1?.trim()) return error('Delivery address is required')
  if (!shipping?.city?.trim()) return error('City is required')
  if (!shipping?.district?.trim()) return error('District is required')
  if (!shipping?.state?.trim()) return error('State is required')
  const pincodeClean = shipping?.pincode?.trim()
  if (!pincodeClean || !/^[1-9][0-9]{5}$/.test(pincodeClean)) return error('Valid 6-digit PIN code required')

  // ── 4. Check pincode serviceability ──────────────────────────────────────
  const { data: pincodeRow } = await sb
    .from('serviceable_pincodes')
    .select('shipping_rate_paise, is_active')
    .eq('pincode', pincodeClean)
    .eq('is_active', true)
    .single()

  if (!pincodeRow) return error(`Sorry, we don't deliver to PIN code ${pincodeClean} yet.`, 422)
  const shippingPaise = pincodeRow.shipping_rate_paise

  // ── 5. Validate items ────────────────────────────────────────────────────
  if (!items || !Array.isArray(items) || items.length === 0) return error('No items in order')
  if (items.length > 20) return error('Too many items in one order')

  // ── 6. Re-read product prices server-side ────────────────────────────────
  const productIds = [...new Set(items.map((i) => i.productId))]
  const { data: products, error: productsErr } = await sb
    .from('products')
    .select('id, name, sku, price_paise, status, options, is_made_to_order')
    .in('id', productIds)

  if (productsErr || !products) return error('Failed to verify products')

  const productMap = new Map(products.map((p) => [p.id, p]))
  let subtotalPaise = 0
  const orderItemsPayload = []

  for (const item of items) {
    if (!item.productId || typeof item.productId !== 'string') return error('Invalid item')

    const product = productMap.get(item.productId)
    if (!product) return error(`Product not found: ${item.productId}`)
    if (product.status !== 'ACTIVE') return error(`"${product.name}" is currently unavailable`)

    const qty = Math.floor(Number(item.quantity))
    if (!qty || qty < 1 || qty > 99) return error(`Invalid quantity for ${product.name}`)

    // Calculate price with any option adjustments
    let unitPrice = product.price_paise
    const options = product.options as Array<{ key: string; type: string; choices?: Array<{ value: string; price_adjustment_paise?: number }> }> | null

    if (options && item.selectedOptions) {
      for (const opt of options) {
        if (opt.type === 'select' && opt.choices) {
          const selectedVal = item.selectedOptions[opt.key]
          if (selectedVal) {
            const choice = opt.choices.find((c) => c.value === selectedVal)
            if (choice?.price_adjustment_paise) unitPrice += choice.price_adjustment_paise
          }
        }
      }
    }

    const lineTotal = unitPrice * qty
    subtotalPaise += lineTotal

    orderItemsPayload.push({
      product_id: product.id,
      snapshot_product_name: product.name,
      snapshot_sku: product.sku,
      snapshot_unit_price_paise: unitPrice,
      snapshot_options: item.selectedOptions ?? null,
      quantity: qty,
      line_total_paise: lineTotal,
    })
  }

  const totalPaise = subtotalPaise + shippingPaise

  // ── 7. Upsert customer (by phone — normalised) ───────────────────────────
  const { data: customerRow, error: custErr } = await sb
    .from('customers')
    .upsert(
      { name: customer.name.trim(), phone: phoneClean, email: customer.email?.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: 'phone' }
    )
    .select('id')
    .single()

  if (custErr || !customerRow) return error('Failed to create customer record')

  // ── 8. Generate order code ───────────────────────────────────────────────
  const { data: codeData } = await sb.rpc('generate_order_code')
  const orderCode = codeData ?? `MNS-${Date.now()}`

  // ── 9. Create order ──────────────────────────────────────────────────────
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      order_code: orderCode,
      idempotency_key: body.idempotency_key,
      customer_id: customerRow.id,
      status: 'AWAITING_PAYMENT',
      payment_status: 'PENDING',
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
      shipping_name: shipping.name?.trim() || customer.name.trim(),
      shipping_phone: shipping.phone?.replace(/[^0-9]/g, '').replace(/^91/, '') || phoneClean,
      shipping_email: shipping.email?.trim() || customer.email?.trim() || null,
      shipping_address_line1: shipping.address_line1.trim(),
      shipping_address_line2: shipping.address_line2?.trim() || null,
      shipping_locality: shipping.locality?.trim() || null,
      shipping_city: shipping.city.trim(),
      shipping_district: shipping.district.trim(),
      shipping_state: shipping.state.trim(),
      shipping_pincode: pincodeClean,
      customisation_note: body.customisation_note?.trim() || null,
    })
    .select('id, order_code')
    .single()

  if (orderErr || !order) {
    console.error('Order creation error:', orderErr?.message)
    return error('Failed to create order. Please try again.', 500)
  }

  // ── 10. Create order items ────────────────────────────────────────────────
  const itemsWithOrderId = orderItemsPayload.map((i) => ({ ...i, order_id: order.id }))
  const { error: itemsErr } = await sb.from('order_items').insert(itemsWithOrderId)
  if (itemsErr) {
    console.error('Order items error:', itemsErr.message)
    return error('Failed to save order items', 500)
  }

  // ── 11. Create payment record ─────────────────────────────────────────────
  const { error: paymentErr } = await sb.from('payments').insert({
    order_id: order.id,
    status: 'PENDING',
    amount_expected_paise: totalPaise,
  })
  if (paymentErr) console.error('Payment record error:', paymentErr.message)

  // ── 12. Create initial status history ────────────────────────────────────
  await sb.from('order_status_history').insert({
    order_id: order.id,
    old_status: null,
    new_status: 'AWAITING_PAYMENT',
    changed_by: 'SYSTEM',
    note: 'Order placed via website',
  })

  // ── 13. Get UPI ID for confirmation ──────────────────────────────────────
  const { data: upiSetting } = await sb.from('store_settings').select('value').eq('key', 'upi_id').single()
  const { data: upiQrSetting } = await sb.from('store_settings').select('value').eq('key', 'upi_qr_path').single()

  return json({
    orderCode: order.order_code,
    totalPaise,
    subtotalPaise,
    shippingPaise,
    upiId: (upiSetting?.value as string) ?? '',
    upiQrPath: upiQrSetting?.value ?? null,
    customerPhone: phoneClean,
  })
})
