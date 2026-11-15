import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, orderStatusLabel, paymentStatusLabel, cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus } from '@/lib/database.types'

const orderStatusColors: Record<string, string> = {
  AWAITING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PRODUCTION: 'bg-purple-50 text-purple-700 border-purple-200',
  READY: 'bg-teal-50 text-teal-700 border-teal-200',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

const paymentColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  PAID: 'bg-green-50 text-green-700',
  PARTIALLY_PAID: 'bg-orange-50 text-orange-700',
  REFUNDED: 'bg-purple-50 text-purple-700',
}

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, paymentFilter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, customers(name, phone), order_items(id)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      if (paymentFilter !== 'all') q = q.eq('payment_status', paymentFilter)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  const statuses: OrderStatus[] = ['AWAITING_PAYMENT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  const paymentStatuses: PaymentStatus[] = ['PENDING', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'REFUNDED']

  const filtered = (orders ?? []).filter((o) => {
    if (!search) return true
    const cust = o.customers as { name: string; phone: string } | null
    return (
      o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      cust?.name.toLowerCase().includes(search.toLowerCase()) ||
      cust?.phone.includes(search)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-medium text-plum">Orders</h1>
          <p className="text-sm text-plum/50 font-dm-sans mt-0.5">{orders?.length ?? 0} orders</p>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn('px-3 py-1 rounded-full text-xs font-dm-sans border transition-colors', statusFilter === 'all' ? 'bg-plum text-ivory border-plum' : 'border-gray-200 text-plum/60 hover:border-plum')}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
            className={cn('px-3 py-1 rounded-full text-xs font-dm-sans border transition-colors', statusFilter === s ? 'bg-plum text-ivory border-plum' : 'border-gray-200 text-plum/60 hover:border-plum')}
          >
            {orderStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Search + payment filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-plum/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order code, customer name or phone…" className="input-base pl-9" />
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-base w-auto">
          <option value="all">All payments</option>
          {paymentStatuses.map((s) => (
            <option key={s} value={s}>{paymentStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Order</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Items</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Total</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Status</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-plum/40 font-dm-sans">No orders found</td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const customer = order.customers as { name: string; phone: string } | null
                  const items = order.order_items as { id: string }[]
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-plum font-medium">{order.order_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-dm-sans text-plum">{customer?.name ?? '—'}</p>
                        <p className="text-xs text-plum/40 font-dm-sans">{customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-plum/60 font-dm-sans">{items?.length ?? 0}</td>
                      <td className="px-4 py-3 font-dm-sans text-plum">{formatINR(order.total_paise)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', orderStatusColors[order.status])}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', paymentColors[order.payment_status] ?? 'bg-gray-100 text-gray-600')}>
                          {paymentStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-plum/50 font-dm-sans text-xs">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${order.id}`} className="p-1.5 rounded-sm text-plum/40 hover:text-plum hover:bg-gray-100 transition-colors inline-flex">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
