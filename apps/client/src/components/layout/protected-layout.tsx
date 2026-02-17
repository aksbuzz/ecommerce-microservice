import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useCurrentUser } from '@/hooks/use-auth'

export function ProtectedLayout() {
  const { data: user, isLoading } = useCurrentUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <Outlet />
}
