// MANASARA Edge Function: track-order
// Rate-limited, minimal order status lookup.
// Returns ONLY: order_code, status, payment_status, timestamps, history.
// Never exposes customer name, address, payment references.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, error } from '../_shared/cors.ts'

const RATE_LIMIT_MAX = 5         // attempts
const RATE_LIMIT_WINDOW_MS = 60_000  // per 1 minute

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Extract IP for rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitKey = `track:${ip}`
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  // Count recent attempts
  const { count } = await sb
    .from('rate_limit_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('key', rateLimitKey)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a minute before trying again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Log this attempt
  await sb.from('rate_limit_attempts').insert({ key: rateLimitKey })

  // Cleanup old records (best-effort)
  sb.rpc('cleanup_rate_limits').then(() => {}).catch(() => {})

  let body: { order_code: string; phone: string }
  try { body = await req.json() } catch { return error('Invalid JSON') }

  if (!body.order_code?.trim() || !body.phone?.trim()) {
    return error('order_code and phone are required')
  }

  // Call secure DB function (validates phone, returns minimal data)
  const { data, error: rpcErr } = await sb.rpc('get_order_tracking', {
    p_order_code: body.order_code.trim().toUpperCase(),
    p_phone: body.phone.trim(),
  })

  if (rpcErr) {
    console.error('Track order RPC error:', rpcErr.message)
    return error('Failed to look up order', 500)
  }

  if (!data) return json(null)  // Not found or phone mismatch — return null without revealing existence

  return json(data)
})
