import { useState, useRef } from 'react'
import { Search, Loader2, Package, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, orderStatusLabel, paymentStatusLabel, cn } from '@/lib/utils'

const schema = z.object({
  order_code: z.string().min(5, 'Enter a valid order code (e.g. MNS-20241109-0001)').regex(/^MNS-/, 'Order code should start with MNS-'),
  phone: z.string().min(10).max(10).regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
})

type FormValues = z.infer<typeof schema>

interface TrackingResult {
  order_code: string
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  history: { status: string; timestamp: string }[]
}

const orderStatusColors: Record<string, string> = {
  AWAITING_PAYMENT: 'bg-butter-yellow/30 text-plum border-butter-yellow/50',
  CONFIRMED: 'bg-muted-leaf/15 text-muted-leaf border-muted-leaf/30',
  IN_PRODUCTION: 'bg-blue-50 text-blue-700 border-blue-200',
  READY: 'bg-purple-50 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-muted-leaf/20 text-muted-leaf border-muted-leaf/40',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

export default function TrackOrderPage() {
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setSubmitting(true)
    setResult(null)
    setNotFound(false)
    setRateLimited(false)
    setServerError(false)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ order_code: data.order_code.trim().toUpperCase(), phone: data.phone.trim() }),
        }
      )

      if (res.status === 429) { setRateLimited(true); return }
      if (!res.ok) { setServerError(true); return }

      const json = await res.json()
      if (!json || !json.order_code) { setNotFound(true); return }
      setResult(json)
    } catch {
      setServerError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto section-padding py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blush mb-4">
          <Package className="h-6 w-6 text-dusty-pink" />
        </div>
        <h1 className="editorial-lg text-plum mb-2">Track Your Order</h1>
        <p className="text-sm text-plum/60 font-dm-sans">
          Enter your order code and mobile number to see the latest status.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-surface p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium font-dm-sans text-plum mb-1.5">
            Order Code
          </label>
          <input
            {...register('order_code')}
            placeholder="MNS-20241109-0001"
            className="input-base"
            autoCapitalize="characters"
          />
          {errors.order_code && (
            <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.order_code.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium font-dm-sans text-plum mb-1.5">
            Mobile Number
          </label>
          <input
            {...register('phone')}
            placeholder="10-digit number (without +91)"
            className="input-base"
            inputMode="numeric"
            maxLength={10}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.phone.message}</p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {submitting ? 'Looking up…' : 'Track Order'}
        </button>

        {/* Errors */}
        {rateLimited && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700 font-dm-sans">
            Too many attempts. Please wait a minute before trying again.
          </div>
        )}
        {notFound && (
          <div className="bg-blush border border-soft-line rounded-sm p-3 text-sm text-plum font-dm-sans">
            No order found with that code and mobile number. Please check and try again.
          </div>
        )}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700 font-dm-sans">
            Something went wrong. Please try again in a moment.
          </div>
        )}
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 card-surface p-6 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-sm text-plum/40 mb-0.5">Order</p>
              <p className="font-fraunces text-xl font-medium text-plum">{result.order_code}</p>
            </div>
            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border', orderStatusColors[result.status] ?? 'bg-blush text-plum border-soft-line')}>
              {orderStatusLabel(result.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-soft-line mb-4 text-sm font-dm-sans">
            <div>
              <p className="text-plum/40 text-xs mb-0.5">Payment</p>
              <p className="text-plum">{paymentStatusLabel(result.payment_status)}</p>
            </div>
            <div>
              <p className="text-plum/40 text-xs mb-0.5">Placed on</p>
              <p className="text-plum">{formatDate(result.created_at)}</p>
            </div>
          </div>

          {/* Timeline */}
          {result.history && result.history.length > 0 && (
            <div>
              <p className="label-sm text-plum/40 mb-3">Status Timeline</p>
              <ol className="space-y-3">
                {[...result.history].reverse().map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', i === 0 ? 'bg-dusty-pink' : 'bg-soft-line')} />
                    <div>
                      <p className="text-sm font-medium text-plum font-dm-sans">{orderStatusLabel(h.status)}</p>
                      <p className="text-xs text-plum/40 font-dm-sans">{formatDate(h.timestamp, { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-soft-line flex gap-2">
            <AlertTriangle className="h-4 w-4 text-butter-yellow shrink-0 mt-0.5" />
            <p className="text-xs text-plum/50 font-dm-sans">
              For any queries about your order, please contact us via Instagram or email with your order code.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
