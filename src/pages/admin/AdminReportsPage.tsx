import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Download, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate } from '@/lib/utils'

export default function AdminReportsPage() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [to, setTo] = useState(today.toISOString().split('T')[0])

  const dateRange = { from, to: to + 'T23:59:59Z' }

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-report-orders', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, payment_status, total_paise, subtotal_paise, created_at')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
      if (error) throw error
      return data ?? []
    },
  })

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['admin-report-expenses', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount_paise, category')
        .gte('expense_date', dateRange.from)
        .lte('expense_date', dateRange.to)
      if (error) throw error
      return data ?? []
    },
  })

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-report-payments', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('verified_amount_paise, status, created_at')
        .eq('status', 'PAID')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
      if (error) throw error
      return data ?? []
    },
  })

  const { data: orderItems } = useQuery({
    queryKey: ['admin-report-items', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('snapshot_product_name, snapshot_sku, quantity, line_total_paise, orders!inner(created_at, status)')
        .gte('orders.created_at', dateRange.from)
        .lte('orders.created_at', dateRange.to)
        .neq('orders.status', 'CANCELLED')
      if (error) throw error
      return data ?? []
    },
  })

  const isLoading = ordersLoading || expensesLoading || paymentsLoading

  // Computed metrics
  const totalOrders = orders?.length ?? 0
  const confirmedOrders = orders?.filter(o => o.status !== 'CANCELLED').length ?? 0
  const cancelledOrders = orders?.filter(o => o.status === 'CANCELLED').length ?? 0
  const grossValuePaise = orders?.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total_paise, 0) ?? 0
  const verifiedReceiptsPaise = payments?.reduce((s, p) => s + (p.verified_amount_paise ?? 0), 0) ?? 0
  const totalExpensesPaise = expenses?.reduce((s, e) => s + e.amount_paise, 0) ?? 0
  const estimatedProfitPaise = verifiedReceiptsPaise - totalExpensesPaise
  const avgOrderValuePaise = confirmedOrders > 0 ? Math.round(grossValuePaise / confirmedOrders) : 0

  // Product performance
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const item of orderItems ?? []) {
    const key = item.snapshot_sku
    const existing = productMap.get(key) ?? { name: item.snapshot_product_name, qty: 0, revenue: 0 }
    productMap.set(key, { name: existing.name, qty: existing.qty + item.quantity, revenue: existing.revenue + item.line_total_paise })
  }
  const productPerformance = [...productMap.values()].sort((a, b) => b.revenue - a.revenue)

  // Expense by category
  const expenseByCat = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount_paise
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-medium text-plum">Reports</h1>
          <p className="text-sm text-plum/50 font-dm-sans mt-0.5">Operational summary — not formal accounting</p>
        </div>
        <button
          onClick={() => alert('CSV export coming soon.')}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-plum/60 font-dm-sans mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-base text-sm w-auto" />
        </div>
        <div>
          <label className="block text-xs text-plum/60 font-dm-sans mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-base text-sm w-auto" />
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Last 7d', days: 7 },
            { label: 'Last 30d', days: 30 },
            { label: 'This month', days: 0 },
          ].map(({ label, days }) => (
            <button
              key={label}
              className="btn-secondary text-xs px-3 py-1.5"
              onClick={() => {
                const t = new Date()
                if (days === 0) {
                  setFrom(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`)
                } else {
                  const f = new Date(t); f.setDate(t.getDate() - days)
                  setFrom(f.toISOString().split('T')[0])
                }
                setTo(t.toISOString().split('T')[0])
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-sm p-3 mb-6 text-xs text-blue-700 font-dm-sans">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        This is an operational estimate, not a formal accounting report. Verified receipts only count payments confirmed by you in the payments section.
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-5">
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-3 animate-pulse" />
              <div className="h-7 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total orders', value: String(totalOrders), sub: `${confirmedOrders} confirmed, ${cancelledOrders} cancelled` },
              { label: 'Gross order value', value: formatINR(grossValuePaise), sub: 'Non-cancelled orders' },
              { label: 'Verified receipts', value: formatINR(verifiedReceiptsPaise), sub: 'UPI payments confirmed by you' },
              { label: 'Avg. order value', value: formatINR(avgOrderValuePaise), sub: 'Confirmed orders only' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-sm border border-gray-200 p-5">
                <p className="text-xs text-plum/40 font-dm-sans mb-1">{m.label}</p>
                <p className="font-fraunces text-2xl font-medium text-plum">{m.value}</p>
                <p className="text-xs text-plum/40 font-dm-sans mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* P&L estimate */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-sm border border-gray-200 p-5">
              <p className="text-xs text-plum/40 font-dm-sans mb-1">Total expenses</p>
              <p className="font-fraunces text-2xl font-medium text-red-600">{formatINR(totalExpensesPaise)}</p>
            </div>
            <div className="bg-white rounded-sm border border-gray-200 p-5">
              <p className="text-xs text-plum/40 font-dm-sans mb-1">Verified receipts</p>
              <p className="font-fraunces text-2xl font-medium text-green-600">{formatINR(verifiedReceiptsPaise)}</p>
            </div>
            <div className={`rounded-sm border p-5 ${estimatedProfitPaise >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs text-plum/40 font-dm-sans mb-1">Est. contribution (receipts − expenses)</p>
              <p className={`font-fraunces text-2xl font-medium ${estimatedProfitPaise >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatINR(Math.abs(estimatedProfitPaise))} {estimatedProfitPaise < 0 ? 'loss' : ''}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Product performance */}
            <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-plum/40" />
                <p className="font-medium text-plum font-dm-sans">Product Performance</p>
              </div>
              {productPerformance.length === 0 ? (
                <p className="p-6 text-sm text-plum/40 font-dm-sans">No order data in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 font-medium text-plum/60 font-dm-sans">Product</th>
                      <th className="text-right px-4 py-2.5 font-medium text-plum/60 font-dm-sans">Qty sold</th>
                      <th className="text-right px-4 py-2.5 font-medium text-plum/60 font-dm-sans">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productPerformance.map((p) => (
                      <tr key={p.name} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-dm-sans text-plum">{p.name}</td>
                        <td className="px-4 py-2.5 text-right font-dm-sans text-plum/70">{p.qty}</td>
                        <td className="px-4 py-2.5 text-right font-dm-sans font-medium text-plum">{formatINR(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Expenses by category */}
            <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-plum font-dm-sans">Expenses by Category</p>
              </div>
              {Object.keys(expenseByCat).length === 0 ? (
                <p className="p-6 text-sm text-plum/40 font-dm-sans">No expenses in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                      <tr key={cat} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-dm-sans text-plum">{cat}</td>
                        <td className="px-4 py-2.5 text-right font-dm-sans font-medium text-plum">{formatINR(amt)}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-plum/40 font-dm-sans">
                          {totalExpensesPaise > 0 ? ((amt / totalExpensesPaise) * 100).toFixed(0) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
