import { AuthSessionBoundary } from '../features/auth/AuthSessionBoundary'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface UserProtectedRouteProps {
  children: React.ReactNode
}

export default function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const location = useLocation()
  const { user, authError } = useAuth()

  // Redirect to login if not authenticated
  if (!user && !authError) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <AuthSessionBoundary>{children}</AuthSessionBoundary>
}
