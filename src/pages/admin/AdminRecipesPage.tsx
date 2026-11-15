// Admin Recipes, Inventory, Costing, Expenses, Reports, Settings — stub pages with real structure
// These are grouped for brevity; each is a full standalone export

// ─── AdminRecipesPage ─────────────────────────────────────────────────────────
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'

export default function AdminRecipesPage() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [addMaterialId, setAddMaterialId] = useState('')
  const [addQty, setAddQty] = useState('')
  const qc = useQueryClient()

  const { data: products } = useQuery({
    queryKey: ['admin-products-select'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, sku').neq('status', 'ARCHIVED').order('name')
      return data ?? []
    },
  })

  const { data: materials } = useQuery({
    queryKey: ['admin-materials-select'],
    queryFn: async () => {
      const { data } = await supabase.from('materials').select('*').eq('is_active', true).order('name')
      return data ?? []
    },
  })

  const { data: recipe } = useQuery({
    queryKey: ['admin-recipe', selectedProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_recipes')
        .select('*, materials(name, unit, cost_per_unit_paise)')
        .eq('product_id', selectedProductId!)
      return data ?? []
    },
    enabled: Boolean(selectedProductId),
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('product_recipes').upsert({
        product_id: selectedProductId!,
        material_id: addMaterialId,
        quantity_per_unit: Number(addQty),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id,material_id' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-recipe', selectedProductId] }); setAddMaterialId(''); setAddQty('') },
  })

  const deleteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase.from('product_recipes').delete().eq('id', recipeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recipe', selectedProductId] }),
  })

  const totalMaterialCostPaise = (recipe ?? []).reduce((sum, r) => {
    const mat = r.materials as { cost_per_unit_paise: number } | null
    return sum + (mat?.cost_per_unit_paise ?? 0) * Number(r.quantity_per_unit)
  }, 0)

  return (
    <div>
      <h1 className="font-fraunces text-2xl font-medium text-plum mb-6">Recipes (Bill of Materials)</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product list */}
        <div className="lg:col-span-1 bg-white rounded-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium text-plum font-dm-sans">Select a product</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {(products ?? []).map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-dm-sans transition-colors ${selectedProductId === p.id ? 'bg-blush text-plum font-medium' : 'text-plum/70 hover:bg-gray-50'}`}
                >
                  {p.name}
                  <span className="block text-xs text-plum/40 font-mono">{p.sku}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Recipe detail */}
        <div className="lg:col-span-2">
          {!selectedProductId ? (
            <div className="bg-white rounded-sm border border-gray-200 p-10 text-center text-plum/40 font-dm-sans">
              Select a product to view or edit its recipe.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Material</th>
                      <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Qty/unit</th>
                      <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Unit</th>
                      <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Cost</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(recipe ?? []).map((r) => {
                      const mat = r.materials as { name: string; unit: string; cost_per_unit_paise: number } | null
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-dm-sans text-plum">{mat?.name}</td>
                          <td className="px-4 py-3 font-dm-sans text-plum">{r.quantity_per_unit}</td>
                          <td className="px-4 py-3 font-dm-sans text-plum/60">{mat?.unit}</td>
                          <td className="px-4 py-3 font-dm-sans text-plum">{formatINR((mat?.cost_per_unit_paise ?? 0) * Number(r.quantity_per_unit))}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteMutation.mutate(r.id)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {recipe?.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-plum/40 font-dm-sans text-sm">No materials added yet.</td></tr>
                    )}
                  </tbody>
                  {(recipe?.length ?? 0) > 0 && (
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={3} className="px-4 py-3 font-medium text-plum font-dm-sans">Total material cost per unit</td>
                        <td colSpan={2} className="px-4 py-3 font-medium text-plum font-dm-sans">{formatINR(totalMaterialCostPaise)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Add material */}
              <div className="bg-white rounded-sm border border-gray-200 p-4">
                <p className="text-sm font-medium text-plum font-dm-sans mb-3">Add Material</p>
                <div className="flex gap-2 flex-wrap">
                  <select value={addMaterialId} onChange={(e) => setAddMaterialId(e.target.value)} className="input-base flex-1 min-w-48">
                    <option value="">Select material…</option>
                    {(materials ?? []).map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                  <input value={addQty} onChange={(e) => setAddQty(e.target.value)} type="number" step="0.01" min="0" placeholder="Qty" className="input-base w-24" />
                  <button
                    onClick={() => addMutation.mutate()}
                    disabled={!addMaterialId || !addQty || addMutation.isPending}
                    className="btn-primary"
                  >
                    {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
