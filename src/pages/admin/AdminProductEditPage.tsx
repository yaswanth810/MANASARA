import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Info, UploadCloud, Trash2, Star, ImageOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify, cn } from '@/lib/utils'

// ── Image Manager ─────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface ProductImage {
  id: string
  storage_path: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

function ProductImageManager({ productId }: { productId: string }) {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [pendingImages, setPendingImages] = useState<ProductImage[]>([])

  const {
    data: dbImages = [],
    isLoading,
    error: imagesError,
    refetch,
  } = useQuery<ProductImage[]>({
    queryKey: ['admin-product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('id, storage_path, alt_text, display_order, is_primary')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const images = [
    ...dbImages,
    ...pendingImages.filter(p => !dbImages.find(d => d.storage_path === p.storage_path)),
  ]

  useEffect(() => {
    if (pendingImages.length > 0 && dbImages.length > 0) {
      const allConfirmed = pendingImages.every(p =>
        dbImages.some(d => d.storage_path === p.storage_path)
      )
      if (allConfirmed) setPendingImages([])
    }
  }, [dbImages, pendingImages])

  const invalidateAndRefetch = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-product-images', productId] })
    await qc.invalidateQueries({ queryKey: ['products'] })
    await qc.invalidateQueries({ queryKey: ['product'] })
    await refetch()
  }, [qc, productId, refetch])

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files)
    const allowed = fileArr.filter((f) => f.type.startsWith('image/'))
    if (allowed.length === 0) {
      setUploadError('Please select image files only (JPG, PNG, WEBP).')
      return
    }
    if (allowed.some((f) => f.size > 10 * 1024 * 1024)) {
      setUploadError('Each image must be under 10 MB.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    const { data: { session } } = await supabase.auth.getSession()
    console.log('[Upload] session:', session?.user?.email ?? 'NO SESSION')
    if (!session) {
      setUploadError('Session expired — please refresh the page and log in again.')
      setUploading(false)
      return
    }

    try {
      const nextOrder = images.length

      for (let i = 0; i < allowed.length; i++) {
        const file = allowed[i]
        const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
        const path = `${productId}/${Date.now()}_${i}.${ext}`
        const isPrimary = images.length === 0 && i === 0

        const tempId = `pending-${Date.now()}-${i}`
        setPendingImages(prev => [...prev, {
          id: tempId,
          storage_path: path,
          alt_text: null,
          display_order: nextOrder + i,
          is_primary: isPrimary,
        }])

        const { error: storageErr } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: true, contentType: file.type })

        console.log('[Upload] storage error:', storageErr)

        if (storageErr) {
          setPendingImages(prev => prev.filter(p => p.id !== tempId))
          throw new Error(`Storage upload failed: ${storageErr.message}`)
        }

        const { data: dbRow, error: dbErr } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            storage_path: path,
            alt_text: null,
            display_order: nextOrder + i,
            is_primary: isPrimary,
          })
          .select()
          .single()

        if (dbErr) {
          setPendingImages(prev => prev.filter(p => p.id !== tempId))
          await supabase.storage.from('product-images').remove([path])
          throw new Error(`Database save failed: ${dbErr.message}`)
        }

        if (dbRow) {
          setPendingImages(prev =>
            prev.map(p => p.id === tempId ? (dbRow as ProductImage) : p)
          )
        }
      }

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 4000)
      await invalidateAndRefetch()

    } catch (err) {
      setUploadError((err as Error).message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (img: ProductImage) => {
      if (img.id.startsWith('pending-')) {
        setPendingImages(prev => prev.filter(p => p.id !== img.id))
        return
      }
      await supabase.storage.from('product-images').remove([img.storage_path])
      const { error: dErr } = await supabase.from('product_images').delete().eq('id', img.id)
      if (dErr) throw dErr
      if (img.is_primary) {
        const remaining = dbImages.filter(x => x.id !== img.id)
        if (remaining.length > 0) {
          await supabase.from('product_images').update({ is_primary: true }).eq('id', remaining[0].id)
        }
      }
    },
    onSuccess: invalidateAndRefetch,
  })

  const setPrimaryMutation = useMutation({
    mutationFn: async (img: ProductImage) => {
      if (img.id.startsWith('pending-')) return
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
      const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', img.id)
      if (error) throw error
    },
    onSuccess: invalidateAndRefetch,
  })

  const updateAltMutation = useMutation({
    mutationFn: async ({ id, alt_text }: { id: string; alt_text: string }) => {
      if (id.startsWith('pending-')) return
      const { error } = await supabase.from('product_images').update({ alt_text: alt_text || null }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAndRefetch,
  })

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-5 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-plum font-dm-sans">Product Images</h2>
        <button
          type="button"
          onClick={() => refetch()}
          title="Refresh images"
          className="p-1.5 text-plum/40 hover:text-plum rounded-sm hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {imagesError && !isLoading && (
        <div className="mb-3 rounded-sm bg-red-50 border border-red-200 p-3 text-xs font-dm-sans text-red-700">
          <strong>Could not load images:</strong> {(imagesError as Error).message}
        </div>
      )}

      {/* Images grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="aspect-square bg-gray-100 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-sm overflow-hidden border border-soft-line bg-blush/20">
              <img
                src={imgUrl(img.storage_path)}
                alt={img.alt_text ?? 'Product image'}
                className="w-full aspect-square object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2' }}
              />
              {img.id.startsWith('pending-') && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-dusty-pink" />
                </div>
              )}
              {img.is_primary && !img.id.startsWith('pending-') && (
                <span className="absolute top-1.5 left-1.5 bg-butter-yellow text-plum text-[9px] font-medium font-dm-sans px-1.5 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              {!img.id.startsWith('pending-') && (
                <div className="absolute inset-0 bg-plum/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryMutation.mutate(img)}
                      title="Set as primary"
                      className="p-1.5 rounded-full bg-white/90 text-plum hover:bg-white"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { if (window.confirm('Delete this image?')) deleteMutation.mutate(img) }}
                    title="Delete image"
                    className="p-1.5 rounded-full bg-white/90 text-red-500 hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {!img.id.startsWith('pending-') && (
                <input
                  type="text"
                  defaultValue={img.alt_text ?? ''}
                  placeholder="Alt text…"
                  onBlur={(e) => {
                    if (e.target.value !== (img.alt_text ?? '')) {
                      updateAltMutation.mutate({ id: img.id, alt_text: e.target.value })
                    }
                  }}
                  className="absolute bottom-0 inset-x-0 text-[10px] font-dm-sans bg-white/90 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity placeholder:text-plum/40 text-plum focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 py-5 mb-4 text-plum/30">
          <ImageOff className="h-8 w-8" />
          <p className="text-xs font-dm-sans">No images yet</p>
        </div>
      )}

      {/* Plain visible file input — works in ALL browsers, cannot be blocked */}
      {!uploading ? (
        <label
          className={cn(
            'block border-2 border-dashed rounded-sm text-center transition-colors cursor-pointer',
            dragOver ? 'border-dusty-pink bg-blush/30' : 'border-soft-line hover:border-dusty-pink hover:bg-blush/10',
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              console.log('[FileInput] onChange fired, files:', e.target.files?.length)
              if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files)
            }}
          />
          <div className="p-6">
            <UploadCloud className="h-7 w-7 mx-auto mb-2 text-dusty-pink" />
            <p className="text-sm font-medium font-dm-sans text-plum">
              Drop images here or <span className="text-dusty-pink underline">browse</span>
            </p>
            <p className="text-xs text-plum/40 font-dm-sans mt-1">
              JPG, PNG or WEBP · Max 10 MB each · Multiple allowed
            </p>
          </div>
        </label>
      ) : (
        <div className="border-2 border-dashed border-soft-line rounded-sm p-6 text-center opacity-60">
          <div className="flex items-center justify-center gap-2 text-dusty-pink">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-dm-sans">Uploading…</span>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-sm bg-green-50 border border-green-200 p-3 text-xs font-dm-sans text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Image uploaded and saved successfully!
        </div>
      )}

      {uploadError && (
        <div className="mt-3 rounded-sm bg-red-50 border border-red-200 p-3 text-xs font-dm-sans text-red-700">
          <strong>Upload failed:</strong> {uploadError}
        </div>
      )}

      <p className="mt-2 text-xs text-plum/40 font-dm-sans">
        Hover over an image to delete or set as primary. Click ★ to set primary.
      </p>
    </div>
  )
}

// ── Product Edit Form ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  sku: z.string().min(2, 'SKU is required'),
  category_id: z.string().optional(),
  description: z.string().optional(),
  price_rupees: z.coerce.number().positive('Price must be positive'),
  compare_at_price_rupees: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  is_made_to_order: z.boolean(),
  production_lead_days_min: z.coerce.number().int().min(0),
  production_lead_days_max: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').eq('is_active', true).order('display_order')
      return data ?? []
    },
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !isNew,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'DRAFT',
      is_made_to_order: true,
      production_lead_days_min: 2,
      production_lead_days_max: 5,
      sort_order: 0,
      price_rupees: 0,
    },
  })

  const watchName = watch('name')
  useEffect(() => {
    if (isNew && watchName) setValue('slug', slugify(watchName))
  }, [watchName, isNew, setValue])

  useEffect(() => {
    if (product) {
      setValue('name', product.name)
      setValue('slug', product.slug)
      setValue('sku', product.sku)
      setValue('category_id', product.category_id ?? '')
      setValue('description', product.description ?? '')
      setValue('price_rupees', product.price_paise / 100)
      setValue('compare_at_price_rupees', product.compare_at_price_paise ? product.compare_at_price_paise / 100 : undefined)
      setValue('status', product.status)
      setValue('is_made_to_order', product.is_made_to_order)
      setValue('production_lead_days_min', product.production_lead_days_min)
      setValue('production_lead_days_max', product.production_lead_days_max)
      setValue('sort_order', product.sort_order)
    }
  }, [product, setValue])

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        category_id: data.category_id || null,
        description: data.description || null,
        price_paise: Math.round(data.price_rupees * 100),
        compare_at_price_paise: data.compare_at_price_rupees ? Math.round(data.compare_at_price_rupees * 100) : null,
        status: data.status,
        is_made_to_order: data.is_made_to_order,
        production_lead_days_min: data.production_lead_days_min,
        production_lead_days_max: data.production_lead_days_max,
        sort_order: data.sort_order,
        updated_at: new Date().toISOString(),
      }

      if (isNew) {
        const { data: created, error } = await supabase.from('products').insert(payload).select().single()
        if (error) {
          const msg = error.message ?? ''
          if (msg.includes('products_slug_key') || msg.includes('slug')) throw new Error('SLUG_TAKEN')
          if (msg.includes('products_sku_key') || msg.includes('sku'))  throw new Error('SKU_TAKEN')
          if (msg.includes('permission') || error.code === '42501')     throw new Error('PERMISSION')
          throw error
        }
        return created
      } else {
        const { data: updated, error } = await supabase.from('products').update(payload).eq('id', id!).select().single()
        if (error) {
          const msg = error.message ?? ''
          if (msg.includes('products_slug_key') || msg.includes('slug')) throw new Error('SLUG_TAKEN')
          if (msg.includes('products_sku_key') || msg.includes('sku'))  throw new Error('SKU_TAKEN')
          if (msg.includes('permission') || error.code === '42501')     throw new Error('PERMISSION')
          throw error
        }
        return updated
      }
    },
    onSuccess: (created) => {
      if (isNew && created) navigate(`/admin/products/${created.id}/edit`)
    },
  })

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-dusty-pink" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="p-2 rounded-sm hover:bg-gray-100 text-plum/50 hover:text-plum transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-fraunces text-2xl font-medium text-plum">
            {isNew ? 'New Product' : 'Edit Product'}
          </h1>
          {!isNew && <p className="text-xs text-plum/40 font-dm-sans font-mono mt-0.5">{product?.sku}</p>}
        </div>
      </div>

      {isNew && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-5 flex gap-2 text-xs font-dm-sans text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          New products are created as DRAFT. Add photos and confirm prices before setting to Active.
        </div>
      )}

      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-sm border border-gray-200 p-5 space-y-4">
            <h2 className="font-medium text-plum font-dm-sans">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Product Name *</label>
              <input {...register('name')} className="input-base" placeholder="e.g. Cherry Keychain" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">URL Slug *</label>
                <input {...register('slug')} className="input-base font-mono text-sm" placeholder="cherry-keychain" />
                {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">SKU *</label>
                <input {...register('sku')} className="input-base font-mono text-sm" placeholder="KCH-001" />
                {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Description</label>
              <textarea {...register('description')} rows={4} className="input-base resize-none" placeholder="Describe the product…" />
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 p-5 space-y-4">
            <h2 className="font-medium text-plum font-dm-sans">Pricing (in Rupees)</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Price (₹) *</label>
                <input {...register('price_rupees')} type="number" step="0.01" min="0" className="input-base" />
                {errors.price_rupees && <p className="text-xs text-red-600 mt-1">{errors.price_rupees.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Compare-at Price (₹)</label>
                <input {...register('compare_at_price_rupees')} type="number" step="0.01" min="0" className="input-base" placeholder="Original price (optional)" />
              </div>
            </div>
            <p className="text-xs text-plum/40 font-dm-sans">
              Prices are stored as paise internally. Entered values are converted automatically.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-sm border border-gray-200 p-5 space-y-4">
            <h2 className="font-medium text-plum font-dm-sans">Status</h2>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Product Status</label>
              <select {...register('status')} className="input-base">
                <option value="DRAFT">Draft — Not visible to customers</option>
                <option value="ACTIVE">Active — Live in shop</option>
                <option value="ARCHIVED">Archived — Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Category</label>
              <select {...register('category_id')} className="input-base">
                <option value="">Uncategorised</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Sort Order</label>
              <input {...register('sort_order')} type="number" min="0" className="input-base" />
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 p-5 space-y-4">
            <h2 className="font-medium text-plum font-dm-sans">Production</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('is_made_to_order')} type="checkbox" className="rounded border-soft-line text-dusty-pink" />
              <span className="text-sm font-dm-sans text-plum">Made to order</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-plum/60 font-dm-sans mb-1">Min days</label>
                <input {...register('production_lead_days_min')} type="number" min="0" className="input-base" />
              </div>
              <div>
                <label className="block text-xs text-plum/60 font-dm-sans mb-1">Max days</label>
                <input {...register('production_lead_days_max')} type="number" min="0" className="input-base" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || saveMutation.isPending}
            className="btn-primary w-full justify-center"
          >
            {(isSubmitting || saveMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? 'Create Product' : 'Save Changes'}
          </button>

          {saveMutation.isSuccess && (
            <p className="text-xs text-green-600 font-dm-sans text-center">Saved successfully.</p>
          )}
          {saveMutation.isError && (() => {
            const msg = (saveMutation.error as Error).message ?? ''
            const isSlug = msg === 'SLUG_TAKEN'
            const isSku  = msg === 'SKU_TAKEN'
            const isPerm = msg === 'PERMISSION'
            return (
              <div className="rounded-sm bg-red-50 border border-red-200 p-3 text-xs font-dm-sans text-red-700 space-y-1">
                {isSlug && <><p className="font-semibold">URL slug already in use.</p><p>Change the URL Slug field.</p></>}
                {isSku  && <><p className="font-semibold">SKU already in use.</p><p>Change the SKU to a unique code.</p></>}
                {isPerm && <><p className="font-semibold">Permission denied.</p><p>Refresh and log in again.</p></>}
                {!isSlug && !isSku && !isPerm && <p>{msg || 'An unexpected error occurred.'}</p>}
              </div>
            )
          })()}
        </div>
      </form>

      {/* Product Images — rendered OUTSIDE the form */}
      {!isNew && id && <ProductImageManager productId={id} />}
    </div>
  )
}
