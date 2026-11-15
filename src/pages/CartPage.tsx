import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { formatINR, cn } from '@/lib/utils'

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore()
  const subtotalPaise = items.reduce((s, i) => s + i.unitPricePaise * i.quantity, 0)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-content mx-auto section-padding py-20 text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blush mb-6">
          <ShoppingBag className="h-9 w-9 text-dusty-pink" />
        </div>
        <h1 className="editorial-md text-plum mb-3">Your cart is empty</h1>
        <p className="text-plum/60 font-dm-sans mb-8">
          You haven't added anything yet. Browse the collection to find something special.
        </p>
        <Link to="/shop" className="btn-primary">
          Explore products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto section-padding py-8 sm:py-12">
      <h1 className="editorial-lg text-plum mb-8">
        Your Cart <span className="text-plum/40 text-2xl font-dm-sans font-normal">({itemCount})</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => {
            const lineTotal = item.unitPricePaise * item.quantity
            const optionsSummary = Object.entries(item.selectedOptions)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' · ')

            return (
              <div key={idx} className="card-surface p-4 flex gap-4">
                {/* Product image */}
                <div className="h-20 w-20 rounded-sm bg-blush/60 flex items-center justify-center shrink-0 overflow-hidden">
                  <Package className="h-7 w-7 text-plum/30" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium font-dm-sans text-plum line-clamp-2">
                        {item.productName}
                      </h3>
                      {optionsSummary && (
                        <p className="text-xs text-plum/50 mt-0.5 font-dm-sans">{optionsSummary}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.selectedOptions)}
                      className="text-plum/30 hover:text-red-500 active:text-red-600 transition-colors p-2 shrink-0 -mr-1"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-soft-line rounded-sm">
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedOptions, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-10 w-10 flex items-center justify-center text-plum/60 hover:text-plum disabled:opacity-30 transition-colors active:bg-blush/50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="h-10 w-10 flex items-center justify-center text-sm font-dm-sans text-plum">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedOptions, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                        className="h-10 w-10 flex items-center justify-center text-plum/60 hover:text-plum disabled:opacity-30 transition-colors active:bg-blush/50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-plum font-dm-sans">
                        {formatINR(lineTotal)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-plum/40 font-dm-sans">
                          {formatINR(item.unitPricePaise)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card-surface p-5 sticky top-24">
            <h2 className="editorial-sm text-plum mb-4">Order Summary</h2>

            <div className="space-y-2 pb-4 border-b border-soft-line">
              <div className="flex justify-between text-sm font-dm-sans text-plum/70">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span>{formatINR(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-sm font-dm-sans text-plum/50">
                <span>Shipping</span>
                <span className="italic">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between font-medium text-plum py-3 border-b border-soft-line mb-4">
              <span className="font-dm-sans">Estimated Total</span>
              <span className="font-fraunces text-lg">{formatINR(subtotalPaise)}</span>
            </div>

            {/* Important notice */}
            <div className="bg-blush/50 rounded-sm p-3 mb-4">
              <p className="text-xs text-plum/70 font-dm-sans leading-relaxed">
                <strong className="font-medium">Note:</strong> Prices and availability are verified at checkout.
                Shipping charges depend on your delivery location.
              </p>
            </div>

            <Link to="/checkout" className="btn-primary w-full justify-center">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <Link to="/shop" className="block text-center text-sm font-dm-sans text-plum/50 hover:text-plum mt-3 transition-colors">
              Continue shopping
            </Link>

            {/* Made to order note */}
            <div className="mt-4 pt-4 border-t border-soft-line flex gap-2">
              <Package className="h-4 w-4 text-muted-leaf shrink-0 mt-0.5" />
              <p className="text-xs text-plum/50 font-dm-sans">
                All pieces are handmade to order. Production begins after payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
