import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/errors'
import { homePathFor, useAuth } from '@/auth/AuthContext'
import { clearLogoutReason, peekLogoutReason } from '@/auth/session'
import { Button } from '@/components/Button'
import { Field, FormError } from '@/components/Field'
import { AuthLayout } from './AuthLayout'

const PHONE_PATTERN = /^[6-9]\d{9}$/

export default function Login() {
  const { t } = useTranslation()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [errors, setErrors] = useState({})
  // Why the user was just logged out ('idle' or 'expired'); shown once, then forgotten
  const [endedReason] = useState(peekLogoutReason)
  useEffect(() => clearLogoutReason(), [])

  const login = useMutation({
    mutationFn: (body) => api.post('/auth/login', body).then((res) => res.data),
    onSuccess: (data) => {
      signIn(data)
      navigate(location.state?.from ?? homePathFor(data.user), { replace: true }) // wrong-role pages bounce to their own home
    },
  })

  if (user) return <Navigate to={homePathFor(user)} replace />

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!PHONE_PATTERN.test(form.phone.trim())) next.phone = t('errors.phoneInvalid')
    if (!form.password) next.password = t('errors.passwordRequired')
    setErrors(next)
    if (Object.keys(next).length === 0) login.mutate({ phone: form.phone.trim(), password: form.password })
  }

  return (
    <AuthLayout>
      <h2 className="text-[32px] leading-tight text-ink">{t('auth.loginTitle')}</h2>
      <p className="mt-2 text-[15px] text-muted">{t('auth.loginSubtitle')}</p>
      {location.state?.passwordReset && (
        <p role="status" className="mt-5 rounded-xl bg-sage px-4 py-3 text-sm font-medium text-forest">
          {t('account.resetDone')}
        </p>
      )}
      {endedReason && (
        <p role="status" className="mt-5 rounded-xl bg-amber-soft px-4 py-3 text-sm font-medium text-amber">
          {endedReason === 'idle' ? t('auth.sessionIdle') : t('errors.sessionExpired')}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-9 space-y-5">
        <Field
          label={t('auth.phone')}
          hint={t('auth.phoneHint')}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="9876543210"
          value={form.phone}
          onChange={update('phone')}
          error={errors.phone}
        />
        <Field
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-forest underline-offset-4 hover:underline">
            {t('account.forgotLink')}
          </Link>
        </div>
        <FormError message={login.isError ? errorMessage(login.error, t) : null} />
        <Button type="submit" className="w-full" loading={login.isPending}>
          {login.isPending ? t('auth.loggingIn') : t('auth.login')}
        </Button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        {t('auth.newHere')}{' '}
        <Link to="/signup" className="font-semibold text-forest underline-offset-4 hover:underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </AuthLayout>
  )
}
