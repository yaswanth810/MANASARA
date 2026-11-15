import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, cn } from '@/lib/utils'

export default function AdminCostingPage() {
  const [targetMargin, setTargetMargin] = useState(40) // %
  const [labourPerUnit, setLabourPerUnit] = useState(50) // ₹ per unit (rough estimate)
  const [packagingPerUnit, setPackagingPerUnit] = useState(30) // ₹
  const [wastagePercent, setWastagePercent] = useState(10) // %

  const { data: products } = useQuery({
    queryKey: ['admin-costing-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price_paise')
        .neq('status', 'ARCHIVED')
        .order('name')
      return data ?? []
    },
  })

  const { data: recipes } = useQuery({
    queryKey: ['admin-costing-recipes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_recipes')
        .select('product_id, quantity_per_unit, materials(cost_per_unit_paise)')
      return data ?? []
    },
  })

  function getMaterialCost(productId: string): number {
    return (recipes ?? [])
      .filter((r) => r.product_id === productId)
      .reduce((sum, r) => {
        const mat = r.materials as { cost_per_unit_paise: number } | null
        return sum + (mat?.cost_per_unit_paise ?? 0) * Number(r.quantity_per_unit)
      }, 0)
  }

  return (
    <div>
      <h1 className="font-fraunces text-2xl font-medium text-plum mb-2">Costing</h1>
      <p className="text-sm text-plum/50 font-dm-sans mb-6">Estimated cost breakdown per product based on recipes and configurable estimates.</p>

      {/* Config */}
      <div className="bg-white rounded-sm border border-gray-200 p-5 mb-6">
        <h2 className="font-medium text-plum font-dm-sans mb-4">Cost Parameters (estimates — update regularly)</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-plum/60 font-dm-sans mb-1">Labour per unit (₹)</label>
            <input value={labourPerUnit} onChange={(e) => setLabourPerUnit(Number(e.target.value))} type="number" min="0" className="input-base text-sm" />
          </div>
          <div>
            <label className="block text-xs text-plum/60 font-dm-sans mb-1">Packaging per unit (₹)</label>
            <input value={packagingPerUnit} onChange={(e) => setPackagingPerUnit(Number(e.target.value))} type="number" min="0" className="input-base text-sm" />
          </div>
          <div>
            <label className="block text-xs text-plum/60 font-dm-sans mb-1">Wastage/overhead (%)</label>
            <input value={wastagePercent} onChange={(e) => setWastagePercent(Number(e.target.value))} type="number" min="0" max="100" className="input-base text-sm" />
          </div>
          <div>
            <label className="block text-xs text-plum/60 font-dm-sans mb-1">Target margin (%)</label>
            <input value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} type="number" min="0" max="100" className="input-base text-sm" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Product</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Material</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Labour</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Packaging</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Total cost</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Suggested price</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Current price</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(products ?? []).map((p) => {
                const matCostPaise = getMaterialCost(p.id)
                const labourPaise = labourPerUnit * 100
                const packagingPaise = packagingPerUnit * 100
                const baseCostPaise = matCostPaise + labourPaise + packagingPaise
                const totalCostPaise = Math.round(baseCostPaise * (1 + wastagePercent / 100))
                const suggestedPricePaise = targetMargin < 100
                  ? Math.round(totalCostPaise / (1 - targetMargin / 100))
                  : totalCostPaise * 2
                const currentMargin = p.price_paise > 0
                  ? ((p.price_paise - totalCostPaise) / p.price_paise) * 100
                  : 0
                const isUnderpriced = currentMargin < targetMargin

                return (
                  <tr key={p.id} className={cn('hover:bg-gray-50', isUnderpriced && 'bg-red-50/30')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-plum font-dm-sans">{p.name}</p>
                      <p className="text-xs text-plum/40 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-dm-sans text-plum/70">{formatINR(matCostPaise)}</td>
                    <td className="px-4 py-3 text-right font-dm-sans text-plum/70">{formatINR(labourPaise)}</td>
                    <td className="px-4 py-3 text-right font-dm-sans text-plum/70">{formatINR(packagingPaise)}</td>
                    <td className="px-4 py-3 text-right font-dm-sans font-medium text-plum">{formatINR(totalCostPaise)}</td>
                    <td className="px-4 py-3 text-right font-dm-sans text-blue-600">{formatINR(suggestedPricePaise)}</td>
                    <td className="px-4 py-3 text-right font-dm-sans font-medium text-plum">{formatINR(p.price_paise)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', isUnderpriced ? 'text-red-600' : 'text-green-600')}>
                        {isUnderpriced && <AlertTriangle className="h-3 w-3" />}
                        {currentMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-plum/40 font-dm-sans mt-3">
        Labour and packaging are estimates you set above. Material cost comes from product recipes. This is an operational guide, not an accounting report.
      </p>
    </div>
  )
}
