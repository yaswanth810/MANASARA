import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Loader2, ChevronRight, XCircle, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDateTime } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = 'PENDING' | 'SUBMITTED' | 'REJECTED' | 'PAID'

interface PaymentRecord {
  id: string
  status: PaymentStatus | string
  amount_expected_paise: number
  submitted_amount_paise?: number | null   // new column – what customer claimed
  utr_reference?: string | null
  customer_payment_note?: string | null
  submitted_at?: string | null
  rejection_reason?: string | null         // new column
  orders: {
    id?: string
    order_code: string
    total_paise: number
    customers: { name: string; phone: string } | null
  } | null
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:   'bg-gray-100 text-gray-600',
    SUBMITTED: 'bg-blue-50 text-blue-700',
    REJECTED:  'bg-red-50 text-red-700',
    PAID:      'bg-green-50 text-green-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const qc = useQueryClient()

  // Track which payment is open in which panel
  const [verifyingId, setVerifyingId]   = useState<string | null>(null)
  const [rejectingId, setRejectingId]   = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]    = useState<string | null>(null)

  const verifyForm = useForm<{ verified_amount_rupees: number; verified_reference: string }>()
  const rejectForm = useForm<{ rejection_reason: string }>()

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, orders(id, order_code, total_paise, customers(name, phone))')
        .in('status', ['PENDING', 'SUBMITTED', 'REJECTED'])
        .order('submitted_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as PaymentRecord[]
    },
  })

  // ── Verify mutation ────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: async ({
      paymentId,
      orderId,
      amount,
      ref,
    }: {
      paymentId: string
      orderId: string
      amount: number
      ref: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            payment_id: paymentId,
            order_id: orderId,
            verified_amount_paise: Math.round(amount * 100),
            verified_reference: ref,
          }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to verify payment')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments-queue'] })
      setVerifyingId(null)
      setRejectingId(null)
      verifyForm.reset()
      showSuccess('Payment marked as verified.')
    },
  })

  // ── Reject mutation ────────────────────────────────────────────────────────

  const rejectMutation = useMutation({
    mutationFn: async ({
      paymentId,
      orderId,
      reason,
    }: {
      paymentId: string
      orderId: string
      reason: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            payment_id: paymentId,
            order_id: orderId,
            action: 'reject',
            rejection_reason: reason,
          }),
        }
      )
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to reject payment')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments-queue'] })
      setRejectingId(null)
      setVerifyingId(null)
      rejectForm.reset()
      showSuccess('Payment rejected and customer notified.')
    },
  })

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function openVerify(id: string) {
    setRejectingId(null)
    setVerifyingId(id)
  }

  function openReject(id: string) {
    setVerifyingId(null)
    setRejectingId(id)
    rejectForm.reset()
  }

  function closeAll() {
    setVerifyingId(null)
    setRejectingId(null)
    verifyForm.reset()
    rejectForm.reset()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-medium text-plum">Payment Queue</h1>
        <p className="text-sm text-plum/50 font-dm-sans mt-0.5">
          Payments awaiting verification · includes pending, submitted, and rejected
        </p>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-5 flex gap-2 text-xs font-dm-sans text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        Always verify against your actual UPI/bank account before marking a payment as verified.
        A submitted UTR is not proof of cleared funds.
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-sm p-3 mb-4 flex items-center gap-2 text-xs font-dm-sans text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-dusty-pink" />
        </div>
      ) : (payments ?? []).length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-200 p-10 text-center">
          <CheckCircle className="h-10 w-10 text-muted-leaf mx-auto mb-3" />
          <p className="font-medium text-plum font-dm-sans">All caught up</p>
          <p className="text-sm text-plum/50 font-dm-sans mt-1">No payments pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(payments ?? []).map((p) => {
            const order = p.orders
            const orderId = order?.id ?? ''
            const isRejected   = p.status === 'REJECTED'
            const isSubmitted  = p.status === 'SUBMITTED'
            const amountMismatch =
              p.submitted_amount_paise != null &&
              p.submitted_amount_paise !== p.amount_expected_paise

            return (
              <div
                key={p.id}
                className={`bg-white rounded-sm border p-5 ${
                  isRejected ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                {/* ── Top row: order info + expected amount ── */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-medium text-plum">
                        {order?.order_code}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-sm text-plum/60 font-dm-sans">
                      {order?.customers?.name} · {order?.customers?.phone}
                    </p>
                  </div>

                  {/* Amount block */}
                  <div className="text-right shrink-0">
                    <p className="font-fraunces text-lg font-medium text-plum">
                      {formatINR(p.amount_expected_paise)}
                    </p>
                    <p className="text-xs text-plum/40 font-dm-sans">Expected</p>

                    {/* Customer-claimed amount vs expected */}
                    {p.submitted_amount_paise != null && (
                      <p
                        className={`text-xs font-dm-sans mt-0.5 ${
                          amountMismatch ? 'text-orange-600 font-medium' : 'text-plum/40'
                        }`}
                      >
                        Customer claimed: {formatINR(p.submitted_amount_paise)}
                        {amountMismatch && ' ⚠'}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Amount mismatch callout ── */}
                {amountMismatch && (
                  <div className="bg-orange-50 border border-orange-200 rounded-sm p-2 mb-3 flex gap-1 text-xs font-dm-sans text-orange-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      Amount mismatch — customer claimed{' '}
                      <strong>{formatINR(p.submitted_amount_paise!)}</strong> but order total is{' '}
                      <strong>{formatINR(p.amount_expected_paise)}</strong>. Verify carefully.
                    </span>
                  </div>
                )}

                {/* ── UTR / payment details ── */}
                {p.utr_reference && (
                  <div className="bg-gray-50 rounded-sm p-3 mb-4">
                    <p className="text-xs text-plum/40 font-dm-sans mb-1">
                      Customer-entered UTR (unverified)
                    </p>
                    <p className="font-mono text-sm text-plum break-all">{p.utr_reference}</p>
                    {p.submitted_at && (
                      <p className="text-xs text-plum/30 font-dm-sans mt-1">
                        Submitted: {formatDateTime(p.submitted_at)}
                      </p>
                    )}
                    {p.customer_payment_note && (
                      <p className="text-xs text-plum/50 font-dm-sans mt-1">
                        Note: {p.customer_payment_note}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Rejection details (shown for REJECTED payments) ── */}
                {isRejected && p.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4">
                    <div className="flex items-center gap-1 mb-1 text-red-700 font-medium text-xs font-dm-sans">
                      <XCircle className="h-3.5 w-3.5" />
                      Rejection Reason
                    </div>
                    <p className="text-xs text-red-800 font-dm-sans">{p.rejection_reason}</p>
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/admin/orders/${orderId}`}
                    className="btn-secondary text-xs"
                  >
                    View order <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* SUBMITTED: show Verify + Reject */}
                  {isSubmitted && verifyingId !== p.id && rejectingId !== p.id && (
                    <>
                      <button
                        onClick={() => openVerify(p.id)}
                        className="btn-primary text-xs"
                      >
                        Verify Payment
                      </button>
                      <button
                        onClick={() => openReject(p.id)}
                        className="text-xs px-3 py-1.5 rounded-sm border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-dm-sans font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* REJECTED: allow reviewing again */}
                  {isRejected && verifyingId !== p.id && rejectingId !== p.id && (
                    <button
                      onClick={() => openVerify(p.id)}
                      className="text-xs px-3 py-1.5 rounded-sm border border-gray-300 text-plum/70 hover:bg-gray-50 font-dm-sans font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Review Again
                    </button>
                  )}
                </div>

                {/* ── Verify inline form ── */}
                {verifyingId === p.id && (
                  <form
                    onSubmit={verifyForm.handleSubmit((d) =>
                      verifyMutation.mutate({
                        paymentId: p.id,
                        orderId,
                        amount: d.verified_amount_rupees,
                        ref: d.verified_reference,
                      })
                    )}
                    className="mt-4 pt-4 border-t border-gray-100 space-y-3"
                  >
                    <p className="text-xs font-medium text-plum font-dm-sans">
                      Confirm verified payment details:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-plum/60 font-dm-sans mb-1">
                          Actual amount received (₹)
                        </label>
                        <input
                          {...verifyForm.register('verified_amount_rupees', {
                            required: true,
                            valueAsNumber: true,
                          })}
                          type="number"
                          step="0.01"
                          className="input-base text-sm"
                          defaultValue={(p.amount_expected_paise / 100).toFixed(2)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-plum/60 font-dm-sans mb-1">
                          Your bank/UPI reference
                        </label>
                        <input
                          {...verifyForm.register('verified_reference', { required: true })}
                          className="input-base text-sm"
                          placeholder="Confirmed transaction ID"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={verifyMutation.isPending}
                        className="btn-primary text-xs"
                      >
                        {verifyMutation.isPending && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Mark as Verified
                      </button>
                      <button
                        type="button"
                        onClick={closeAll}
                        className="btn-secondary text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    {verifyMutation.isError && (
                      <p className="text-xs text-red-600">
                        {(verifyMutation.error as Error).message}
                      </p>
                    )}
                  </form>
                )}

                {/* ── Reject inline form ── */}
                {rejectingId === p.id && (
                  <form
                    onSubmit={rejectForm.handleSubmit((d) =>
                      rejectMutation.mutate({
                        paymentId: p.id,
                        orderId,
                        reason: d.rejection_reason,
                      })
                    )}
                    className="mt-4 pt-4 border-t border-red-100 space-y-3"
                  >
                    <p className="text-xs font-medium text-red-700 font-dm-sans">
                      Provide a reason for rejection (sent to customer):
                    </p>
                    <div>
                      <textarea
                        {...rejectForm.register('rejection_reason', {
                          required: 'Rejection reason is required.',
                          minLength: {
                            value: 10,
                            message: 'Please provide at least 10 characters.',
                          },
                        })}
                        rows={3}
                        className="input-base text-sm resize-none"
                        placeholder="e.g. UTR not found in bank statement. Please check and resubmit…"
                      />
                      {rejectForm.formState.errors.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">
                          {rejectForm.formState.errors.rejection_reason.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={rejectMutation.isPending}
                        className="text-xs px-3 py-1.5 rounded-sm border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 font-dm-sans font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        onClick={closeAll}
                        className="btn-secondary text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    {rejectMutation.isError && (
                      <p className="text-xs text-red-600">
                        {(rejectMutation.error as Error).message}
                      </p>
                    )}
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
