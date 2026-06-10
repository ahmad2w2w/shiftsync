import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface Props {
  requireOrg?: boolean
}

export function ProtectedRoute({ requireOrg = true }: Props) {
  const { session, loading, needsOnboarding } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated but has no org yet
  if (needsOnboarding && requireOrg) {
    return <Navigate to="/onboarding" replace />
  }

  // Already has org but tries to access onboarding
  if (!needsOnboarding && !requireOrg) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
