// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — OrderConfirmationPage
// Route: /order-confirmation/:orderCode
//
// Receives order data from CheckoutPage navigation state.
// Displays UPI payment instructions and collects UTR reference.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Info,
  QrCode,
  ArrowRight,
} from 'lucide-react'

import { cn, formatINR } from '@/lib/utils'
import { useStoreSetting } from '@/hooks/useProducts'

// ── Types for navigation state ────────────────────────────────────────────────

interface OrderConfirmationState {
  orderCode: string
  totalPaise: number
  upiId: string
  upiQrPath: string | null
  customerPhone: string
}

// ── UTR form schema ───────────────────────────────────────────────────────────

const utrSchema = z.object({
  utr_reference: z
    .string()
    .min(12, 'UTR/transaction ID must be at least 12 characters')
    .max(64, 'UTR/transaction ID seems too long'),
  payment_note: z.string().max(500, 'Note is too long').optional(),
})

type UtrFormValues = z.infer<typeof utrSchema>

// ── Steps data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: 1,
    title: 'Pay via UPI',
    desc: 'Send the exact amount to the UPI ID shown below.',
  },
  {
    num: 2,
    title: 'Enter payment reference (UTR)',
    desc: 'Copy your UTR / Transaction ID from your UPI app and paste it here.',
  },
  {
    num: 3,
    title: 'Founders verify payment',
    desc: 'We confirm receipt manually — usually within 2–4 hours.',
  },
  {
    num: 4,
    title: 'Production begins',
    desc: 'Your handmade gift goes into production once payment is verified.',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const { orderCode } = useParams<{ orderCode: string }>()
  const location = useLocation()

  // Data passed from CheckoutPage on success
  const state = location.state as OrderConfirmationState | null

  // Fallback: fetch UPI ID from store settings if not in state
  const { data: storeUpiId } = useStoreSetting<string>('upi_id')
  const upiId = state?.upiId ?? storeUpiId ?? 'manasara@upi'
  const upiQrPath = state?.upiQrPath ?? null
  const totalPaise = state?.totalPaise ?? null
  const customerPhone = state?.customerPhone ?? ''
  const displayOrderCode = orderCode ?? state?.orderCode ?? '—'

  const [copied, setCopied] = useState(false)
  const [utrSubmitted, setUtrSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UtrFormValues>({
    resolver: zodResolver(utrSchema),
    mode: 'onTouched',
  })

  // ── Copy UPI ID ─────────────────────────────────────────────────────────────

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard not available — silently ignore
    }
  }

  // ── UTR submit ──────────────────────────────────────────────────────────────

  const onUtrSubmit = async (values: UtrFormValues) => {
    setSubmitError(null)
    setIsSubmitting(true)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-payment-reference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          order_code: displayOrderCode,
          phone: customerPhone,
          utr_reference: values.utr_reference.trim(),
          payment_note: values.payment_note?.trim() ?? null,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(
          (errData as { message?: string }).message ??
            `Submission failed (${response.status}). Please try again.`
        )
      }

      setUtrSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ── Success header ── */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#71836A]/15 mb-2">
            <CheckCircle2 className="w-10 h-10 text-[#71836A]" />
          </div>
          <h1 className="font-['Fraunces'] text-3xl sm:text-4xl text-[#403238]">
            Order placed!
          </h1>
          <p className="text-[#403238]/70 text-sm">
            Thank you for choosing MANASARA. Complete payment below to begin production.
          </p>
          {/* Order code badge */}
          <div className="inline-block mt-2">
            <span className="font-mono text-lg font-bold tracking-wider text-[#D98C9E] bg-[#F6E8EC] border border-[#D98C9E]/30 px-4 py-2 rounded-xl">
              {displayOrderCode}
            </span>
          </div>
          <p className="text-xs text-[#403238]/50">Save this order code for reference.</p>
        </div>

        {/* ── What happens next ── */}
        <div className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 mb-6">
          <h2 className="font-['Fraunces'] text-xl text-[#403238] mb-5">
            What happens next?
          </h2>
          <ol className="space-y-4">
            {STEPS.map((step) => (
              <li key={step.num} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#D98C9E]/15 text-[#D98C9E] flex items-center justify-center text-sm font-semibold">
                  {step.num}
                </span>
                <div>
                  <p className="font-semibold text-[#403238] text-sm">{step.title}</p>
                  <p className="text-[#403238]/60 text-xs mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── UPI Payment section ── */}
        <div className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 mb-6 space-y-6">
          <h2 className="font-['Fraunces'] text-xl text-[#403238]">Pay via UPI</h2>

          {/* Amount */}
          {totalPaise !== null && (
            <div className="text-center py-4 bg-[#FBF7F2] rounded-xl">
              <p className="text-xs text-[#403238]/50 mb-1 uppercase tracking-wider">Amount to pay</p>
              <p className="font-['Fraunces'] text-4xl text-[#403238]">
                {formatINR(totalPaise)}
              </p>
              <p className="text-xs text-[#71836A] mt-1">
                Server-verified total — pay this exact amount.
              </p>
            </div>
          )}

          {/* UPI ID + QR row */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* QR code */}
            <div className="flex-shrink-0">
              {upiQrPath ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets/${upiQrPath}`}
                  alt="UPI QR code"
                  className="w-36 h-36 rounded-xl border border-[#EADFE0] object-contain bg-white p-2"
                />
              ) : (
                <div className="w-36 h-36 rounded-xl border-2 border-dashed border-[#EADFE0] flex flex-col items-center justify-center gap-2 text-[#403238]/30">
                  <QrCode className="w-10 h-10" />
                  <span className="text-xs text-center">QR not available</span>
                </div>
              )}
            </div>

            {/* UPI ID */}
            <div className="flex-1 space-y-3 w-full">
              <p className="text-sm text-[#403238]/70">Or pay using UPI ID:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[#403238] text-base font-semibold bg-[#FBF7F2] border border-[#EADFE0] rounded-lg px-4 py-3 select-all">
                  {upiId}
                </code>
                <button
                  type="button"
                  onClick={copyUpiId}
                  aria-label="Copy UPI ID"
                  className={cn(
                    'flex-shrink-0 p-3 rounded-lg border transition-all',
                    copied
                      ? 'border-[#71836A] bg-[#71836A]/10 text-[#71836A]'
                      : 'border-[#EADFE0] bg-white hover:border-[#D98C9E] text-[#403238] hover:text-[#D98C9E]'
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[#71836A]">
                Open any UPI app (GPay, PhonePe, Paytm, etc.) and pay to this ID.
              </p>
            </div>
          </div>

          {/* Security warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold mb-0.5">Important</p>
              <p>
                Do not share UPI screenshots. Enter your UTR / Transaction ID only.
                Payment is confirmed only after we verify receipt — this usually takes 2–4 hours.
              </p>
            </div>
          </div>
        </div>

        {/* ── UTR submission form ── */}
        <div className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 space-y-5">
          <h2 className="font-['Fraunces'] text-xl text-[#403238]">
            Enter payment reference
          </h2>

          {utrSubmitted ? (
            /* ── Success state ── */
            <div className="flex items-start gap-3 p-4 bg-[#71836A]/10 border border-[#71836A]/30 rounded-xl text-[#403238]">
              <CheckCircle2 className="w-5 h-5 text-[#71836A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Payment reference submitted!</p>
                <p className="text-sm text-[#403238]/70 mt-1">
                  We'll verify and confirm your order within 2–4 hours. You'll be notified via
                  the mobile number provided.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onUtrSubmit)} className="space-y-4">
              {/* UTR field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#403238]">
                  UTR / Transaction ID
                  <span className="text-[#D98C9E] ml-0.5">*</span>
                </label>
                <input
                  {...register('utr_reference')}
                  type="text"
                  placeholder="e.g. 423456789012"
                  className={inputCls(!!errors.utr_reference)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {errors.utr_reference && (
                  <p className="text-xs text-red-600">{errors.utr_reference.message}</p>
                )}
                <p className="text-xs text-[#403238]/50 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Find your UTR in the payment receipt inside your UPI app.
                </p>
              </div>

              {/* Optional note */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#403238]">
                  Note{' '}
                  <span className="text-[#403238]/40 font-normal">(optional)</span>
                </label>
                <textarea
                  {...register('payment_note')}
                  rows={2}
                  placeholder="Any additional details for us…"
                  className={cn(inputCls(!!errors.payment_note), 'resize-none')}
                />
                {errors.payment_note && (
                  <p className="text-xs text-red-600">{errors.payment_note.message}</p>
                )}
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  'w-full py-3.5 px-6 rounded-xl font-semibold text-white text-sm transition-all',
                  'bg-[#D98C9E] hover:bg-[#c97d8f] active:bg-[#b96d7f]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit payment reference
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-8 text-center text-sm text-[#403238]/60 space-x-4">
          <Link to="/shop" className="hover:text-[#D98C9E] transition-colors">
            Continue shopping
          </Link>
          <span>·</span>
          <Link to="/contact" className="hover:text-[#D98C9E] transition-colors">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean): string {
  return cn(
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#403238] bg-white',
    'placeholder:text-[#403238]/40 outline-none transition-colors',
    'focus:ring-2 focus:ring-[#D98C9E]/40 focus:border-[#D98C9E]',
    hasError
      ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
      : 'border-[#EADFE0] hover:border-[#D98C9E]/60'
  )
}
