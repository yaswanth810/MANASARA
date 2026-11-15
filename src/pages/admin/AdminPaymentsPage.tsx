import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Loader2, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDateTime } from '@/lib/utils'

export default function AdminPaymentsPage() {
  const qc = useQueryClient()
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const verifyForm = useForm<{ verified_amount_rupees: number; verified_reference: string }>()

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, orders(order_code, total_paise, customers(name, phone))')
        .in('status', ['PENDING', 'SUBMITTED'])
        .order('submitted_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })

  const verifyMutation = useMutation({
    mutationFn: async ({ paymentId, orderId, amount, ref }: { paymentId: string; orderId: string; amount: number; ref: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ payment_id: paymentId, order_id: orderId, verified_amount_paise: Math.round(amount * 100), verified_reference: ref }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments-queue'] })
      setVerifyingId(null)
      verifyForm.reset()
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-medium text-plum">Payment Queue</h1>
        <p className="text-sm text-plum/50 font-dm-sans mt-0.5">Payments awaiting verification</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-5 flex gap-2 text-xs font-dm-sans text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        Always verify against your actual UPI/bank account before marking a payment as verified.
        A submitted UTR is not proof of cleared funds.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dusty-pink" /></div>
      ) : (payments ?? []).length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-200 p-10 text-center">
          <CheckCircle className="h-10 w-10 text-muted-leaf mx-auto mb-3" />
          <p className="font-medium text-plum font-dm-sans">All caught up</p>
          <p className="text-sm text-plum/50 font-dm-sans mt-1">No payments pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(payments ?? []).map((p) => {
            const order = p.orders as { order_code: string; total_paise: number; customers: { name: string; phone: string } | null } | null
            return (
              <div key={p.id} className="bg-white rounded-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-plum">{order?.order_code}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-plum/60 font-dm-sans">{order?.customers?.name} · {order?.customers?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-fraunces text-lg font-medium text-plum">{formatINR(p.amount_expected_paise)}</p>
                    <p className="text-xs text-plum/40 font-dm-sans">Expected</p>
                  </div>
                </div>

                {p.utr_reference && (
                  <div className="bg-gray-50 rounded-sm p-3 mb-4">
                    <p className="text-xs text-plum/40 font-dm-sans mb-1">Customer-entered UTR (unverified)</p>
                    <p className="font-mono text-sm text-plum break-all">{p.utr_reference}</p>
                    {p.submitted_at && <p className="text-xs text-plum/30 font-dm-sans mt-1">Submitted: {formatDateTime(p.submitted_at)}</p>}
                    {p.customer_payment_note && <p className="text-xs text-plum/50 font-dm-sans mt-1">Note: {p.customer_payment_note}</p>}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/admin/orders/${(p.orders as { id?: string } | null)?.id ?? ''}`} className="btn-secondary text-xs">
                    View order <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  {p.status === 'SUBMITTED' && verifyingId !== p.id && (
                    <button onClick={() => setVerifyingId(p.id)} className="btn-primary text-xs">
                      Verify Payment
                    </button>
                  )}
                </div>

                {verifyingId === p.id && (
                  <form
                    onSubmit={verifyForm.handleSubmit((d) => verifyMutation.mutate({ paymentId: p.id, orderId: (p.orders as { id: string } | null)?.id ?? '', amount: d.verified_amount_rupees, ref: d.verified_reference }))}
                    className="mt-4 pt-4 border-t border-gray-100 space-y-3"
                  >
                    <p className="text-xs font-medium text-plum font-dm-sans">Confirm verified payment details:</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-plum/60 font-dm-sans mb-1">Actual amount received (₹)</label>
                        <input {...verifyForm.register('verified_amount_rupees', { valueAsNumber: true })} type="number" step="0.01" className="input-base text-sm" defaultValue={(p.amount_expected_paise / 100).toFixed(2)} />
                      </div>
                      <div>
                        <label className="block text-xs text-plum/60 font-dm-sans mb-1">Your bank/UPI reference</label>
                        <input {...verifyForm.register('verified_reference')} className="input-base text-sm" placeholder="Confirmed transaction ID" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={verifyMutation.isPending} className="btn-primary text-xs">
                        {verifyMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Mark as Verified
                      </button>
                      <button type="button" onClick={() => setVerifyingId(null)} className="btn-secondary text-xs">Cancel</button>
                    </div>
                    {verifyMutation.isError && <p className="text-xs text-red-600">{(verifyMutation.error as Error).message}</p>}
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
