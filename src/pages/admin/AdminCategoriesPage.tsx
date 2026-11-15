import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Pencil, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  display_order: z.coerce.number().int().min(0),
})
type FormValues = z.infer<typeof schema>

export default function AdminCategoriesPage() {
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('display_order')
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_order: 0 },
  })

  const watchName = watch('name')

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = { ...data, is_active: true, updated_at: new Date().toISOString() }
      if (editing) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editing)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      reset()
      setEditing(null)
      setShowForm(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  function startEdit(cat: typeof categories extends (infer T)[] | undefined ? T : never) {
    if (!cat) return
    setEditing((cat as { id: string }).id)
    setValue('name', (cat as { name: string }).name)
    setValue('slug', (cat as { slug: string }).slug)
    setValue('description', (cat as { description: string | null }).description ?? '')
    setValue('display_order', (cat as { display_order: number }).display_order)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-fraunces text-2xl font-medium text-plum">Categories</h1>
        <button onClick={() => { setShowForm((s) => !s); setEditing(null); reset() }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="bg-white border border-gray-200 rounded-sm p-5 mb-5 space-y-4">
          <h2 className="font-medium text-plum font-dm-sans">{editing ? 'Edit Category' : 'New Category'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Name *</label>
              <input
                {...register('name')}
                className="input-base"
                onChange={(e) => { register('name').onChange(e); if (!editing) setValue('slug', slugify(e.target.value)) }}
                placeholder="e.g. Bouquets"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Slug *</label>
              <input {...register('slug')} className="input-base font-mono text-sm" placeholder="bouquets" />
              {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Description</label>
            <input {...register('description')} className="input-base" placeholder="Short description (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Display Order</label>
            <input {...register('display_order')} type="number" min="0" className="input-base w-24" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting || saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Category'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); reset() }} className="btn-secondary">Cancel</button>
          </div>
          {saveMutation.isError && <p className="text-xs text-red-600">{(saveMutation.error as Error).message}</p>}
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Name</th>
              <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Order</th>
              <th className="text-left px-4 py-3 font-medium text-plum/60 font-dm-sans">Status</th>
              <th className="text-right px-4 py-3 font-medium text-plum/60 font-dm-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-dusty-pink mx-auto" /></td></tr>
            ) : (categories ?? []).map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-plum font-dm-sans">{cat.name}</td>
                <td className="px-4 py-3 text-plum/50 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-plum/60 font-dm-sans">{cat.display_order}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${cat.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-sm text-plum/40 hover:text-plum hover:bg-gray-100 transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => toggleMutation.mutate({ id: cat.id, active: !cat.is_active })} className="p-1.5 rounded-sm text-plum/40 hover:text-plum hover:bg-gray-100 transition-colors" title={cat.is_active ? 'Hide' : 'Show'}>
                      {cat.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
