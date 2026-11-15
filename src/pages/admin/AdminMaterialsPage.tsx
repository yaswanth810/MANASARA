// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Admin Materials Page (/admin/materials)
// Manage raw materials: pipe cleaners, rings, ribbons, packaging, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Package,
  Loader2,
  Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatINR } from '@/lib/utils'
import type { MaterialRow } from '@/lib/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────
type Unit = 'pcs' | 'cm' | 'g' | 'm' | 'ml' | 'sheet'

/** Material row enriched with computed current stock from inventory_transactions */
interface MaterialWithStock extends MaterialRow {
  current_stock: number
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().max(50).optional(),
  unit: z.enum(['pcs', 'cm', 'g', 'm', 'ml', 'sheet']),
  cost_rupees: z.coerce
    .number({ invalid_type_error: 'Enter a valid amount' })
    .min(0, 'Cost cannot be negative'),
  low_stock_threshold: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int()
    .min(0, 'Threshold cannot be negative'),
})

type MaterialFormValues = z.infer<typeof materialSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────
const UNITS: Unit[] = ['pcs', 'cm', 'g', 'm', 'ml', 'sheet']

/** Fetches all materials joined with their computed stock from inventory ledger */
async function fetchMaterials(): Promise<MaterialWithStock[]> {
  // Fetch materials
  const { data: materials, error: matErr } = await supabase
    .from('materials')
    .select('*')
    .order('name')

  if (matErr) throw matErr

  // Fetch stock totals (sum of quantity_delta grouped by material_id)
  const { data: stockRows, error: stockErr } = await supabase
    .from('inventory_transactions')
    .select('material_id, quantity_delta')

  if (stockErr) throw stockErr

  // Aggregate stock per material in memory
  const stockMap = new Map<string, number>()
  for (const row of stockRows ?? []) {
    stockMap.set(row.material_id, (stockMap.get(row.material_id) ?? 0) + row.quantity_delta)
  }

  return (materials ?? []).map((m) => ({
    ...m,
    current_stock: stockMap.get(m.id) ?? 0,
  }))
}

// ── Add / Edit form component ─────────────────────────────────────────────────
interface InlineMaterialFormProps {
  defaultValues?: Partial<MaterialFormValues>
  onSubmit: (values: MaterialFormValues) => Promise<void>
  onCancel?: () => void
  isLoading: boolean
  submitLabel: string
}

function InlineMaterialForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: InlineMaterialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      unit: 'pcs',
      low_stock_threshold: 10,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-2 items-start">
      {/* Name */}
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <input
          {...register('name')}
          placeholder="Material name *"
          className={cn(
            'px-3 py-2 rounded-md border text-sm bg-white font-[DM_Sans]',
            'border-[#EADFE0] focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent',
            errors.name && 'border-red-400'
          )}
        />
        {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
      </div>

      {/* SKU */}
      <div className="flex flex-col gap-1 w-28">
        <input
          {...register('sku')}
          placeholder="SKU"
          className="px-3 py-2 rounded-md border border-[#EADFE0] text-sm bg-white font-[DM_Sans] focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent"
        />
      </div>

      {/* Unit */}
      <div className="flex flex-col gap-1 w-24">
        <select
          {...register('unit')}
          className="px-3 py-2 rounded-md border border-[#EADFE0] text-sm bg-white font-[DM_Sans] focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Cost per unit (in rupees) */}
      <div className="flex flex-col gap-1 w-32">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#71836A]">₹</span>
          <input
            {...register('cost_rupees')}
            type="number"
            step="0.01"
            min="0"
            placeholder="Cost/unit"
            className={cn(
              'w-full pl-7 pr-3 py-2 rounded-md border text-sm bg-white font-[DM_Sans]',
              'border-[#EADFE0] focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent',
              errors.cost_rupees && 'border-red-400'
            )}
          />
        </div>
        {errors.cost_rupees && (
          <span className="text-xs text-red-500">{errors.cost_rupees.message}</span>
        )}
      </div>

      {/* Low stock threshold */}
      <div className="flex flex-col gap-1 w-28">
        <input
          {...register('low_stock_threshold')}
          type="number"
          min="0"
          step="1"
          placeholder="Low-stock #"
          className={cn(
            'px-3 py-2 rounded-md border text-sm bg-white font-[DM_Sans]',
            'border-[#EADFE0] focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent',
            errors.low_stock_threshold && 'border-red-400'
          )}
        />
        {errors.low_stock_threshold && (
          <span className="text-xs text-red-500">{errors.low_stock_threshold.message}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#D98C9E] text-white text-sm font-medium font-[DM_Sans] hover:bg-[#c97d8e] transition-colors disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-2 rounded-md border border-[#EADFE0] text-sm text-[#403238] font-[DM_Sans] hover:bg-[#F6E8EC] transition-colors"
          >
            <X size={14} />
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMaterialsPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: materials, isLoading, error } = useQuery({
    queryKey: ['admin', 'materials'],
    queryFn: fetchMaterials,
  })

  // ── Add mutation ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (values: MaterialFormValues) => {
      const { error } = await supabase.from('materials').insert({
        name: values.name,
        sku: values.sku || null,
        unit: values.unit,
        cost_per_unit_paise: Math.round(values.cost_rupees * 100),
        low_stock_threshold: values.low_stock_threshold,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'materials'] })
      setShowAddForm(false)
    },
  })

  // ── Edit mutation ───────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: MaterialFormValues }) => {
      const { error } = await supabase
        .from('materials')
        .update({
          name: values.name,
          sku: values.sku || null,
          unit: values.unit,
          cost_per_unit_paise: Math.round(values.cost_rupees * 100),
          low_stock_threshold: values.low_stock_threshold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'materials'] })
      setEditingId(null)
    },
  })

  // ── Toggle active status ────────────────────────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('materials')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'materials'] }),
  })

  const filtered = (materials ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = (materials ?? []).filter(
    (m) => m.is_active && m.current_stock < m.low_stock_threshold
  ).length

  return (
    <div className="p-6 space-y-6 font-[DM_Sans]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-[Fraunces] text-[#403238]">Materials</h1>
          <p className="text-sm text-[#71836A] mt-0.5">
            Manage raw materials used in production
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#403238] text-white text-sm font-medium hover:bg-[#5a4448] transition-colors"
        >
          <Plus size={16} />
          Add Material
        </button>
      </div>

      {/* Low-stock alert banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FBF7F2] border border-[#E8C77B] text-[#403238] text-sm">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <span>
            <strong>{lowStockCount} material{lowStockCount > 1 ? 's' : ''}</strong> below low-stock
            threshold — restock soon.
          </span>
        </div>
      )}

      {/* Add form panel */}
      {showAddForm && (
        <div className="p-4 rounded-xl border border-[#EADFE0] bg-[#FBF7F2] space-y-3">
          <h3 className="text-sm font-semibold text-[#403238]">New Material</h3>
          <InlineMaterialForm
            submitLabel="Add Material"
            isLoading={addMutation.isPending}
            onSubmit={(values) => addMutation.mutateAsync(values)}
            onCancel={() => setShowAddForm(false)}
          />
          {addMutation.isError && (
            <p className="text-xs text-red-500">
              Error: {(addMutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71836A]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full pl-9 pr-4 py-2 rounded-md border border-[#EADFE0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:border-transparent"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#71836A]">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading materials…
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500 text-sm">
          Failed to load materials: {(error as Error).message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#71836A]">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No materials match your search.' : 'No materials yet. Add your first material above.'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#EADFE0] overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EADFE0] bg-[#FBF7F2]">
                {['Name', 'SKU', 'Unit', 'Cost/unit', 'Stock', 'Threshold', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#71836A]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADFE0]">
              {filtered.map((mat) => {
                const isLow = mat.is_active && mat.current_stock < mat.low_stock_threshold
                const isEditing = editingId === mat.id

                if (isEditing) {
                  return (
                    <tr key={mat.id} className="bg-[#F6E8EC]/30">
                      <td colSpan={8} className="px-4 py-3">
                        <InlineMaterialForm
                          submitLabel="Save"
                          isLoading={editMutation.isPending}
                          defaultValues={{
                            name: mat.name,
                            sku: mat.sku ?? '',
                            unit: mat.unit as Unit,
                            cost_rupees: mat.cost_per_unit_paise / 100,
                            low_stock_threshold: mat.low_stock_threshold,
                          }}
                          onSubmit={(values) =>
                            editMutation.mutateAsync({ id: mat.id, values })
                          }
                          onCancel={() => setEditingId(null)}
                        />
                        {editMutation.isError && (
                          <p className="text-xs text-red-500 mt-1">
                            Error: {(editMutation.error as Error).message}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={mat.id}
                    className={cn(
                      'hover:bg-[#FBF7F2] transition-colors',
                      isLow && 'bg-amber-50/60'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-[#403238] flex items-center gap-2">
                      {isLow && (
                        <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                      )}
                      {mat.name}
                    </td>
                    <td className="px-4 py-3 text-[#71836A] font-mono text-xs">
                      {mat.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[#403238]">{mat.unit}</td>
                    <td className="px-4 py-3 text-[#403238]">
                      {formatINR(mat.cost_per_unit_paise)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 font-semibold tabular-nums',
                        isLow ? 'text-amber-600' : 'text-[#403238]'
                      )}
                    >
                      {mat.current_stock}
                    </td>
                    <td className="px-4 py-3 text-[#71836A]">{mat.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: mat.id, is_active: !mat.is_active })
                        }
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                          mat.is_active
                            ? 'bg-[#71836A]/10 text-[#71836A] hover:bg-red-100 hover:text-red-600'
                            : 'bg-[#EADFE0] text-[#71836A] hover:bg-[#D98C9E]/20 hover:text-[#D98C9E]'
                        )}
                      >
                        {mat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingId(mat.id)}
                        className="p-1.5 rounded-md text-[#71836A] hover:bg-[#F6E8EC] hover:text-[#D98C9E] transition-colors"
                        aria-label="Edit material"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[#71836A]">
        Stock levels are computed live from the inventory ledger.{' '}
        <span className="text-amber-600">Amber rows</span> indicate materials below threshold.
      </p>
    </div>
  )
}
