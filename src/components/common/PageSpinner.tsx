import { Loader2 } from 'lucide-react'

export function PageSpinner() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-ivory z-50"
      aria-label="Loading"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-dusty-pink" />
        <p className="text-sm font-dm-sans text-plum/50">Loading…</p>
      </div>
    </div>
  )
}
