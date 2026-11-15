import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ManasaraLogo } from '@/components/brand/ManasaraLogo'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center section-padding py-16">
      <ManasaraLogo variant="dark" className="h-8 w-auto mb-8 opacity-40" />
      <p className="label-sm text-dusty-pink mb-3">404 — Page not found</p>
      <h1 className="editorial-xl text-plum mb-4">We couldn't find that page.</h1>
      <p className="text-plum/60 font-dm-sans max-w-md mb-8">
        It may have moved, been removed, or the link might be wrong.
        Browse the collection or head back home.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <Link to="/shop" className="btn-secondary">Browse all products</Link>
      </div>
    </div>
  )
}
