import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { InventoryTransactionType } from '@/lib/database.types'

const txTypes: { value: InventoryTransactionType; label: string }[] = [
  { value: 'OPENING', label: 'Opening Stock' },
  { value: 'PURCHASE', label: 'Purchase / Restock' },
  { value: 'PRODUCTION_USAGE', label: 'Production Usage' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Return' },
  { value: 'REVERSAL', label: 'Reversal' },
]

const txColors: Partial<Record<InventoryTransactionType, string>> = {
  OPENING: 'text-blue-600',
  PURCHASE: 'text-green-600',
  PRODUCTION_USAGE: 'text-red-500',
  ADJUSTMENT: 'text-orange-500',
  RETURN: 'text-purple-500',
  REVERSAL: 'text-gray-500',
}

export default function AdminInventoryPage() {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [txType, setTxType] = useState<InventoryTransactionType>('PURCHASE')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const qc = useQueryClient()

  const { data: materials } = useQuery({
    queryKey: ['admin-materials-select'],
    queryFn: async () => {
      const { data } = await supabase.from('materials').select('id, name, unit').eq('is_active', true).order('name')
      return data ?? []
    },
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['admin-inventory-ledger', selectedMaterialId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('material_id', selectedMaterialId!)
        .order('created_at', { ascending: false })
        .limit(100)
      return data ?? []
    },
    enabled: Boolean(selectedMaterialId),
  })

  const currentBalance = transactions?.[0] ? Number(transactions[0].balance_after) : 0

  const addTransaction = useMutation({
    mutationFn: async () => {
      const isOut = txType === 'PRODUCTION_USAGE'
      const delta = isOut ? -Math.abs(Number(qty)) : Math.abs(Number(qty))
      const newBalance = currentBalance + delta

      // Idempotency key
      const idempotencyKey = crypto.randomUUID()

      const { error } = await supabase.from('inventory_transactions').insert({
        material_id: selectedMaterialId!,
        type: txType,
        quantity_delta: delta,
        balance_after: newBalance,
        notes: notes || null,
        idempotency_key: idempotencyKey,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inventory-ledger', selectedMaterialId] })
      qc.invalidateQueries({ queryKey: ['material-stock-balances'] })
      setQty('')
      setNotes('')
    },
  })

  const selectedMaterial = (materials ?? []).find((m) => m.id === selectedMaterialId)

  return (
    <div>
      <h1 className="font-fraunces text-2xl font-medium text-plum mb-6">Inventory Ledger</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Material selector */}
        <div>
          <div className="bg-white rounded-sm border border-gray-200 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-plum font-dm-sans">Select material</p>
            </div>
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {(materials ?? []).map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedMaterialId(m.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-dm-sans transition-colors ${selectedMaterialId === m.id ? 'bg-blush text-plum font-medium' : 'text-plum/70 hover:bg-gray-50'}`}
                  >
                    {m.name}
                    <span className="block text-xs text-plum/40">{m.unit}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Add transaction form */}
          {selectedMaterialId && (
            <div className="bg-white rounded-sm border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-medium text-plum font-dm-sans">Add Transaction</p>
              <div>
                <label className="block text-xs text-plum/60 font-dm-sans mb-1">Type</label>
                <select value={txType} onChange={(e) => setTxType(e.target.value as InventoryTransactionType)} className="input-base text-sm">
                  {txTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-plum/60 font-dm-sans mb-1">
                  Quantity ({selectedMaterial?.unit})
                  {txType === 'PRODUCTION_USAGE' && <span className="text-red-400"> — will be deducted</span>}
                </label>
                <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" step="0.01" min="0.01" className="input-base text-sm" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="block text-xs text-plum/60 font-dm-sans mb-1">Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-base text-sm" placeholder="Optional" />
              </div>
              <div className="text-xs text-plum/50 font-dm-sans bg-gray-50 p-2 rounded">
                Current balance: <strong>{currentBalance} {selectedMaterial?.unit}</strong>
                {qty && (
                  <> → after: <strong>{(currentBalance + (txType === 'PRODUCTION_USAGE' ? -Math.abs(Number(qty)) : Math.abs(Number(qty)))).toFixed(2)} {selectedMaterial?.unit}</strong></>
                )}
              </div>
              <button
                onClick={() => addTransaction.mutate()}
                disabled={!qty || addTransaction.isPending}
                className="btn-primary w-full justify-center text-sm"
              >
                {addTransaction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Record Transaction
              </button>
              {addTransaction.isError && <p className="text-xs text-red-600">{(addTransaction.error as Error).message}</p>}
            </div>
          )}
        </div>

        {/* Ledger */}
        <div className="lg:col-span-2">
          {!selectedMaterialId ? (
            <div className="bg-white rounded-sm border border-gray-200 p-10 text-center text-plum/40 font-dm-sans">
              Select a material to view its ledger.
            </div>
          ) : (
            <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between">
                <p className="font-medium text-plum font-dm-sans">{selectedMaterial?.name}</p>
                <p className="font-fraunces text-lg text-plum">Balance: {currentBalance} {selectedMaterial?.unit}</p>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-dusty-pink" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Type</th>
                        <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Change</th>
                        <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Balance</th>
                        <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(transactions ?? []).map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-plum/50 font-dm-sans text-xs">{formatDate(tx.created_at, { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                          <td className="px-4 py-2.5 font-dm-sans text-xs font-medium">{tx.type.replace(/_/g, ' ')}</td>
                          <td className={`px-4 py-2.5 text-right font-dm-sans font-medium ${Number(tx.quantity_delta) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {Number(tx.quantity_delta) >= 0 ? '+' : ''}{Number(tx.quantity_delta).toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-dm-sans text-plum">{Number(tx.balance_after).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-plum/50 font-dm-sans text-xs">{tx.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
