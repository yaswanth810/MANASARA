import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate } from '@/lib/utils'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const schema = z.object({
  category: z.string().min(1, 'Category required'),
  description: z.string().min(2, 'Description required'),
  amount_rupees: z.coerce.number().positive('Amount must be positive'),
  expense_date: z.string().min(1, 'Date required'),
  receipt_reference: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const categories = ['Materials', 'Packaging', 'Shipping', 'Marketing', 'Equipment', 'Platform fees', 'Other']

export default function AdminExpensesPage() {
  const [showForm, setShowForm] = useState(false)
  const { adminProfile } = useAdminAuth()
  const qc = useQueryClient()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['admin-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { expense_date: new Date().toISOString().split('T')[0] },
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { error } = await supabase.from('expenses').insert({
        category: data.category,
        description: data.description,
        amount_paise: Math.round(data.amount_rupees * 100),
        expense_date: data.expense_date,
        receipt_reference: data.receipt_reference || null,
        notes: data.notes || null,
        recorded_by: adminProfile!.id,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-expenses'] }); reset({ expense_date: new Date().toISOString().split('T')[0] }); setShowForm(false) },
  })

  // Monthly totals
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthTotal = (expenses ?? [])
    .filter((e) => e.expense_date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount_paise, 0)
  const thisYearTotal = (expenses ?? [])
    .filter((e) => e.expense_date.startsWith(String(now.getFullYear())))
    .reduce((s, e) => s + e.amount_paise, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-fraunces text-2xl font-medium text-plum">Expenses</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-sm border border-gray-200 p-4">
          <p className="text-xs text-plum/40 font-dm-sans">This month</p>
          <p className="font-fraunces text-2xl font-medium text-plum mt-1">{formatINR(thisMonthTotal)}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-4">
          <p className="text-xs text-plum/40 font-dm-sans">This year</p>
          <p className="font-fraunces text-2xl font-medium text-plum mt-1">{formatINR(thisYearTotal)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="bg-white border border-gray-200 rounded-sm p-5 mb-5 space-y-4">
          <h2 className="font-medium text-plum font-dm-sans">New Expense</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Category *</label>
              <select {...register('category')} className="input-base">
                <option value="">Select…</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Date *</label>
              <input {...register('expense_date')} type="date" className="input-base" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Description *</label>
              <input {...register('description')} className="input-base" placeholder="e.g. 100 pipe cleaners from local store" />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Amount (₹) *</label>
              <input {...register('amount_rupees')} type="number" step="0.01" min="0" className="input-base" />
              {errors.amount_rupees && <p className="text-xs text-red-600 mt-1">{errors.amount_rupees.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Receipt reference</label>
              <input {...register('receipt_reference')} className="input-base" placeholder="Bill/receipt number (optional)" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Notes</label>
              <input {...register('notes')} className="input-base" placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addMutation.isPending} className="btn-primary">
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Expense
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
          {addMutation.isError && <p className="text-xs text-red-600">{(addMutation.error as Error).message}</p>}
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Date</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Category</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Description</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
              ) : (expenses ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-plum/40 font-dm-sans">No expenses recorded yet.</td></tr>
              ) : (
                (expenses ?? []).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-plum/50 font-dm-sans text-xs">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3 font-dm-sans text-plum/70">{e.category}</td>
                    <td className="px-4 py-3 font-dm-sans text-plum">{e.description}</td>
                    <td className="px-4 py-3 text-right font-dm-sans font-medium text-plum">{formatINR(e.amount_paise)}</td>
                    <td className="px-4 py-3 text-plum/40 font-dm-sans text-xs">{e.receipt_reference ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
