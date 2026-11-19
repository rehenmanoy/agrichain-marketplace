import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api, clearToken, fetchJson, getToken, isConnectionError, saveToken, setUnauthorizedHandler } from '@/lib/api'
import { ConfirmDialog } from '@/components/Dialogs'
import { AuthContext } from './AuthContext'
import { clearLogoutReason, setLogoutReason, touchActivity } from './session'
import { useSessionTimers } from './useSessionTimers'

export function AuthProvider({ children }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [token, setToken] = useState(getToken)

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => fetchJson('/auth/me'),
    enabled: Boolean(token),
    staleTime: Infinity,
    retry: false,
  })

  /** reason ('idle' or 'expired') is shown once on the login page; a button click passes none */
  const logout = useCallback(
    (reason) => {
      if (typeof reason === 'string') setLogoutReason(reason)
      clearToken()
      setToken(null)
      queryClient.clear()
    },
    [queryClient],
  )

  /** Called with the { token, user } returned by login, register or a token renewal */
  const signIn = useCallback(
    ({ token: newToken, user }) => {
      clearLogoutReason()
      saveToken(newToken)
      queryClient.setQueryData(['me', newToken], user)
      setToken(newToken)
    },
    [queryClient],
  )

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // A fresh login counts as activity
  const startedSession = Boolean(token && me.data)
  useEffect(() => {
    if (startedSession) touchActivity()
  }, [startedSession])

  const renew = useCallback(() => {
    // A failed renewal needs no handling: a 401 logs out through the shared handler, and a lost
    // connection is retried at the next renewal
    api
      .post('/auth/refresh')
      .then((res) => signIn(res.data))
      .catch(() => {})
  }, [signIn])

  const { secondsLeft, stay } = useSessionTimers({
    enabled: startedSession,
    onIdle: () => logout('idle'),
    onRenew: renew,
  })

  const value = useMemo(
    () => ({
      user: token ? (me.data ?? null) : null,
      // While the server can't be reached we don't know who this is: wait (the 404 page takes over) instead of sending them to login
      isLoading: Boolean(token) && (me.isPending || (me.isError && isConnectionError(me.error))),
      signIn,
      logout,
    }),
    [token, me.data, me.isPending, me.isError, me.error, signIn, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={startedSession && secondsLeft !== null}
        onClose={stay}
        onConfirm={stay}
        onCancel={() => logout('idle')}
        tone="primary"
        title={t('auth.idleWarningTitle')}
        body={t('auth.idleWarningBody', { seconds: secondsLeft ?? 0 })}
        confirmLabel={t('auth.stay')}
        cancelLabel={t('auth.logoutNow')}
      />
    </AuthContext.Provider>
  )
}
