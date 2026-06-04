import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface UserProtectedRouteProps {
  children: React.ReactNode
}

export default function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const location = useLocation()
  const { user } = useAuth()

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}
