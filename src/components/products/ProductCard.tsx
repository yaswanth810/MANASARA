import { Link } from 'react-router-dom'
import { formatINR } from '@/lib/utils'
import { getStorageUrl } from '@/lib/utils'
import type { ProductWithImages } from '@/lib/database.types'

/** Soft chenille-doll placeholder — shown when no product photo exists yet */
function DollPlaceholder() {
  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-20 opacity-60">
      {/* Body */}
      <rect x="22" y="48" width="36" height="38" rx="8" fill="#D98C9E" opacity="0.4"/>
      {/* Head */}
      <ellipse cx="40" cy="36" rx="16" ry="15" fill="#F5CBA7" opacity="0.7"/>
      {/* Hair */}
      <ellipse cx="40" cy="24" rx="17" ry="10" fill="#5C3317" opacity="0.5"/>
      <circle cx="25" cy="28" r="8" fill="#5C3317" opacity="0.5"/>
      <circle cx="55" cy="28" r="8" fill="#5C3317" opacity="0.5"/>
      {/* Eyes */}
      <circle cx="35" cy="37" r="2" fill="#2D1B0E" opacity="0.6"/>
      <circle cx="45" cy="37" r="2" fill="#2D1B0E" opacity="0.6"/>
      {/* Blush */}
      <ellipse cx="31" cy="41" rx="4" ry="2.5" fill="#E8A598" opacity="0.4"/>
      <ellipse cx="49" cy="41" rx="4" ry="2.5" fill="#E8A598" opacity="0.4"/>
      {/* Smile */}
      <path d="M36 44 Q40 47 44 44" stroke="#C47A6E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      {/* Sparkle */}
      <text x="58" y="20" fontSize="8" fill="#E8C77B" opacity="0.6">✦</text>
    </svg>
  )
}

interface ProductCardProps {
  product: ProductWithImages
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

  const isOnSale = product.compare_at_price_paise && product.compare_at_price_paise > product.price_paise

  return (
    <Link
      to={`/products/${product.slug}`}
      className="product-card group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-pink active:scale-[0.98] transition-transform duration-150"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-blush/50">
        {primaryImage ? (
          <img
            src={getStorageUrl(supabaseUrl, 'product-images', primaryImage.storage_path)}
            alt={primaryImage.alt_text ?? product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-blush/30">
            <DollPlaceholder />
            <p className="text-[10px] font-dm-sans text-plum/40 text-center px-4">Photo coming soon</p>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.status === 'DRAFT' && (
            <span className="badge-draft text-[10px]">Draft</span>
          )}
          {isOnSale && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-dusty-pink text-white">
              Sale
            </span>
          )}
          {product.is_made_to_order && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-plum/80 text-ivory">
              Made to order
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <p className="text-xs font-dm-sans text-muted-leaf mb-1 truncate">
          {product.categories?.name ?? 'Handmade'}
        </p>
        <h3 className="text-sm sm:text-base font-medium text-plum line-clamp-2 mb-2 font-dm-sans leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-semibold text-plum font-dm-sans">
            {formatINR(product.price_paise)}
          </span>
          {isOnSale && product.compare_at_price_paise && (
            <span className="text-xs text-plum/40 line-through font-dm-sans">
              {formatINR(product.compare_at_price_paise)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
