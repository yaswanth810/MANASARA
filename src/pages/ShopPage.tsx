// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — /shop
// Product grid with filter sidebar, URL-persisted filters.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { cn, formatINR } from '@/lib/utils'
import type { ProductWithImages } from '@/lib/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'popular'
type AvailabilityFilter = 'all' | 'in-stock' | 'made-to-order'

// ── Filter helpers ────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most popular' },
]

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'All products' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'made-to-order', label: 'Made to order' },
]

function sortProducts(products: ProductWithImages[], sort: SortKey): ProductWithImages[] {
  const copy = [...products]
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.price_paise - b.price_paise)
    case 'price-desc':
      return copy.sort((a, b) => b.price_paise - a.price_paise)
    case 'popular':
      // Fall through to sort_order (closest proxy for popularity without analytics)
      return copy.sort((a, b) => a.sort_order - b.sort_order)
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }
}

// ── Filter Panel (shared between sidebar + drawer) ────────────────────────────

interface FilterPanelProps {
  categories: { id: string; name: string; slug: string }[]
  selectedCategory: string
  priceMin: string
  priceMax: string
  availability: AvailabilityFilter
  sort: SortKey
  onCategoryChange: (slug: string) => void
  onPriceMinChange: (val: string) => void
  onPriceMaxChange: (val: string) => void
  onAvailabilityChange: (val: AvailabilityFilter) => void
  onSortChange: (val: SortKey) => void
  onReset: () => void
}

function FilterPanel({
  categories,
  selectedCategory,
  priceMin,
  priceMax,
  availability,
  sort,
  onCategoryChange,
  onPriceMinChange,
  onPriceMaxChange,
  onAvailabilityChange,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const [openSections, setOpenSections] = useState({
    sort: true,
    category: true,
    price: true,
    availability: true,
  })

  const toggle = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }))

  const Section = ({
    id,
    title,
    children,
  }: {
    id: keyof typeof openSections
    title: string
    children: React.ReactNode
  }) => (
    <div className="border-b border-soft-line pb-4">
      <button
        onClick={() => toggle(id)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-plum font-dm-sans"
        aria-expanded={openSections[id]}
      >
        {title}
        {openSections[id] ? (
          <ChevronUp className="h-4 w-4 text-plum/50" />
        ) : (
          <ChevronDown className="h-4 w-4 text-plum/50" />
        )}
      </button>
      {openSections[id] && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-1">
      {/* Reset */}
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-plum/50 font-dm-sans">
          Filters
        </span>
        <button
          onClick={onReset}
          className="text-xs text-dusty-pink underline underline-offset-2 hover:text-plum transition-colors font-dm-sans"
        >
          Reset all
        </button>
      </div>

      {/* Sort */}
      <Section id="sort" title="Sort by">
        {SORT_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              value={opt.value}
              checked={sort === opt.value}
              onChange={() => onSortChange(opt.value)}
              className="accent-dusty-pink"
            />
            <span className="text-sm text-plum font-dm-sans">{opt.label}</span>
          </label>
        ))}
      </Section>

      {/* Category */}
      <Section id="category" title="Category">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="category"
            value=""
            checked={selectedCategory === ''}
            onChange={() => onCategoryChange('')}
            className="accent-dusty-pink"
          />
          <span className="text-sm text-plum font-dm-sans">All categories</span>
        </label>
        {categories.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value={cat.slug}
              checked={selectedCategory === cat.slug}
              onChange={() => onCategoryChange(cat.slug)}
              className="accent-dusty-pink"
            />
            <span className="text-sm text-plum font-dm-sans">{cat.name}</span>
          </label>
        ))}
      </Section>

      {/* Price range (INR) */}
      <Section id="price" title="Price (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-full rounded-md border border-soft-line bg-white px-2 py-1.5 text-sm text-plum font-dm-sans focus:outline-none focus:ring-1 focus:ring-dusty-pink"
          />
          <span className="text-plum/40 text-sm">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-full rounded-md border border-soft-line bg-white px-2 py-1.5 text-sm text-plum font-dm-sans focus:outline-none focus:ring-1 focus:ring-dusty-pink"
          />
        </div>
      </Section>

      {/* Availability */}
      <Section id="availability" title="Availability">
        {AVAILABILITY_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              value={opt.value}
              checked={availability === opt.value}
              onChange={() => onAvailabilityChange(opt.value)}
              className="accent-dusty-pink"
            />
            <span className="text-sm text-plum font-dm-sans">{opt.label}</span>
          </label>
        ))}
      </Section>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Read filter state from URL
  const selectedCategory = searchParams.get('category') ?? ''
  const priceMin = searchParams.get('min') ?? ''
  const priceMax = searchParams.get('max') ?? ''
  const availability = (searchParams.get('availability') ?? 'all') as AvailabilityFilter
  const sort = (searchParams.get('sort') ?? 'newest') as SortKey

  // Helpers to update URL params
  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  const resetFilters = () => setSearchParams({})

  // Data fetching — always fetch all ACTIVE products client-side filtered
  const { data: allProducts = [], isLoading, isError } = useProducts()
  const { data: categories = [] } = useCategories()

  // Client-side filtering + sorting
  const filteredProducts = useMemo(() => {
    let result = allProducts

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.categories?.slug === selectedCategory)
    }

    // Price filter (convert ₹ to paise for comparison)
    if (priceMin) {
      const minPaise = Number(priceMin) * 100
      result = result.filter((p) => p.price_paise >= minPaise)
    }
    if (priceMax) {
      const maxPaise = Number(priceMax) * 100
      result = result.filter((p) => p.price_paise <= maxPaise)
    }

    // Availability filter
    if (availability === 'made-to-order') {
      result = result.filter((p) => p.is_made_to_order)
    } else if (availability === 'in-stock') {
      result = result.filter((p) => !p.is_made_to_order)
    }

    return sortProducts(result, sort)
  }, [allProducts, selectedCategory, priceMin, priceMax, availability, sort])

  const filterProps: FilterPanelProps = {
    categories,
    selectedCategory,
    priceMin,
    priceMax,
    availability,
    sort,
    onCategoryChange: (v) => setParam('category', v),
    onPriceMinChange: (v) => setParam('min', v),
    onPriceMaxChange: (v) => setParam('max', v),
    onAvailabilityChange: (v) => setParam('availability', v === 'all' ? '' : v),
    onSortChange: (v) => setParam('sort', v === 'newest' ? '' : v),
    onReset: resetFilters,
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-fraunces text-3xl sm:text-4xl text-plum mb-2">Shop</h1>
          <p className="font-dm-sans text-sm text-plum/60">
            Every piece is made by hand, with care.
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <p className="text-sm text-plum/60 font-dm-sans">
            {isLoading ? 'Loading…' : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-soft-line bg-white px-4 py-2 text-sm font-medium text-plum hover:border-dusty-pink transition-colors font-dm-sans"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters & Sort
          </button>
        </div>

        {/* Mobile Filter Drawer */}
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-plum/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] overflow-y-auto bg-ivory p-6 shadow-xl lg:hidden animate-slide-in-right">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-fraunces text-xl text-plum">Filters</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-2 text-plum/60 hover:bg-blush active:bg-blush/70 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterPanel {...filterProps} />
              <button
                onClick={() => setDrawerOpen(false)}
                className="mt-6 w-full rounded-full bg-plum py-3 text-sm font-medium text-ivory font-dm-sans hover:bg-plum/90 transition-colors"
              >
                Show {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {/* Layout: Sidebar + Grid */}
        <div className="flex gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-6">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {/* Count (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-plum/60 font-dm-sans">
                {isLoading ? 'Loading…' : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Error */}
            {isError && (
              <div className="rounded-xl border border-soft-line bg-blush/40 p-8 text-center">
                <p className="font-dm-sans text-sm text-plum/70">
                  Something went wrong loading products. Please refresh.
                </p>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-5xl">🌸</div>
                <h2 className="font-fraunces text-xl text-plum mb-2">
                  No products match your filters
                </h2>
                <p className="font-dm-sans text-sm text-plum/60 mb-6 max-w-xs">
                  Try adjusting or resetting your filters to see more of our handmade collection.
                </p>
                <button
                  onClick={resetFilters}
                  className="rounded-full bg-dusty-pink px-6 py-2.5 text-sm font-medium text-white hover:bg-dusty-pink/90 transition-colors font-dm-sans"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!isLoading && !isError && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
