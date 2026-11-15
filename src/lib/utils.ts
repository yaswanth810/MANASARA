// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format paise to INR display string.
 * Uses Indian number formatting (lakhs/crores).
 * @param paise - Amount in paise (integer)
 * @returns Formatted string like "₹1,299"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Format paise to compact INR (no symbol variant)
 */
export function formatINRCompact(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Convert rupees (number) to paise for storage
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees for display/computation
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Validate Indian mobile number (10 digits, starts with 6-9)
 */
export function isValidIndianMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+()]/g, '').replace(/^91/, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

/**
 * Normalise Indian mobile number to 10-digit format
 */
export function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-+()]/g, '').replace(/^91/, '').slice(-10)
}

/**
 * Validate Indian 6-digit PIN code
 */
export function isValidPincode(pin: string): boolean {
  return /^[1-9]\d{5}$/.test(pin.trim())
}

/**
 * Generate a human-readable order code
 * Format: MNS-YYYYMMDD-XXXX (server-side generation preferred)
 */
export function generateOrderCode(sequence: number): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(4, '0')
  return `MNS-${dateStr}-${seq}`
}

/**
 * Slugify a string for URL use
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format a date to readable string
 */
export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(d)
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Delay (for optimistic UI / loading states)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * cn — merge Tailwind class names
 * Re-exported from clsx + tailwind-merge
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Get public URL for a Supabase Storage file
 */
export function getStorageUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Order status display label
 */
export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AWAITING_PAYMENT: 'Awaiting Payment',
    CONFIRMED: 'Confirmed',
    IN_PRODUCTION: 'In Production',
    READY: 'Ready to Ship',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return labels[status] ?? status
}

/**
 * Payment status display label
 */
export function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Payment Pending',
    SUBMITTED: 'Payment Submitted',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    REFUND_PENDING: 'Refund Pending',
    REFUNDED: 'Refunded',
  }
  return labels[status] ?? status
}

/**
 * Lead time display
 */
export function leadTimeDisplay(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return `${minDays} day${minDays === 1 ? '' : 's'}`
  return `${minDays}–${maxDays} days`
}
