import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/Loader'
import { useAuth } from './AuthContext'

/** Lets any signed-in user through (pages shared by every role, like the account page); others go to login */
export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
