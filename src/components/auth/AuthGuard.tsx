// E:/MANASARA/src/components/auth/AuthGuard.tsx
// Route guard for pages that require an authenticated customer session.
// If the user is not logged in, they are redirected to /login with a `next`
// param so they can be returned to the intended page after sign-in.

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageSpinner } from '@/components/common/PageSpinner'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />

  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return <>{children}</>
}
