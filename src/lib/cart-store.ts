// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Cart store (localStorage-backed)
// Server-side price revalidation happens at checkout via Edge Function.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductOption } from './database.types'

export interface CartItemOptions {
  [key: string]: string | boolean
}

export interface CartItem {
  /** Product ID from the database */
  productId: string
  /** Display snapshot (can be stale until server revalidation) */
  productName: string
  sku: string
  /** Price in paise at time of add-to-cart */
  unitPricePaise: number
  quantity: number
  selectedOptions: CartItemOptions
  /** Available options definition for display */
  options: ProductOption[] | null
  /** Primary image storage path */
  imagePath: string | null
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, selectedOptions: CartItemOptions) => void
  updateQuantity: (productId: string, selectedOptions: CartItemOptions, quantity: number) => void
  clearCart: () => void
  itemCount: number
  subtotalPaise: number
}

function optionsKey(opts: CartItemOptions): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)))
  )
}

function findItemIndex(items: CartItem[], productId: string, selectedOptions: CartItemOptions): number {
  const key = optionsKey(selectedOptions)
  return items.findIndex(
    (i) => i.productId === productId && optionsKey(i.selectedOptions) === key
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const qty = item.quantity ?? 1
          const idx = findItemIndex(state.items, item.productId, item.selectedOptions)
          if (idx !== -1) {
            const updated = [...state.items]
            updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty }
            return { items: updated }
          }
          return { items: [...state.items, { ...item, quantity: qty }] }
        })
      },

      removeItem: (productId, selectedOptions) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && optionsKey(i.selectedOptions) === optionsKey(selectedOptions))
          ),
        }))
      },

      updateQuantity: (productId, selectedOptions, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, selectedOptions)
          return
        }
        set((state) => {
          const idx = findItemIndex(state.items, productId, selectedOptions)
          if (idx === -1) return state
          const updated = [...state.items]
          updated[idx] = { ...updated[idx], quantity }
          return { items: updated }
        })
      },

      clearCart: () => set({ items: [] }),

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get subtotalPaise() {
        return get().items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0)
      },
    }),
    {
      name: 'manasara-cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
