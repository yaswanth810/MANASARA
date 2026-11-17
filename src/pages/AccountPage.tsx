// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — /account
// Tabbed account page: My Orders | Profile | Addresses
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag,
  User,
  MapPin,
  LogOut,
  ChevronRight,
  Package,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatINR, formatDate, orderStatusLabel, paymentStatusLabel, cn } from '@/lib/utils'

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
  product_name: string        // mapped from snapshot_product_name in query
  quantity: number
  unit_price_paise: number    // mapped from snapshot_unit_price_paise in query
  selected_options: Record<string, string> | null
}

interface Order {
  id: string
  order_code: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_paise: number
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

type Tab = 'orders' | 'profile' | 'addresses'

// ── Status badge helpers ───────────────────────────────────────────────────────

function orderStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    AWAITING_PAYMENT: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    IN_PRODUCTION: 'bg-blue-100 text-blue-800',
    READY: 'bg-purple-100 text-purple-800',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}

function paymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    SUBMITTED: 'bg-blue-50 text-blue-700',
    PARTIALLY_PAID: 'bg-orange-50 text-orange-700',
    PAID: 'bg-emerald-50 text-emerald-700',
    REFUND_PENDING: 'bg-yellow-50 text-yellow-700',
    REFUNDED: 'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// ── Order Card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const itemSummary = order.order_items
    .slice(0, 3)
    .map((i) => i.product_name)
    .join(', ')
  const extraCount = order.order_items.length - 3

  return (
    <div className="card-surface rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-mono text-sm font-semibold text-dusty-pink tracking-wide">
            {order.order_code}
          </span>
          <p className="text-xs text-plum/50 font-dm-sans mt-0.5">
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-dm-sans',
              orderStatusColor(order.status)
            )}
          >
            {orderStatusLabel(order.status)}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-dm-sans',
              paymentStatusColor(order.payment_status)
            )}
          >
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      {/* Items summary */}
      <p className="text-sm text-plum/70 font-dm-sans mb-3 line-clamp-2">
        <span className="font-medium text-plum">{order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</span>
        {' — '}
        {itemSummary}
        {extraCount > 0 && ` +${extraCount} more`}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="font-fraunces text-lg text-plum">
          {formatINR(order.total_paise)}
        </span>
        <Link
          to={`/account/orders/${order.order_code}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-dusty-pink hover:text-plum transition-colors font-dm-sans"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// ── My Orders Tab ──────────────────────────────────────────────────────────────

function MyOrdersTab() {
  const { user, profile } = useAuth()

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      // Query orders directly — the RLS policy "orders_customer_select" filters
      // to orders belonging to this user via their profile phone/email.
      // We do NOT query the customers table (no public RLS policy on it).
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_code, status, payment_status,
          total_paise, created_at, updated_at,
          order_items(
            id,
            snapshot_product_name,
            quantity,
            snapshot_unit_price_paise,
            snapshot_options
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Remap snapshot column names to the interface shape
      return ((data ?? []) as unknown[]).map((o: unknown) => {
        const order = o as Record<string, unknown>
        return {
          ...order,
          order_items: ((order.order_items ?? []) as Record<string, unknown>[]).map((i) => ({
            id: i.id,
            product_name: i.snapshot_product_name,
            quantity: i.quantity,
            unit_price_paise: i.snapshot_unit_price_paise,
            selected_options: i.snapshot_options ?? null,
          })),
        }
      }) as Order[]
    },
    enabled: !!user,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface rounded-2xl p-5 animate-pulse">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-32 bg-blush rounded" />
              <div className="h-5 w-24 bg-blush rounded-full" />
            </div>
            <div className="h-4 w-48 bg-blush rounded mb-3" />
            <div className="flex justify-between">
              <div className="h-6 w-20 bg-blush rounded" />
              <div className="h-4 w-24 bg-blush rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-soft-line bg-blush/30 p-10 text-center">
        <AlertCircle className="h-10 w-10 text-dusty-pink mx-auto mb-3" />
        <p className="font-dm-sans text-sm text-plum/70">
          Couldn't load your orders. Please try again.
        </p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-5xl">🛍️</div>
        <h2 className="font-fraunces text-xl text-plum mb-2">No orders yet</h2>
        <p className="font-dm-sans text-sm text-plum/60 mb-6 max-w-xs">
          Your handcrafted pieces will appear here once you place an order.
        </p>
        <Link to="/shop" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="max-w-md">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-dusty-pink flex items-center justify-center shrink-0">
          <span className="font-fraunces text-xl text-white">{initials}</span>
        </div>
        <div>
          <p className="font-fraunces text-lg text-plum leading-tight">
            {profile?.full_name || 'Your Account'}
          </p>
          <p className="font-dm-sans text-sm text-plum/60">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-plum/60 font-dm-sans mb-1.5 uppercase tracking-wide">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="input-base w-full"
            autoComplete="name"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-plum/60 font-dm-sans mb-1.5 uppercase tracking-wide">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="input-base w-full"
            autoComplete="tel"
          />
          <p className="mt-1.5 text-xs text-plum/40 font-dm-sans">
            Used to link your orders placed via WhatsApp or checkout.
          </p>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-medium text-plum/60 font-dm-sans mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <div className="rounded-xl border border-soft-line bg-blush/30 px-4 py-2.5">
            <p className="font-dm-sans text-sm text-plum/60">{user?.email}</p>
          </div>
          <p className="mt-1.5 text-xs text-plum/40 font-dm-sans">
            Email cannot be changed.
          </p>
        </div>

        {/* Success / Error feedback */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-dm-sans">Profile saved successfully!</p>
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-dm-sans">{saveError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loading}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Sign out */}
      <div className="mt-10 pt-8 border-t border-soft-line">
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-plum/60 hover:text-red-500 transition-colors font-dm-sans"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

// ── Addresses Tab (Coming Soon) ────────────────────────────────────────────────

function AddressesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl">📍</div>
      <h2 className="font-fraunces text-xl text-plum mb-2">Address Book</h2>
      <p className="font-dm-sans text-sm text-plum/60 max-w-xs">
        Saved addresses are coming soon. Currently your delivery address is collected during checkout.
      </p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
]

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders')

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-fraunces text-3xl sm:text-4xl text-plum mb-1">My Account</h1>
          <p className="font-dm-sans text-sm text-plum/50">
            Manage your orders, profile, and addresses.
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 rounded-2xl bg-blush/50 border border-soft-line mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all font-dm-sans',
                activeTab === id
                  ? 'bg-white text-plum shadow-sm'
                  : 'text-plum/60 hover:text-plum hover:bg-white/50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'orders' && <MyOrdersTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'addresses' && <AddressesTab />}
        </div>
      </div>
    </div>
  )
}
