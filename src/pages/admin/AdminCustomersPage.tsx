import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`*, orders(id, status, total_paise, created_at)`)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return data
    },
  })

  const filtered = (customers ?? []).filter((c) => {
    if (!search) return true
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-medium text-plum">Customers</h1>
        <p className="text-sm text-plum/50 font-dm-sans mt-0.5">
          {customers?.length ?? 0} customers — data is kept minimal per our privacy policy.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-plum/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or email…" className="input-base pl-9" />
      </div>

      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Name</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Email</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">First order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-plum/40 font-dm-sans">No customers found</td></tr>
              ) : (
                filtered.map((c) => {
                  const orders = c.orders as { id: string; status: string; total_paise: number; created_at: string }[] | null ?? []
                  const firstOrder = orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-plum font-dm-sans">{c.name}</td>
                      <td className="px-4 py-3 text-plum/60 font-dm-sans">{c.phone}</td>
                      <td className="px-4 py-3 text-plum/50 font-dm-sans text-xs">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-plum font-dm-sans">{orders.length}</td>
                      <td className="px-4 py-3 text-plum/50 font-dm-sans text-xs">
                        {firstOrder ? formatDate(firstOrder.created_at) : '—'}
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
