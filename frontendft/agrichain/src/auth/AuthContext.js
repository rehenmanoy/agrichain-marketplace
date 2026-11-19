import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}

// Where each role lands after logging in. When a role's pages are built, point it at them here
// (and guard those routes with RequireRole); until then it gets the "coming soon" page.
const ROLE_HOME = {
  FARMER: '/farmer',
  BUYER: '/buyer',
  WAREHOUSE_OWNER: '/owner',
  DELIVERY_PARTNER: '/partner',
}

/** Where a logged-in user lands */
export function homePathFor(user) {
  return ROLE_HOME[user?.role] ?? '/coming-soon'
}
