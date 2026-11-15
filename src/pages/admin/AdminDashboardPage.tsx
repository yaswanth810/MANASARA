// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Admin Dashboard Page  /admin/dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Hammer,
  IndianRupee,
  BadgeCheck,
  Receipt,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDateTime, orderStatusLabel, paymentStatusLabel } from '@/lib/utils'
import type { OrderRow } from '@/lib/database.types'

// ── Helper: today's date as ISO string (midnight local) ───────────────────────
function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── Helper: start of current week (Monday 00:00) ─────────────────────────────
function weekStartISO(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── Skeleton box ──────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
}

// ── Metric card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  loading?: boolean
  accent?: string
}

function MetricCard({ icon, label, value, loading, accent = 'text-[#403238]' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#EADFE0] p-5 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#F6E8EC] flex items-center justify-center text-[#D98C9E]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-6 w-20" />
        ) : (
          <p className={`mt-0.5 text-2xl font-semibold ${accent}`}>{value}</p>
        )}
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    AWAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PRODUCTION: 'bg-purple-100 text-purple-800',
    READY: 'bg-teal-100 text-teal-800',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIALLY_PAID: 'bg-orange-100 text-orange-800',
    REFUND_PENDING: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${palette[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {orderStatusLabel(status) || paymentStatusLabel(status) || status}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const today = todayISO()
  const weekStart = weekStartISO()

  // ── Today's counts ──────────────────────────────────────────────────────────
  const { data: todayCounts, isLoading: loadingToday } = useQuery({
    queryKey: ['admin', 'dashboard', 'today', today],
    queryFn: async () => {
      const [ordersToday, awaitingPmt, pmtReview, inProd] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'PENDING'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'SUBMITTED'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'IN_PRODUCTION'),
      ])
      return {
        ordersToday: ordersToday.count ?? 0,
        awaitingPayment: awaitingPmt.count ?? 0,
        paymentReview: pmtReview.count ?? 0,
        inProduction: inProd.count ?? 0,
      }
    },
    staleTime: 60_000,
  })

  // ── Finance this week ────────────────────────────────────────────────────────
  const { data: finance, isLoading: loadingFinance } = useQuery({
    queryKey: ['admin', 'dashboard', 'finance', weekStart],
    queryFn: async () => {
      // Gross order value (non-cancelled orders this week)
      const { data: grossRows } = await supabase
        .from('orders')
        .select('total_paise')
        .gte('created_at', weekStart)
        .neq('status', 'CANCELLED')

      // Verified receipts (payments marked PAID this week)
      const { data: verifiedRows } = await supabase
        .from('payments')
        .select('verified_amount_paise')
        .eq('status', 'PAID')
        .gte('verified_at', weekStart)

      // Expenses this week
      const { data: expenseRows } = await supabase
        .from('expenses')
        .select('amount_paise')
        .gte('expense_date', weekStart.slice(0, 10))

      const gross = (grossRows ?? []).reduce((sum, r) => sum + (r.total_paise ?? 0), 0)
      const verified = (verifiedRows ?? []).reduce(
        (sum, r) => sum + (r.verified_amount_paise ?? 0),
        0
      )
      const expenses = (expenseRows ?? []).reduce((sum, r) => sum + (r.amount_paise ?? 0), 0)

      return { gross, verified, expenses }
    },
    staleTime: 60_000,
  })

  // ── Recent orders ────────────────────────────────────────────────────────────
  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'dashboard', 'recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_code, shipping_name, total_paise, status, payment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as Pick<
        OrderRow,
        'id' | 'order_code' | 'shipping_name' | 'total_paise' | 'status' | 'payment_status' | 'created_at'
      >[]
    },
    staleTime: 30_000,
  })

  // ── Production queue ─────────────────────────────────────────────────────────
  const { data: prodQueue, isLoading: loadingProd } = useQuery({
    queryKey: ['admin', 'dashboard', 'production-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_code, shipping_name, total_paise, created_at')
        .eq('status', 'IN_PRODUCTION')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#403238]" style={{ fontFamily: 'Fraunces, serif' }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* ── Row 1: Today's summary ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Today
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Orders today"
            value={todayCounts?.ordersToday ?? '—'}
            loading={loadingToday}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5" />}
            label="Awaiting payment"
            value={todayCounts?.awaitingPayment ?? '—'}
            loading={loadingToday}
            accent="text-yellow-700"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Payment review"
            value={todayCounts?.paymentReview ?? '—'}
            loading={loadingToday}
            accent="text-blue-700"
          />
          <MetricCard
            icon={<Hammer className="h-5 w-5" />}
            label="In production"
            value={todayCounts?.inProduction ?? '—'}
            loading={loadingToday}
            accent="text-purple-700"
          />
        </div>
      </section>

      {/* ── Row 2: Finance this week ───────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Finance — this week
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            icon={<IndianRupee className="h-5 w-5" />}
            label="Gross order value"
            value={finance ? formatINR(finance.gross) : '—'}
            loading={loadingFinance}
          />
          <MetricCard
            icon={<BadgeCheck className="h-5 w-5" />}
            label="Verified receipts"
            value={finance ? formatINR(finance.verified) : '—'}
            loading={loadingFinance}
            accent="text-[#71836A]"
          />
          <MetricCard
            icon={<Receipt className="h-5 w-5" />}
            label="Expenses"
            value={finance ? formatINR(finance.expenses) : '—'}
            loading={loadingFinance}
            accent="text-red-700"
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          ⚠️ Gross order value ≠ verified income. Only verified payments count.
        </p>
      </section>

      {/* ── Row 3: Recent orders table ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent orders
          </h2>
          <Link to="/admin/orders" className="text-xs text-[#D98C9E] hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-[#EADFE0] overflow-hidden">
          {loadingOrders ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !recentOrders || recentOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EADFE0] bg-[#FBF7F2]">
                    {['Order', 'Customer', 'Total', 'Status', 'Payment', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFE0]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FBF7F2] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono text-xs text-[#D98C9E] hover:underline"
                        >
                          {order.order_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#403238]">
                        {order.shipping_name}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatINR(order.total_paise)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Low-stock alert placeholder ────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Inventory alerts
        </h2>
        <div className="bg-white rounded-xl border border-[#EADFE0] p-6 flex items-start gap-3 text-sm text-gray-500">
          <AlertTriangle className="h-5 w-5 text-[#E8C77B] shrink-0 mt-0.5" />
          <span>
            Configure materials and recipes to see low-stock alerts here.
          </span>
        </div>
      </section>

      {/* ── Production queue ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Production queue
          </h2>
          <Link to="/admin/orders?status=IN_PRODUCTION" className="text-xs text-[#D98C9E] hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-[#EADFE0] overflow-hidden">
          {loadingProd ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !prodQueue || prodQueue.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <Package className="h-8 w-8 text-gray-200" />
              No orders currently in production.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EADFE0] bg-[#FBF7F2]">
                    {['Order', 'Customer', 'Value', 'Ordered on'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFE0]">
                  {prodQueue.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FBF7F2] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono text-xs text-[#D98C9E] hover:underline"
                        >
                          {order.order_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#403238]">{order.shipping_name}</td>
                      <td className="px-4 py-3 tabular-nums">{formatINR(order.total_paise)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
