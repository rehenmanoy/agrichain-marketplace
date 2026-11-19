import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, InfoIcon } from '@phosphor-icons/react'
import { useAuth, homePathFor } from '@/auth/AuthContext'
import { useForgotPassword, useResetPassword } from '@/api/account'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/Button'
import { Field, FormError } from '@/components/Field'
import { AuthLayout } from './AuthLayout'

const PHONE_PATTERN = /^[6-9]\d{9}$/

/** Forgot password: ask for a code by phone, then use it to choose a new password */
export default function ForgotPassword() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const ask = useForgotPassword()
  const reset = useResetPassword()

  const [phone, setPhone] = useState('')
  const [asked, setAsked] = useState(false)
  const [form, setForm] = useState({ code: '', next: '', again: '' })
  const [errors, setErrors] = useState({})

  if (user) return <Navigate to={homePathFor(user)} replace />

  const sendCode = (e) => {
    e.preventDefault()
    if (!PHONE_PATTERN.test(phone.trim())) {
      setErrors({ phone: t('errors.phoneInvalid') })
      return
    }
    setErrors({})
    ask.mutate({ phone: phone.trim() }, { onSuccess: () => setAsked(true) })
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!/^\d{6}$/.test(form.code.trim())) next.code = t('account.codeInvalid')
    if (form.next.length < 8) next.next = t('errors.passwordShort')
    if (form.again !== form.next) next.again = t('account.passwordsDiffer')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    reset.mutate(
      { phone: phone.trim(), code: form.code.trim(), new_password: form.next },
      { onSuccess: () => navigate('/login', { replace: true, state: { passwordReset: true } }) },
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-[32px] leading-tight text-ink">{t('account.forgotTitle')}</h2>
      <p className="mt-2 text-[15px] text-muted">{asked ? t('account.forgotCodeSubtitle', { phone }) : t('account.forgotSubtitle')}</p>

      {!asked ? (
        <form onSubmit={sendCode} noValidate className="mt-9 space-y-5">
          <Field
            label={t('auth.phone')}
            hint={t('auth.phoneHint')}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="9876543210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setErrors({})
            }}
            error={errors.phone}
          />
          <FormError message={ask.isError ? errorMessage(ask.error, t) : null} />
          <Button type="submit" className="w-full" loading={ask.isPending}>
            {ask.isPending ? t('account.sendingCode') : t('account.sendCode')}
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} noValidate className="mt-9 space-y-5">
          {/* Until an SMS service is connected the code is shown here, so the flow can be tried */}
          {ask.data?.dev_code && (
            <div role="status" className="flex gap-3 rounded-xl bg-amber-soft px-4 py-3.5 text-sm text-amber">
              <InfoIcon size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                {t('account.devCode')} <span className="font-mono text-base font-bold tracking-widest">{ask.data.dev_code}</span>
              </p>
            </div>
          )}
          <Field
            label={t('account.code')}
            hint={t('account.codeHint')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={form.code}
            onChange={set('code')}
            error={errors.code}
          />
          <Field
            label={t('account.newPassword')}
            hint={t('auth.passwordHint')}
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={set('next')}
            error={errors.next}
          />
          <Field
            label={t('account.repeatPassword')}
            type="password"
            autoComplete="new-password"
            value={form.again}
            onChange={set('again')}
            error={errors.again}
          />
          <FormError message={reset.isError ? errorMessage(reset.error, t) : null} />
          <Button type="submit" className="w-full" loading={reset.isPending}>
            {reset.isPending ? t('owner.form.saving') : t('account.changePassword')}
          </Button>
          <button
            type="button"
            onClick={() => {
              setAsked(false)
              setForm({ code: '', next: '', again: '' })
              reset.reset()
            }}
            className="text-sm font-medium text-forest underline-offset-4 hover:underline"
          >
            {t('account.askAgain')}
          </button>
        </form>
      )}

      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-4 hover:underline">
          <ArrowLeftIcon size={14} aria-hidden="true" />
          {t('account.backToLogin')}
        </Link>
      </p>
    </AuthLayout>
  )
}
