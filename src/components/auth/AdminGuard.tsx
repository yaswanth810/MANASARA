import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { PageSpinner } from '@/components/common/PageSpinner'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { userId, adminProfile, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />

  if (!userId || !adminProfile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!adminProfile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-center max-w-sm">
          <h1 className="editorial-md text-plum mb-2">Account Inactive</h1>
          <p className="text-sm text-plum/60">
            Your admin account has been deactivated. Please contact the other founder.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
