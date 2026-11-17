// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — /account/orders/:orderCode
// Full order detail page with status timeline, items, payment info.
// ─────────────────────────────────────────────────────────────────────────────

import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Home,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  formatINR,
  formatDate,
  orderStatusLabel,
  paymentStatusLabel,
  cn,
} from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUND_PENDING'
  | 'REFUNDED'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price_paise: number
  selected_options: Record<string, string> | null
}

interface StatusHistoryEntry {
  status: OrderStatus
  changed_at: string
  notes: string | null
}

interface Payment {
  id: string
  status: PaymentStatus
  utr_reference: string | null
  amount_expected_paise: number
  verified_at: string | null
}

interface OrderDetail {
  id: string
  order_code: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_paise: number
  subtotal_paise: number
  shipping_paise: number
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  order_status_history: StatusHistoryEntry[]
  payments: Payment[]
}

// ── Status helpers ─────────────────────────────────────────────────────────────

interface StatusConfig {
  color: string
  bg: string
  dot: string
  icon: React.ComponentType<{ className?: string }>
}

function getStatusConfig(status: OrderStatus): StatusConfig {
  const map: Record<OrderStatus, StatusConfig> = {
    AWAITING_PAYMENT: {
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      dot: 'bg-amber-400',
      icon: Clock,
    },
    CONFIRMED: {
      color: 'text-green-700',
      bg: 'bg-green-100',
      dot: 'bg-green-500',
      icon: CheckCircle2,
    },
    IN_PRODUCTION: {
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      dot: 'bg-blue-500',
      icon: Package,
    },
    READY: {
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      dot: 'bg-purple-500',
      icon: CheckCircle2,
    },
    OUT_FOR_DELIVERY: {
      color: 'text-orange-700',
      bg: 'bg-orange-100',
      dot: 'bg-orange-500',
      icon: Truck,
    },
    DELIVERED: {
      color: 'text-emerald-800',
      bg: 'bg-emerald-100',
      dot: 'bg-emerald-600',
      icon: Home,
    },
    CANCELLED: {
      color: 'text-red-700',
      bg: 'bg-red-100',
      dot: 'bg-red-500',
      icon: XCircle,
    },
  }
  return map[status] ?? { color: 'text-plum', bg: 'bg-blush', dot: 'bg-dusty-pink', icon: Clock }
}

function paymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
    PARTIALLY_PAID: 'bg-orange-50 text-orange-700 border-orange-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REFUND_PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="card-surface rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-soft-line">
        <Icon className="h-4 w-4 text-dusty-pink" />
        <h2 className="font-fraunces text-base text-plum">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Status Timeline ────────────────────────────────────────────────────────────

function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  // Sort newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-plum/50 font-dm-sans">No status history available.</p>
    )
  }

  return (
    <ol className="relative border-l border-soft-line ml-3">
      {sorted.map((entry, idx) => {
        const cfg = getStatusConfig(entry.status)
        const Icon = cfg.icon
        return (
          <li key={idx} className="mb-6 ml-6 last:mb-0">
            {/* Dot */}
            <span
              className={cn(
                'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-ivory',
                cfg.bg
              )}
            >
              <Icon className={cn('h-3 w-3', cfg.color)} />
            </span>

            {/* Content */}
            <div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-dm-sans mb-1',
                  cfg.bg,
                  cfg.color
                )}
              >
                {orderStatusLabel(entry.status)}
              </span>
              <p className="text-xs text-plum/50 font-dm-sans">
                {new Intl.DateTimeFormat('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }).format(new Date(entry.changed_at))}
              </p>
              {entry.notes && (
                <p className="mt-1 text-xs text-plum/70 font-dm-sans italic">{entry.notes}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ── Order Items ────────────────────────────────────────────────────────────────

function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <div className="divide-y divide-soft-line">
      {items.map((item) => {
        const options = item.selected_options
          ? Object.entries(item.selected_options)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')
          : null

        return (
          <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex-1 min-w-0">
              <p className="font-dm-sans text-sm font-medium text-plum line-clamp-2">
                {item.product_name}
              </p>
              {options && (
                <p className="mt-0.5 text-xs text-plum/50 font-dm-sans">{options}</p>
              )}
              <p className="mt-0.5 text-xs text-plum/40 font-dm-sans">
                Qty: {item.quantity}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-dm-sans text-sm font-semibold text-plum">
                {formatINR(item.unit_price_paise * item.quantity)}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-plum/40 font-dm-sans">
                  {formatINR(item.unit_price_paise)} each
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Price Breakdown ────────────────────────────────────────────────────────────

function PriceBreakdown({
  subtotal,
  shipping,
  total,
}: {
  subtotal: number
  shipping: number
  total: number
}) {
  return (
    <div className="space-y-2 font-dm-sans text-sm">
      <div className="flex justify-between text-plum/70">
        <span>Subtotal</span>
        <span>{formatINR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-plum/70">
        <span>Shipping</span>
        <span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
      </div>
      <div className="flex justify-between font-semibold text-plum pt-2 border-t border-soft-line">
        <span className="font-fraunces text-base">Total</span>
        <span className="font-fraunces text-base">{formatINR(total)}</span>
      </div>
    </div>
  )
}

// ── Delivery Address ───────────────────────────────────────────────────────────

function DeliveryAddress({ order }: { order: OrderDetail }) {
  const hasAddress =
    order.shipping_address_line1 || order.shipping_city || order.shipping_state

  if (!hasAddress) {
    return (
      <p className="text-sm text-plum/50 font-dm-sans">
        No shipping address recorded.
      </p>
    )
  }

  return (
    <address className="not-italic font-dm-sans text-sm text-plum/80 space-y-0.5 leading-relaxed">
      {order.shipping_name && (
        <p className="font-semibold text-plum">{order.shipping_name}</p>
      )}
      {order.shipping_phone && (
        <p className="text-plum/60">{order.shipping_phone}</p>
      )}
      {order.shipping_address_line1 && <p>{order.shipping_address_line1}</p>}
      {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
      {(order.shipping_city || order.shipping_state || order.shipping_pincode) && (
        <p>
          {[order.shipping_city, order.shipping_state, order.shipping_pincode]
            .filter(Boolean)
            .join(', ')}
        </p>
      )}
    </address>
  )
}

// ── Payment Info ───────────────────────────────────────────────────────────────

function PaymentInfo({
  payments,
  paymentStatus,
}: {
  payments: Payment[]
  paymentStatus: PaymentStatus
}) {
  const latestPayment = payments[0] ?? null

  return (
    <div className="space-y-3 font-dm-sans text-sm">
      {/* Overall status */}
      <div className="flex items-center gap-2">
        <span className="text-plum/60">Status:</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
            paymentStatusColor(paymentStatus)
          )}
        >
          {paymentStatusLabel(paymentStatus)}
        </span>
      </div>

      {latestPayment && (
        <>
          <div className="flex justify-between text-plum/70">
            <span>Amount expected</span>
            <span className="font-medium text-plum">
              {formatINR(latestPayment.amount_expected_paise)}
            </span>
          </div>

          {latestPayment.utr_reference && (
            <div className="flex justify-between text-plum/70">
              <span>UTR Reference</span>
              <span className="font-mono text-xs text-plum bg-blush px-2 py-0.5 rounded-md">
                {latestPayment.utr_reference}
              </span>
            </div>
          )}

          {latestPayment.verified_at && (
            <div className="flex justify-between text-plum/70">
              <span>Verified on</span>
              <span>{formatDate(latestPayment.verified_at)}</span>
            </div>
          )}
        </>
      )}

      {!latestPayment && (
        <p className="text-plum/50 text-xs">No payment record found.</p>
      )}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-blush rounded" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface rounded-2xl p-6 h-48 bg-blush/30" />
          <div className="card-surface rounded-2xl p-6 h-32 bg-blush/30" />
        </div>
        <div className="space-y-6">
          <div className="card-surface rounded-2xl p-6 h-40 bg-blush/30" />
          <div className="card-surface rounded-2xl p-6 h-32 bg-blush/30" />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountOrderDetailPage() {
  const { orderCode } = useParams<{ orderCode: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order-detail', orderCode, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_code, status, payment_status,
          total_paise, subtotal_paise, shipping_paise,
          shipping_name, shipping_phone, shipping_address_line1,
          shipping_address_line2, shipping_city, shipping_state, shipping_pincode,
          created_at, updated_at,
          order_items(id, product_name, quantity, unit_price_paise, selected_options),
          order_status_history(status, changed_at, notes),
          payments(id, status, utr_reference, amount_expected_paise, verified_at)
        `)
        .eq('order_code', orderCode!)
        .single()

      if (error) throw error
      return data as OrderDetail
    },
    enabled: !!orderCode && !!user,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <OrderDetailSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 text-dusty-pink mx-auto mb-4" />
          <h1 className="font-fraunces text-2xl text-plum mb-2">Order Not Found</h1>
          <p className="font-dm-sans text-sm text-plum/60 mb-6">
            We couldn't find order <span className="font-mono font-semibold">{orderCode}</span>.
            It may belong to a different account.
          </p>
          <Link to="/account" className="btn-secondary">
            ← Back to My Account
          </Link>
        </div>
      </div>
    )
  }

  const statusCfg = getStatusConfig(order.status)
  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Back + header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center gap-1.5 text-sm text-plum/60 hover:text-plum transition-colors font-dm-sans mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            My Orders
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-fraunces text-2xl sm:text-3xl text-plum mb-1">
                Order{' '}
                <span className="font-mono text-dusty-pink">{order.order_code}</span>
              </h1>
              <p className="font-dm-sans text-sm text-plum/50">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            {/* Current status badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium font-dm-sans',
                statusCfg.bg,
                statusCfg.color
              )}
            >
              <StatusIcon className="h-4 w-4" />
              {orderStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left column: items + timeline */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <Section title="Order Items" icon={Package}>
              <OrderItemsTable items={order.order_items} />
              <div className="mt-5 pt-4 border-t border-soft-line">
                <PriceBreakdown
                  subtotal={order.subtotal_paise}
                  shipping={order.shipping_paise}
                  total={order.total_paise}
                />
              </div>
            </Section>

            {/* Status Timeline */}
            <Section title="Order Timeline" icon={Clock}>
              <StatusTimeline history={order.order_status_history} />
            </Section>
          </div>

          {/* Right column: address + payment */}
          <div className="space-y-6">

            {/* Delivery Address */}
            <Section title="Delivery Address" icon={MapPin}>
              <DeliveryAddress order={order} />
            </Section>

            {/* Payment Info */}
            <Section title="Payment" icon={CreditCard}>
              <PaymentInfo
                payments={order.payments}
                paymentStatus={order.payment_status}
              />
            </Section>

            {/* Help nudge */}
            <div className="rounded-2xl bg-blush/40 border border-soft-line p-4 text-center">
              <p className="text-xs text-plum/60 font-dm-sans mb-2">
                Need help with this order?
              </p>
              <a
                href={`https://wa.me/919999999999?text=Hi! I need help with order ${order.order_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-muted-leaf hover:text-plum transition-colors font-dm-sans underline underline-offset-2"
              >
                Chat with us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
