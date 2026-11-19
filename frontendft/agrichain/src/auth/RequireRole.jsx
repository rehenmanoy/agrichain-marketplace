import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/Loader'
import { homePathFor, useAuth } from './AuthContext'

/** Only lets users with the given role through; others go to login, or back to their own home */
export function RequireRole({ role }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
