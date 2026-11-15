// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — /collections/:slug
// Collection detail page — products filtered by category.
// ─────────────────────────────────────────────────────────────────────────────

import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import type { CategoryRow } from '@/lib/database.types'

export default function CollectionPage() {
  const { slug = '' } = useParams<{ slug: string }>()

  // Fetch all products + categories
  const { data: allProducts = [], isLoading, isError } = useProducts()
  const { data: categories = [], isLoading: catsLoading } = useCategories()

  // Resolve category metadata from categories list
  const category: CategoryRow | undefined = categories.find((c) => c.slug === slug)

  // Filter products by category slug
  const products = allProducts.filter((p) => p.categories?.slug === slug)

  // 404-equivalent: once categories have loaded and there's no match
  const notFound = !catsLoading && !category

  if (notFound) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">🌸</div>
          <h1 className="font-fraunces text-3xl text-plum mb-3">Collection not found</h1>
          <p className="font-dm-sans text-sm text-plum/60 mb-8">
            We couldn't find a collection called "{slug}".
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-dusty-pink px-6 py-3 text-sm font-medium text-white hover:bg-dusty-pink/90 transition-colors font-dm-sans"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Collection Hero */}
      <div className="bg-blush/40 border-b border-soft-line">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs font-dm-sans text-plum/50">
              <li>
                <Link to="/" className="hover:text-plum transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/shop" className="hover:text-plum transition-colors">Shop</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-plum font-medium" aria-current="page">
                {catsLoading ? '…' : (category?.name ?? slug)}
              </li>
            </ol>
          </nav>

          {/* Title + description */}
          {catsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-9 w-56 rounded-lg bg-soft-line" />
              <div className="h-4 w-80 rounded bg-soft-line" />
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dusty-pink/20">
                <Layers className="h-5 w-5 text-dusty-pink" />
              </div>
              <div>
                <h1 className="font-fraunces text-3xl sm:text-4xl text-plum mb-2">
                  {category?.name}
                </h1>
                {category?.description && (
                  <p className="font-dm-sans text-sm text-plum/70 max-w-prose">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Product count */}
        {!isLoading && !isError && (
          <p className="text-sm text-plum/60 font-dm-sans mb-6">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-soft-line bg-blush/40 p-8 text-center">
            <p className="font-dm-sans text-sm text-plum/70">
              Something went wrong loading products. Please refresh.
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">🌱</div>
            <h2 className="font-fraunces text-xl text-plum mb-2">
              Nothing here yet
            </h2>
            <p className="font-dm-sans text-sm text-plum/60 mb-6 max-w-xs">
              We're working on adding products to this collection. Check back soon!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-soft-line bg-white px-6 py-2.5 text-sm font-medium text-plum hover:border-dusty-pink transition-colors font-dm-sans"
            >
              <ArrowLeft className="h-4 w-4" />
              Explore all products
            </Link>
          </div>
        )}

        {/* Products */}
        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
