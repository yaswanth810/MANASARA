import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDateTime, orderStatusLabel, paymentStatusLabel, cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/database.types'

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [verifyOpen, setVerifyOpen] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, customers(*), order_items(*), payments(*), order_status_history(*)`)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: Boolean(id),
  })

  const noteForm = useForm<{ internal_notes: string }>()
  const verifyForm = useForm<{ verified_amount_rupees: number; verified_reference: string }>()
  const statusForm = useForm<{ new_status: string; note: string }>()

  const saveNotes = useMutation({
    mutationFn: async ({ internal_notes }: { internal_notes: string }) => {
      const { error } = await supabase.from('orders').update({ internal_notes, updated_at: new Date().toISOString() }).eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ new_status, note }: { new_status: string; note: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-order-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ order_id: id, new_status, note }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update status')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-order', id] }); statusForm.reset() },
  })

  const verifyPayment = useMutation({
    mutationFn: async ({ verified_amount_rupees, verified_reference }: { verified_amount_rupees: number; verified_reference: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const payment = (order?.payments as { id: string }[])?.[0]
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ payment_id: payment?.id, order_id: id, verified_amount_paise: Math.round(verified_amount_rupees * 100), verified_reference }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to verify payment')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-order', id] }); setVerifyOpen(false); verifyForm.reset() },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dusty-pink" /></div>
  if (!order) return <div className="text-center py-16 text-plum/50 font-dm-sans">Order not found.</div>

  const customer = order.customers as { name: string; phone: string; email: string | null } | null
  const items = (order.order_items ?? []) as { id: string; snapshot_product_name: string; snapshot_sku: string; snapshot_unit_price_paise: number; snapshot_options: unknown; quantity: number; line_total_paise: number }[]
  const payment = ((order.payments ?? []) as { id: string; status: string; amount_expected_paise: number; submitted_amount_paise?: number | null; utr_reference: string | null; submitted_at: string | null; verified_amount_paise: number | null; verified_at: string | null; rejection_reason?: string | null }[])[0]
  const history = [...((order.order_status_history ?? []) as { id: string; new_status: string; old_status: string | null; created_at: string; note: string | null; changed_by: string | null }[])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const nextStatuses = allowedTransitions[order.status as OrderStatus] ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/orders" className="p-2 rounded-sm hover:bg-gray-100 text-plum/50 hover:text-plum">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-fraunces text-xl font-medium text-plum">{order.order_code}</h1>
          <p className="text-xs text-plum/40 font-dm-sans">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border', {
            'bg-amber-50 text-amber-700 border-amber-200': order.status === 'AWAITING_PAYMENT',
            'bg-blue-50 text-blue-700 border-blue-200': order.status === 'CONFIRMED',
            'bg-purple-50 text-purple-700 border-purple-200': order.status === 'IN_PRODUCTION',
            'bg-green-50 text-green-700 border-green-200': order.status === 'DELIVERED',
            'bg-red-50 text-red-700 border-red-200': order.status === 'CANCELLED',
          })}>
            {orderStatusLabel(order.status)}
          </span>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer & address */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h2 className="font-medium text-plum font-dm-sans mb-4">Customer & Delivery</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm font-dm-sans">
              <div>
                <p className="text-xs text-plum/40 mb-0.5">Name</p>
                <p className="text-plum font-medium">{customer?.name}</p>
              </div>
              <div>
                <p className="text-xs text-plum/40 mb-0.5">Phone</p>
                <p className="text-plum">{customer?.phone}</p>
              </div>
              {customer?.email && (
                <div>
                  <p className="text-xs text-plum/40 mb-0.5">Email</p>
                  <p className="text-plum">{customer.email}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-plum/40 mb-0.5">Delivery Address</p>
                <p className="text-plum">
                  {order.shipping_address_line1}
                  {order.shipping_address_line2 && `, ${order.shipping_address_line2}`}
                  {order.shipping_locality && `, ${order.shipping_locality}`}<br />
                  {order.shipping_city}, {order.shipping_district}, {order.shipping_state} — {order.shipping_pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h2 className="font-medium text-plum font-dm-sans mb-4">Order Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 font-medium text-plum/50 font-dm-sans">Product</th>
                  <th className="text-left pb-2 font-medium text-plum/50 font-dm-sans">Options</th>
                  <th className="text-right pb-2 font-medium text-plum/50 font-dm-sans">Qty</th>
                  <th className="text-right pb-2 font-medium text-plum/50 font-dm-sans">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-plum font-dm-sans">{item.snapshot_product_name}</p>
                      <p className="text-xs text-plum/40 font-mono">{item.snapshot_sku}</p>
                    </td>
                    <td className="py-2 text-xs text-plum/50 font-dm-sans pr-4">
                      {item.snapshot_options ? JSON.stringify(item.snapshot_options) : '—'}
                    </td>
                    <td className="py-2 text-right text-plum font-dm-sans">{item.quantity}</td>
                    <td className="py-2 text-right text-plum font-dm-sans font-medium">{formatINR(item.line_total_paise)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={3} className="pt-3 text-right text-sm text-plum/50 font-dm-sans">Subtotal</td>
                  <td className="pt-3 text-right font-dm-sans text-plum">{formatINR(order.subtotal_paise)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right text-sm text-plum/50 font-dm-sans">Shipping</td>
                  <td className="text-right font-dm-sans text-plum">{formatINR(order.shipping_paise)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-medium text-plum font-dm-sans">Total</td>
                  <td className="text-right font-fraunces text-lg text-plum font-medium">{formatINR(order.total_paise)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Internal notes */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h2 className="font-medium text-plum font-dm-sans mb-3">Internal Notes</h2>
            <form onSubmit={noteForm.handleSubmit((d) => saveNotes.mutate(d))}>
              <textarea
                {...noteForm.register('internal_notes')}
                defaultValue={order.internal_notes ?? ''}
                rows={3}
                className="input-base resize-none mb-2"
                placeholder="Add notes visible only to you…"
              />
              <button type="submit" disabled={saveNotes.isPending} className="btn-secondary text-xs">
                {saveNotes.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Save notes
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Payment */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h2 className="font-medium text-plum font-dm-sans mb-4">Payment</h2>
            {payment ? (
              <div className="space-y-3 text-sm font-dm-sans">
                <div>
                  <p className="text-xs text-plum/40">Expected</p>
                  <p className="font-medium text-plum">{formatINR(payment.amount_expected_paise)}</p>
                </div>
                {payment.utr_reference && (
                  <div>
                    <p className="text-xs text-plum/40">UTR (customer-entered — unverified)</p>
                    <p className="font-mono text-xs text-plum bg-gray-50 p-2 rounded break-all">{payment.utr_reference}</p>
                    {payment.submitted_at && <p className="text-xs text-plum/40 mt-1">Submitted: {formatDateTime(payment.submitted_at)}</p>}
                  </div>
                )}
                {payment.verified_at && (
                  <div className="bg-green-50 border border-green-200 rounded-sm p-3">
                    <div className="flex items-center gap-1 mb-1 text-green-700 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Verified — {formatINR(payment.verified_amount_paise ?? 0)}
                    </div>
                    <p className="text-xs text-green-600">{formatDateTime(payment.verified_at)}</p>
                  </div>
                )}
                {payment.status === 'SUBMITTED' && !payment.verified_at && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-2 mb-3 flex gap-1 text-xs text-blue-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Payment submitted but not yet verified against your bank account.
                    </div>
                    {!verifyOpen ? (
                      <button onClick={() => setVerifyOpen(true)} className="btn-primary text-xs">Verify Payment</button>
                    ) : (
                      <form onSubmit={verifyForm.handleSubmit((d) => verifyPayment.mutate(d))} className="space-y-3">
                        <div>
                          <label className="block text-xs text-plum font-dm-sans mb-1">Verified Amount (₹)</label>
                          <input {...verifyForm.register('verified_amount_rupees', { valueAsNumber: true })} type="number" step="0.01" className="input-base text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-plum font-dm-sans mb-1">Your Bank Reference / UTR</label>
                          <input {...verifyForm.register('verified_reference')} className="input-base text-sm" placeholder="Confirmed UTR from bank" />
                        </div>
                        <div className="bg-amber-50 p-2 rounded-sm text-xs text-amber-700 font-dm-sans">
                          Only mark as verified after checking your actual UPI/bank transaction history.
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={verifyPayment.isPending} className="btn-primary text-xs">
                            {verifyPayment.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                            Confirm Verified
                          </button>
                          <button type="button" onClick={() => setVerifyOpen(false)} className="btn-secondary text-xs">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-plum/40 font-dm-sans">No payment record found.</p>
            )}
          </div>

          {/* Status change */}
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-sm border border-gray-200 p-5">
              <h2 className="font-medium text-plum font-dm-sans mb-3">Update Status</h2>
              <form onSubmit={statusForm.handleSubmit((d) => updateStatus.mutate(d))} className="space-y-3">
                <select {...statusForm.register('new_status')} className="input-base text-sm">
                  <option value="">Select next status…</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>{orderStatusLabel(s)}</option>
                  ))}
                </select>
                <input {...statusForm.register('note')} placeholder="Note (optional)" className="input-base text-sm" />
                <button type="submit" disabled={updateStatus.isPending} className="btn-primary text-xs w-full justify-center">
                  {updateStatus.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Update Status
                </button>
                {updateStatus.isError && <p className="text-xs text-red-600">{(updateStatus.error as Error).message}</p>}
              </form>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h2 className="font-medium text-plum font-dm-sans mb-3">Status Timeline</h2>
            <ol className="space-y-3">
              {history.map((h, i) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', i === 0 ? 'bg-dusty-pink' : 'bg-gray-200')} />
                  <div>
                    <p className="font-medium text-plum font-dm-sans">{orderStatusLabel(h.new_status)}</p>
                    <p className="text-xs text-plum/40 font-dm-sans">{formatDateTime(h.created_at)}</p>
                    {h.note && <p className="text-xs text-plum/60 font-dm-sans mt-0.5 italic">"{h.note}"</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
