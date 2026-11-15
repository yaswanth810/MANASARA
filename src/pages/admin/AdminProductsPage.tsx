import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Archive, ArchiveRestore, Search, ImageOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, cn } from '@/lib/utils'
import type { ProductRow } from '@/lib/database.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

function ProductThumb({ productId }: { productId: string }) {
  const { data } = useQuery({
    queryKey: ['admin-product-thumb', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_images')
        .select('storage_path')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle()
      return data?.storage_path ?? null
    },
    staleTime: 300_000,
  })

  if (!data) {
    return (
      <div className="h-10 w-10 rounded-sm bg-blush/40 flex items-center justify-center">
        <ImageOff className="h-4 w-4 text-plum/20" />
      </div>
    )
  }

  const src = `${SUPABASE_URL}/storage/v1/object/public/product-images/${data}`
  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 rounded-sm object-cover border border-soft-line"
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement
        el.style.display = 'none'
        const ph = el.nextElementSibling as HTMLElement | null
        if (ph) ph.style.display = 'flex'
      }}
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', styles[status] ?? styles.DRAFT)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const qc = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ status: archive ? 'ARCHIVED' : 'DRAFT', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const filtered = (products ?? []).filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-fraunces text-2xl font-medium text-plum">Products</h1>
          <p className="text-sm text-plum/50 font-dm-sans mt-0.5">{products?.length ?? 0} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Demo notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-4 text-xs font-dm-sans text-amber-800">
        ⚠ Seed products are in DRAFT status with illustrative prices. Confirm prices and set to ACTIVE before launch.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-plum/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="input-base pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans w-12"></th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Product</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Price</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Category</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Status</th>
                <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Created</th>
                <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Actions</th>
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
                  <td colSpan={8} className="px-4 py-10 text-center text-plum/40 font-dm-sans">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <ProductThumb productId={product.id} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-plum font-dm-sans">{product.name}</p>
                      {product.is_made_to_order && (
                        <p className="text-xs text-plum/40 font-dm-sans">Made to order</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-plum/60 font-dm-sans font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-plum font-dm-sans">{formatINR(product.price_paise)}</td>
                    <td className="px-4 py-3 text-plum/60 font-dm-sans">
                      {(product as ProductRow & { categories?: { name: string } | null }).categories?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                    <td className="px-4 py-3 text-plum/50 font-dm-sans text-xs">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-1.5 rounded-sm text-plum/40 hover:text-plum hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => archiveMutation.mutate({ id: product.id, archive: product.status !== 'ARCHIVED' })}
                          className="p-1.5 rounded-sm text-plum/40 hover:text-plum hover:bg-gray-100 transition-colors"
                          title={product.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                        >
                          {product.status === 'ARCHIVED'
                            ? <ArchiveRestore className="h-3.5 w-3.5" />
                            : <Archive className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    </td>
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
