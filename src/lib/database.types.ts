// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Supabase Database Types
// Auto-generated from schema. Run: npm run supabase:gen-types
// Manual baseline until Supabase CLI is configured.
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ─────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUND_PENDING'
  | 'REFUNDED'

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export type InventoryTransactionType =
  | 'OPENING'
  | 'PURCHASE'
  | 'PRODUCTION_USAGE'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'REVERSAL'

export type AdminRole = 'OWNER' | 'ADMIN' | 'VIEWER'

// ── Option schema (JSONB) ──────────────────────────────────────────────────────
export interface ProductOptionChoice {
  value: string
  label: string
  price_adjustment_paise?: number  // 0 means no additional charge
  available: boolean
}

export interface ProductOption {
  key: string           // e.g. "colour", "size", "note_card"
  label: string         // Display label e.g. "Colour"
  type: 'select' | 'text' | 'boolean'
  required: boolean
  choices?: ProductOptionChoice[]   // for select type
  max_length?: number               // for text type
  placeholder?: string
}

// ── Database interface ─────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          role: AdminRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          role?: AdminRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          role?: AdminRole
          is_active?: boolean
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          sku: string
          description: string | null
          price_paise: number          // price in paise (1 INR = 100 paise)
          compare_at_price_paise: number | null
          status: ProductStatus
          is_made_to_order: boolean
          production_lead_days_min: number
          production_lead_days_max: number
          options: ProductOption[] | null  // JSONB
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          sku: string
          description?: string | null
          price_paise: number
          compare_at_price_paise?: number | null
          status?: ProductStatus
          is_made_to_order?: boolean
          production_lead_days_min?: number
          production_lead_days_max?: number
          options?: ProductOption[] | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          sku?: string
          description?: string | null
          price_paise?: number
          compare_at_price_paise?: number | null
          status?: ProductStatus
          is_made_to_order?: boolean
          production_lead_days_min?: number
          production_lead_days_max?: number
          options?: ProductOption[] | null
          sort_order?: number
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string
          alt_text: string | null
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          storage_path: string
          alt_text?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          storage_path?: string
          alt_text?: string | null
          display_order?: number
          is_primary?: boolean
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string               // 10-digit Indian mobile
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_code: string          // e.g. "MNS-20241109-0001"
          idempotency_key: string
          customer_id: string
          status: OrderStatus
          payment_status: PaymentStatus
          subtotal_paise: number
          shipping_paise: number
          total_paise: number
          shipping_name: string
          shipping_phone: string
          shipping_email: string | null
          shipping_address_line1: string
          shipping_address_line2: string | null
          shipping_locality: string | null
          shipping_city: string
          shipping_district: string
          shipping_state: string
          shipping_pincode: string
          customisation_note: string | null
          internal_notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_code?: string
          idempotency_key: string
          customer_id: string
          status?: OrderStatus
          payment_status?: PaymentStatus
          subtotal_paise: number
          shipping_paise?: number
          total_paise: number
          shipping_name: string
          shipping_phone: string
          shipping_email?: string | null
          shipping_address_line1: string
          shipping_address_line2?: string | null
          shipping_locality?: string | null
          shipping_city: string
          shipping_district: string
          shipping_state: string
          shipping_pincode: string
          customisation_note?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: OrderStatus
          payment_status?: PaymentStatus
          internal_notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null    // nullable — product may be archived
          // Immutable snapshot at time of purchase:
          snapshot_product_name: string
          snapshot_sku: string
          snapshot_unit_price_paise: number
          snapshot_options: Json | null
          quantity: number
          line_total_paise: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          snapshot_product_name: string
          snapshot_sku: string
          snapshot_unit_price_paise: number
          snapshot_options?: Json | null
          quantity: number
          line_total_paise: number
          created_at?: string
        }
        Update: never  // order items are immutable
      }
      payments: {
        Row: {
          id: string
          order_id: string
          status: PaymentStatus
          amount_expected_paise: number
          amount_received_paise: number | null
          utr_reference: string | null       // UTR entered by customer (unverified)
          customer_payment_note: string | null
          submitted_at: string | null
          verified_amount_paise: number | null
          verified_reference: string | null
          verified_by: string | null          // admin_profiles.id
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status?: PaymentStatus
          amount_expected_paise: number
          amount_received_paise?: number | null
          utr_reference?: string | null
          customer_payment_note?: string | null
          submitted_at?: string | null
          verified_amount_paise?: number | null
          verified_reference?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: PaymentStatus
          amount_received_paise?: number | null
          utr_reference?: string | null
          customer_payment_note?: string | null
          submitted_at?: string | null
          verified_amount_paise?: number | null
          verified_reference?: string | null
          verified_by?: string | null
          verified_at?: string | null
          updated_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          old_status: OrderStatus | null
          new_status: OrderStatus
          changed_by: string | null       // admin_profiles.id or 'SYSTEM'
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          old_status?: OrderStatus | null
          new_status: OrderStatus
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
        Update: never  // immutable history
      }
      materials: {
        Row: {
          id: string
          name: string
          sku: string | null
          unit: string              // "pcs", "cm", "g", "ml"
          cost_per_unit_paise: number
          low_stock_threshold: number
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          unit: string
          cost_per_unit_paise: number
          low_stock_threshold?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          unit?: string
          cost_per_unit_paise?: number
          low_stock_threshold?: number
          is_active?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      product_recipes: {
        Row: {
          id: string
          product_id: string
          material_id: string
          quantity_per_unit: number    // e.g. 15 (pipe cleaners per keychain)
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          material_id: string
          quantity_per_unit: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          material_id?: string
          quantity_per_unit?: number
          notes?: string | null
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          material_id: string
          type: InventoryTransactionType
          quantity_delta: number       // positive = in, negative = out
          balance_after: number
          reference_id: string | null  // order_id, purchase_id etc.
          idempotency_key: string | null
          recorded_by: string | null   // admin_profiles.id
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          type: InventoryTransactionType
          quantity_delta: number
          balance_after: number
          reference_id?: string | null
          idempotency_key?: string | null
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: never  // ledger is append-only
      }
      expenses: {
        Row: {
          id: string
          category: string
          description: string
          amount_paise: number
          expense_date: string    // DATE
          receipt_reference: string | null
          recorded_by: string     // admin_profiles.id
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          description: string
          amount_paise: number
          expense_date: string
          receipt_reference?: string | null
          recorded_by: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          description?: string
          amount_paise?: number
          expense_date?: string
          receipt_reference?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
      }
      serviceable_pincodes: {
        Row: {
          id: string
          pincode: string
          area_name: string | null
          city: string | null
          state: string
          shipping_rate_paise: number
          estimated_days_min: number
          estimated_days_max: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pincode: string
          area_name?: string | null
          city?: string | null
          state: string
          shipping_rate_paise?: number
          estimated_days_min?: number
          estimated_days_max?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pincode?: string
          area_name?: string | null
          city?: string | null
          state?: string
          shipping_rate_paise?: number
          estimated_days_min?: number
          estimated_days_max?: number
          is_active?: boolean
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_order_tracking: {
        Args: {
          p_order_code: string
          p_phone: string
        }
        Returns: {
          order_code: string
          status: OrderStatus
          payment_status: PaymentStatus
          created_at: string
          updated_at: string
          history: Json
        }[]
      }
    }
    Enums: {
      order_status: OrderStatus
      payment_status: PaymentStatus
      product_status: ProductStatus
      inventory_transaction_type: InventoryTransactionType
      admin_role: AdminRole
    }
  }
}

// ── Convenience row types ──────────────────────────────────────────────────────
export type AdminProfileRow = Database['public']['Tables']['admin_profiles']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductImageRow = Database['public']['Tables']['product_images']['Row']
export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row']
export type MaterialRow = Database['public']['Tables']['materials']['Row']
export type ProductRecipeRow = Database['public']['Tables']['product_recipes']['Row']
export type InventoryTransactionRow = Database['public']['Tables']['inventory_transactions']['Row']
export type ExpenseRow = Database['public']['Tables']['expenses']['Row']
export type StoreSettingRow = Database['public']['Tables']['store_settings']['Row']
export type ServiceablePincodeRow = Database['public']['Tables']['serviceable_pincodes']['Row']

// ── Joined / enriched types ────────────────────────────────────────────────────
export interface ProductWithImages extends ProductRow {
  product_images: ProductImageRow[]
  categories: CategoryRow | null
}

export interface OrderWithDetails extends OrderRow {
  order_items: OrderItemRow[]
  payments: PaymentRow[]
  order_status_history: OrderStatusHistoryRow[]
  customers: CustomerRow
}
