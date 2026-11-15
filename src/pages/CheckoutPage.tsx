// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — CheckoutPage
// Route: /checkout
//
// IMPORTANT: Cart prices are display-only snapshots. Final price calculation
// and revalidation happens exclusively server-side in the `place-order` Edge
// Function. Never trust the client total for payment.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin,
  Truck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react'

import { cn, formatINR, isValidIndianMobile, isValidPincode } from '@/lib/utils'
import { useCartStore } from '@/lib/cart-store'
import { useCheckPincode } from '@/hooks/useProducts'

// ── Indian states & UTs ───────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Andaman and Nicobar Islands',
] as const

// ── Zod schema ────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .refine((v) => isValidIndianMobile(v), 'Enter a valid 10-digit Indian mobile number'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  address_line1: z.string().min(5, 'Address must be at least 5 characters'),
  address_line2: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select a state' }) }),
  pincode: z
    .string()
    .refine((v) => isValidPincode(v), 'Enter a valid 6-digit PIN code'),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotalPaise, clearCart } = useCartStore()

  // Stable idempotency key — generated once per checkout session
  const idempotencyKey = useRef<string>(crypto.randomUUID())

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // We watch pincode to trigger the serviceability check
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
  })

  const watchedPincode = watch('pincode', '')
  const isPincodeComplete = watchedPincode?.length === 6 && isValidPincode(watchedPincode)

  const {
    data: pincodeData,
    isFetching: isPincodeLoading,
    isFetched: isPincodeFetched,
  } = useCheckPincode(isPincodeComplete ? watchedPincode : '')

  const isServiceable = isPincodeFetched && pincodeData !== null
  const shippingPaise = isServiceable ? (pincodeData?.shipping_rate_paise ?? 0) : null
  const totalPaise =
    shippingPaise !== null ? subtotalPaise + shippingPaise : null

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop', { replace: true })
    }
  }, [items.length, navigate])

  // ── Submit handler ──────────────────────────────────────────────────────────

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!isServiceable) return

    setSubmitError(null)
    setIsSubmitting(true)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

    try {
      const body = {
        idempotency_key: idempotencyKey.current,
        customer: {
          name: values.name,
          phone: values.phone,
          email: values.email ?? null,
        },
        shipping: {
          address_line1: values.address_line1,
          address_line2: values.address_line2 ?? null,
          locality: values.locality ?? null,
          city: values.city,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        })),
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(
          (errData as { message?: string }).message ??
            `Order failed (${response.status}). Please try again.`
        )
      }

      const result = (await response.json()) as {
        orderCode: string
        totalPaise: number
        upiId: string
        upiQrPath: string | null
      }

      // Clear cart and navigate — pass confirmation data via state
      clearCart()
      navigate(`/order-confirmation/${result.orderCode}`, {
        state: {
          orderCode: result.orderCode,
          totalPaise: result.totalPaise,
          upiId: result.upiId,
          upiQrPath: result.upiQrPath,
          customerPhone: values.phone,
        },
        replace: true,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setSubmitError(message)
      // Rotate idempotency key on error so retry is a fresh attempt
      idempotencyKey.current = crypto.randomUUID()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (items.length === 0) return null // redirecting

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page heading */}
        <h1 className="font-['Fraunces'] text-3xl sm:text-4xl text-[#403238] mb-8">
          Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
            {/* ─── LEFT: Contact & Shipping ──────────────────────────────── */}
            <div className="space-y-8">
              {/* Contact */}
              <fieldset className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 space-y-5">
                <legend className="font-['Fraunces'] text-xl text-[#403238] mb-4 w-full">
                  Contact details
                </legend>

                {/* Name */}
                <FormField label="Full name" error={errors.name?.message} required>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Priya Sharma"
                    className={inputCls(!!errors.name)}
                    autoComplete="name"
                  />
                </FormField>

                {/* Phone */}
                <FormField label="Mobile number" error={errors.phone?.message} required>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#EADFE0] bg-[#FBF7F2] text-[#403238] text-sm select-none">
                      +91
                    </span>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      className={cn(inputCls(!!errors.phone), 'rounded-l-none')}
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </div>
                </FormField>

                {/* Email */}
                <FormField label="Email address" error={errors.email?.message} hint="Optional — for order updates">
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="priya@example.com"
                    className={inputCls(!!errors.email)}
                    autoComplete="email"
                  />
                </FormField>
              </fieldset>

              {/* Shipping address */}
              <fieldset className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 space-y-5">
                <legend className="font-['Fraunces'] text-xl text-[#403238] mb-4 w-full flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D98C9E]" />
                  Shipping address
                </legend>

                {/* Address line 1 */}
                <FormField label="Address line 1" error={errors.address_line1?.message} required>
                  <input
                    {...register('address_line1')}
                    type="text"
                    placeholder="Flat / House no., Building, Street"
                    className={inputCls(!!errors.address_line1)}
                    autoComplete="address-line1"
                  />
                </FormField>

                {/* Address line 2 */}
                <FormField label="Address line 2" error={errors.address_line2?.message}>
                  <input
                    {...register('address_line2')}
                    type="text"
                    placeholder="Area, Colony (optional)"
                    className={inputCls(!!errors.address_line2)}
                    autoComplete="address-line2"
                  />
                </FormField>

                {/* Locality */}
                <FormField label="Locality / Landmark" error={errors.locality?.message}>
                  <input
                    {...register('locality')}
                    type="text"
                    placeholder="Near XYZ (optional)"
                    className={inputCls(!!errors.locality)}
                  />
                </FormField>

                {/* City + District row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="City" error={errors.city?.message} required>
                    <input
                      {...register('city')}
                      type="text"
                      placeholder="Hyderabad"
                      className={inputCls(!!errors.city)}
                      autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField label="District" error={errors.district?.message} required>
                    <input
                      {...register('district')}
                      type="text"
                      placeholder="Hyderabad"
                      className={inputCls(!!errors.district)}
                    />
                  </FormField>
                </div>

                {/* State + PIN row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="State" error={errors.state?.message} required>
                    <div className="relative">
                      <select
                        {...register('state')}
                        className={cn(
                          inputCls(!!errors.state),
                          'appearance-none pr-9 cursor-pointer'
                        )}
                        autoComplete="address-level1"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select state
                        </option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#403238] pointer-events-none" />
                    </div>
                  </FormField>

                  <FormField label="PIN code" error={errors.pincode?.message} required>
                    <input
                      {...register('pincode')}
                      type="text"
                      placeholder="500001"
                      maxLength={6}
                      inputMode="numeric"
                      className={inputCls(!!errors.pincode)}
                      autoComplete="postal-code"
                    />
                  </FormField>
                </div>

                {/* ── Pincode serviceability banner ── */}
                {isPincodeComplete && (
                  <PincodeBanner
                    isLoading={isPincodeLoading}
                    isServiceable={isServiceable}
                    pincodeData={pincodeData}
                  />
                )}
              </fieldset>

              {/* Price note */}
              <p className="text-xs text-[#71836A] text-center">
                ℹ️ Prices shown are indicative. Final amount is verified server-side before
                payment confirmation.
              </p>
            </div>

            {/* ─── RIGHT: Order summary ──────────────────────────────────── */}
            <div className="mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl border border-[#EADFE0] p-6 sm:p-8 sticky top-24 space-y-5">
                <h2 className="font-['Fraunces'] text-xl text-[#403238] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D98C9E]" />
                  Order summary
                </h2>

                {/* Item list */}
                <ul className="divide-y divide-[#EADFE0] text-sm">
                  {items.map((item) => {
                    const lineTotal = item.unitPricePaise * item.quantity
                    const optionEntries = Object.entries(item.selectedOptions)
                    return (
                      <li
                        key={`${item.productId}-${JSON.stringify(item.selectedOptions)}`}
                        className="py-3 flex gap-3"
                      >
                        {/* Product name + options */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#403238] truncate">{item.productName}</p>
                          {optionEntries.length > 0 && (
                            <p className="text-[#71836A] text-xs mt-0.5">
                              {optionEntries
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')}
                            </p>
                          )}
                          <p className="text-[#403238]/60 text-xs mt-0.5">
                            {formatINR(item.unitPricePaise)} × {item.quantity}
                          </p>
                        </div>
                        {/* Line total */}
                        <span className="font-medium text-[#403238] whitespace-nowrap self-start">
                          {formatINR(lineTotal)}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* Subtotal / shipping / total */}
                <div className="space-y-2 text-sm border-t border-[#EADFE0] pt-4">
                  <div className="flex justify-between text-[#403238]/80">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-[#403238]/80">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Shipping
                    </span>
                    <span>
                      {shippingPaise !== null
                        ? shippingPaise === 0
                          ? 'Free'
                          : formatINR(shippingPaise)
                        : (
                          <span className="text-[#71836A] italic">
                            — after PIN check
                          </span>
                        )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#403238] text-base border-t border-[#EADFE0] pt-3 mt-3">
                    <span>Total</span>
                    <span>
                      {totalPaise !== null ? formatINR(totalPaise) : '—'}
                    </span>
                  </div>
                </div>

                {/* Error message */}
                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={
                    !isValid ||
                    !isServiceable ||
                    isPincodeLoading ||
                    isSubmitting
                  }
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
                      Placing order…
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>

                {!isServiceable && isPincodeFetched && !isPincodeLoading && (
                  <p className="text-xs text-center text-[#71836A]">
                    Please enter a serviceable PIN code to continue.
                  </p>
                )}

                {!isPincodeFetched && (
                  <p className="text-xs text-center text-[#71836A]">
                    Enter your PIN code above to check delivery availability.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface PincodeData {
  area_name: string | null
  shipping_rate_paise: number
  estimated_days_min: number
  estimated_days_max: number
}

function PincodeBanner({
  isLoading,
  isServiceable,
  pincodeData,
}: {
  isLoading: boolean
  isServiceable: boolean
  pincodeData: PincodeData | null | undefined
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#71836A] p-3 bg-[#F6E8EC]/30 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking delivery availability…
      </div>
    )
  }

  if (isServiceable && pincodeData) {
    const { area_name, shipping_rate_paise, estimated_days_min, estimated_days_max } = pincodeData
    const shippingLabel =
      shipping_rate_paise === 0 ? 'Free shipping' : formatINR(shipping_rate_paise) + ' shipping'
    const daysLabel =
      estimated_days_min === estimated_days_max
        ? `${estimated_days_min} days`
        : `${estimated_days_min}–${estimated_days_max} days`

    return (
      <div className="flex items-start gap-2 text-sm text-[#71836A] p-3 bg-[#71836A]/10 border border-[#71836A]/30 rounded-lg">
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#71836A]" />
        <span>
          Delivery available
          {area_name ? ` to ${area_name}` : ''}
          {' · '}
          {shippingLabel}
          {' · '}
          {daysLabel}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 text-sm text-red-700 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>
        Sorry, we don't deliver to this PIN code yet.{' '}
        <a href="/contact" className="underline hover:no-underline">
          Please contact us.
        </a>
      </span>
    </div>
  )
}

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#403238]">
        {label}
        {required && <span className="text-[#D98C9E] ml-0.5">*</span>}
        {hint && <span className="text-[#403238]/50 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

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
