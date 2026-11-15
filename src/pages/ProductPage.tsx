// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — /products/:slug
// Full product detail page with image gallery, options, and add-to-cart.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  AlertTriangle,
  ShoppingBag,
  Check,
  Minus,
  Plus,
} from 'lucide-react'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { PageSpinner } from '@/components/common/PageSpinner'
import { useCartStore } from '@/lib/cart-store'
import { cn, formatINR, leadTimeDisplay, getStorageUrl } from '@/lib/utils'
import type { ProductOption, ProductOptionChoice } from '@/lib/database.types'
import type { CartItemOptions } from '@/lib/cart-store'

// ── Image Gallery ─────────────────────────────────────────────────────────────

interface GalleryProps {
  images: { id: string; storage_path: string; alt_text: string | null; is_primary: boolean }[]
  productName: string
}

function ImageGallery({ images, productName }: GalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] rounded-2xl bg-blush/50 flex flex-col items-center justify-center gap-3 text-plum/30">
        <Package className="h-16 w-16" />
        <p className="font-dm-sans text-sm">Photos coming soon</p>
      </div>
    )
  }

  const activeImage = images[activeIdx]

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-blush/30 group">
        <img
          src={getStorageUrl(supabaseUrl, 'product-images', activeImage.storage_path)}
          alt={activeImage.alt_text ?? productName}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        {/* Prev/Next if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow text-plum transition-opacity hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow text-plum transition-opacity hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Image ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === activeIdx ? 'border-dusty-pink' : 'border-transparent'
              )}
            >
              <img
                src={getStorageUrl(supabaseUrl, 'product-images', img.storage_path)}
                alt={img.alt_text ?? `${productName} ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Option Renderers ──────────────────────────────────────────────────────────

interface OptionProps {
  option: ProductOption
  value: string | boolean | undefined
  onChange: (key: string, value: string | boolean) => void
  error: boolean
}

function ProductOptionField({ option, value, onChange, error }: OptionProps) {
  if (option.type === 'select') {
    const choices: ProductOptionChoice[] = option.choices ?? []
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-plum font-dm-sans">
            {option.label}
            {option.required && <span className="text-dusty-pink ml-0.5">*</span>}
          </label>
          {error && (
            <span className="text-xs text-red-500 font-dm-sans">Required</span>
          )}
        </div>
        {/* Radio chips for ≤5 choices, else select dropdown */}
        {choices.length <= 5 ? (
          <div className="flex flex-wrap gap-2">
            {choices.map((choice) => (
              <label
                key={choice.value}
                className={cn(
                  'flex items-center gap-1.5 cursor-pointer rounded-full border px-3 py-1.5 text-sm font-dm-sans transition-all',
                  !choice.available && 'opacity-40 cursor-not-allowed',
                  value === choice.value
                    ? 'border-dusty-pink bg-dusty-pink/10 text-dusty-pink font-medium'
                    : 'border-soft-line bg-white text-plum hover:border-dusty-pink'
                )}
              >
                <input
                  type="radio"
                  name={option.key}
                  value={choice.value}
                  disabled={!choice.available}
                  checked={value === choice.value}
                  onChange={() => choice.available && onChange(option.key, choice.value)}
                  className="sr-only"
                />
                {choice.label}
                {choice.price_adjustment_paise && choice.price_adjustment_paise > 0 && (
                  <span className="text-xs text-muted-leaf">
                    +{formatINR(choice.price_adjustment_paise)}
                  </span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(option.key, e.target.value)}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-plum font-dm-sans focus:outline-none focus:ring-2 focus:ring-dusty-pink',
              error ? 'border-red-400' : 'border-soft-line'
            )}
          >
            <option value="">Select {option.label.toLowerCase()}…</option>
            {choices.map((choice) => (
              <option key={choice.value} value={choice.value} disabled={!choice.available}>
                {choice.label}
                {choice.price_adjustment_paise && choice.price_adjustment_paise > 0
                  ? ` (+${formatINR(choice.price_adjustment_paise)})`
                  : ''}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  if (option.type === 'text') {
    const textValue = typeof value === 'string' ? value : ''
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-plum font-dm-sans">
          {option.label}
          {option.required && <span className="text-dusty-pink ml-0.5">*</span>}
        </label>
        <input
          type="text"
          value={textValue}
          maxLength={option.max_length}
          placeholder={option.placeholder ?? `Enter ${option.label.toLowerCase()}…`}
          onChange={(e) => onChange(option.key, e.target.value)}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-plum font-dm-sans focus:outline-none focus:ring-2 focus:ring-dusty-pink placeholder:text-plum/30',
            error ? 'border-red-400' : 'border-soft-line'
          )}
        />
        {option.max_length && (
          <p className="text-right text-xs text-plum/40 font-dm-sans">
            {textValue.length}/{option.max_length}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 font-dm-sans">This field is required</p>
        )}
      </div>
    )
  }

  if (option.type === 'boolean') {
    return (
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(option.key, e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-dusty-pink"
        />
        <span className="text-sm text-plum font-dm-sans">
          {option.label}
          {option.required && <span className="text-dusty-pink ml-0.5">*</span>}
        </span>
      </label>
    )
  }

  return null
}

// ── Related Products ──────────────────────────────────────────────────────────

interface RelatedProps {
  categorySlug: string | null | undefined
  currentProductId: string
}

function RelatedProducts({ categorySlug, currentProductId }: RelatedProps) {
  const { data: allProducts = [], isLoading } = useProducts()

  const related = useMemo(
    () =>
      allProducts
        .filter((p) => p.id !== currentProductId && p.categories?.slug === categorySlug)
        .slice(0, 4),
    [allProducts, currentProductId, categorySlug]
  )

  if (!categorySlug || (!isLoading && related.length === 0)) return null

  return (
    <section className="border-t border-soft-line pt-12 mt-12">
      <h2 className="font-fraunces text-2xl text-plum mb-6">You might also like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : related.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: product, isLoading, isError } = useProduct(slug)
  const addItem = useCartStore((s) => s.addItem)

  // Selected options state: { [key]: value }
  const [selectedOptions, setSelectedOptions] = useState<CartItemOptions>({})
  const [quantity, setQuantity] = useState(1)
  const [optionErrors, setOptionErrors] = useState<Record<string, boolean>>({})
  const [addedToCart, setAddedToCart] = useState(false)

  const handleOptionChange = (key: string, value: string | boolean) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }))
    setOptionErrors((prev) => ({ ...prev, [key]: false }))
  }

  // Calculate total price including option adjustments
  const totalPricePaise = useMemo(() => {
    if (!product) return 0
    let total = product.price_paise
    if (product.options) {
      for (const opt of product.options) {
        if (opt.type === 'select' && opt.choices) {
          const selectedVal = selectedOptions[opt.key]
          const choice = opt.choices.find((c) => c.value === selectedVal)
          if (choice?.price_adjustment_paise) {
            total += choice.price_adjustment_paise
          }
        }
      }
    }
    return total
  }, [product, selectedOptions])

  const handleAddToCart = () => {
    if (!product) return

    // Validate required options
    const errors: Record<string, boolean> = {}
    let hasError = false
    for (const opt of product.options ?? []) {
      if (opt.required) {
        const val = selectedOptions[opt.key]
        if (val === undefined || val === '' || val === null) {
          errors[opt.key] = true
          hasError = true
        }
      }
    }
    if (hasError) {
      setOptionErrors(errors)
      return
    }

    const primaryImage = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0]

    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPricePaise: totalPricePaise,
      quantity,
      selectedOptions,
      options: product.options,
      imagePath: primaryImage?.storage_path ?? null,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) return <PageSpinner />

  // ── Error / Not Found ───────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-5xl">🌸</div>
        <h1 className="font-fraunces text-3xl text-plum mb-3">Product not found</h1>
        <p className="font-dm-sans text-sm text-plum/60 mb-8">
          This product may have been removed or the link is incorrect.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-dusty-pink px-6 py-3 text-sm font-medium text-white hover:bg-dusty-pink/90 transition-colors font-dm-sans"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>
    )
  }

  // Sort images: primary first, then by display_order
  const sortedImages = [...(product.product_images ?? [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.display_order - b.display_order
  })

  const isOnSale =
    product.compare_at_price_paise && product.compare_at_price_paise > product.price_paise

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-dm-sans text-plum/50">
            <li><Link to="/" className="hover:text-plum transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/shop" className="hover:text-plum transition-colors">Shop</Link></li>
            {product.categories && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    to={`/collections/${product.categories.slug}`}
                    className="hover:text-plum transition-colors"
                  >
                    {product.categories.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-plum font-medium truncate max-w-[12rem]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Left — Image Gallery */}
          <div>
            <ImageGallery images={sortedImages} productName={product.name} />
          </div>

          {/* Right — Product info + actions */}
          <div className="flex flex-col gap-6">
            {/* Category label */}
            {product.categories && (
              <Link
                to={`/collections/${product.categories.slug}`}
                className="text-xs font-medium uppercase tracking-wider text-muted-leaf hover:text-dusty-pink transition-colors font-dm-sans w-fit"
              >
                {product.categories.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="font-fraunces text-3xl sm:text-4xl text-plum leading-tight">
              {product.name}
            </h1>

            {/* Draft notice */}
            {product.status === 'DRAFT' && (
              <div className="flex items-start gap-2 rounded-xl bg-butter-yellow/20 border border-butter-yellow/40 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-butter-yellow shrink-0 mt-0.5" />
                <p className="text-xs font-dm-sans text-plum/80">
                  <span className="font-semibold">Draft product</span> — Prices and details are not
                  yet confirmed. This listing is a preview.
                </p>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-fraunces text-2xl text-plum">
                {formatINR(totalPricePaise)}
              </span>
              {isOnSale && product.compare_at_price_paise && (
                <span className="font-dm-sans text-base text-plum/40 line-through">
                  {formatINR(product.compare_at_price_paise)}
                </span>
              )}
              {isOnSale && (
                <span className="inline-flex items-center rounded-full bg-dusty-pink px-2.5 py-0.5 text-xs font-medium text-white font-dm-sans">
                  Sale
                </span>
              )}
            </div>

            {/* Lead time */}
            <div className="flex items-center gap-2 text-sm text-muted-leaf font-dm-sans">
              <Clock className="h-4 w-4 shrink-0" />
              {product.is_made_to_order ? (
                <span>
                  Made to order · Ships in{' '}
                  {leadTimeDisplay(
                    product.production_lead_days_min,
                    product.production_lead_days_max
                  )}
                </span>
              ) : (
                <span>Ready to ship</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="font-dm-sans text-sm leading-relaxed text-plum/70 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-soft-line" />

            {/* Options */}
            {(product.options ?? []).length > 0 && (
              <div className="space-y-5">
                {(product.options ?? []).map((opt) => (
                  <ProductOptionField
                    key={opt.key}
                    option={opt}
                    value={selectedOptions[opt.key]}
                    onChange={handleOptionChange}
                    error={!!optionErrors[opt.key]}
                  />
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-plum font-dm-sans">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-soft-line bg-white text-plum hover:border-dusty-pink active:bg-blush/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-plum font-dm-sans">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-soft-line bg-white text-plum hover:border-dusty-pink active:bg-blush/40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-medium transition-all duration-300 font-dm-sans',
                addedToCart
                  ? 'bg-muted-leaf text-white'
                  : 'bg-plum text-ivory hover:bg-plum/90 active:scale-[0.98]'
              )}
            >
              {addedToCart ? (
                <>
                  <Check className="h-4 w-4" />
                  Added to cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Add to cart — {formatINR(totalPricePaise * quantity)}
                </>
              )}
            </button>

            {/* Quick links */}
            <div className="flex items-center justify-between text-xs text-plum/50 font-dm-sans">
              <Link to="/cart" className="hover:text-dusty-pink transition-colors underline underline-offset-2">
                View cart
              </Link>
              <Link to="/contact" className="hover:text-dusty-pink transition-colors underline underline-offset-2">
                Questions? Contact us
              </Link>
            </div>

            {/* Price note */}
            <p className="text-xs text-plum/40 font-dm-sans">
              Prices will be verified at checkout. Final price may vary by selected options.
            </p>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts
          categorySlug={product.categories?.slug}
          currentProductId={product.id}
        />
      </div>
    </div>
  )
}
