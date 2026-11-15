import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProductWithImages } from '@/lib/database.types'

// ── Products ─────────────────────────────────────────────────────────────────

export function useProducts(options?: {
  categorySlug?: string
  status?: 'ACTIVE' | 'DRAFT'
  limit?: number
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images (id, storage_path, alt_text, display_order, is_primary),
          categories (id, name, slug)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (options?.status) {
        query = query.eq('status', options.status)
      } else {
        query = query.eq('status', 'ACTIVE')
      }

      if (options?.categorySlug) {
        query = query.eq('categories.slug', options.categorySlug)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return (data ?? []) as ProductWithImages[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (id, storage_path, alt_text, display_order, is_primary),
          categories (id, name, slug)
        `)
        .eq('slug', slug)
        .eq('status', 'ACTIVE')
        .single()

      if (error) throw new Error(error.message)
      return data as ProductWithImages
    },
    enabled: Boolean(slug),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}

// ── Store settings ────────────────────────────────────────────────────────────

export function useStoreSetting<T = unknown>(key: string) {
  return useQuery({
    queryKey: ['store-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', key)
        .single()

      if (error) throw new Error(error.message)
      return data?.value as T
    },
    staleTime: 1000 * 60 * 15,
  })
}

// ── Serviceable pincodes ──────────────────────────────────────────────────────

export function useCheckPincode(pincode: string) {
  return useQuery({
    queryKey: ['serviceable-pincode', pincode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('serviceable_pincodes')
        .select('pincode, area_name, city, state, shipping_rate_paise, estimated_days_min, estimated_days_max')
        .eq('pincode', pincode.trim())
        .eq('is_active', true)
        .single()

      if (error) return null
      return data
    },
    enabled: pincode.length === 6,
    staleTime: 1000 * 60 * 10,
  })
}
