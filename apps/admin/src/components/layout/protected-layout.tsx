import { Navigate, Outlet } from 'react-router-dom'
import { FullPageSpinner } from '@/components/shared/loading-spinner'
import { useCurrentUser } from '@/hooks/use-auth'

export function ProtectedLayout() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
