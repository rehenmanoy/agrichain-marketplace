import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BasketIcon, CheckCircleIcon, MapPinIcon, PlantIcon, TruckIcon, WarehouseIcon } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { errorMessage, fieldErrors } from '@/lib/errors'
import { homePathFor, useAuth } from '@/auth/AuthContext'
import { useRegions } from '@/api/catalog'
import { Button } from '@/components/Button'
import { Field, FormError } from '@/components/Field'
import { AuthLayout } from './AuthLayout'

const PHONE_PATTERN = /^[6-9]\d{9}$/

// The role is chosen here, when the account is created; login is the same for everyone
const ROLE_OPTIONS = [
  { role: 'FARMER', Icon: PlantIcon },
  { role: 'BUYER', Icon: BasketIcon },
  { role: 'WAREHOUSE_OWNER', Icon: WarehouseIcon },
  { role: 'DELIVERY_PARTNER', Icon: TruckIcon },
]

export default function Signup() {
  const { t } = useTranslation()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const regions = useRegions()
  const [form, setForm] = useState({ role: 'FARMER', name: '', phone: '', password: '', region_id: null, base_location: '' })
  const [errors, setErrors] = useState({})

  const register = useMutation({
    mutationFn: (body) => api.post('/auth/register', body).then((res) => res.data),
    onSuccess: (data) => {
      signIn(data)
      navigate(homePathFor(data.user), { replace: true })
    },
    onError: (error) => setErrors(fieldErrors(error)),
  })

  if (user) return <Navigate to={homePathFor(user)} replace />

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((errs) => ({ ...errs, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (form.name.trim().length < 2) next.name = t('errors.nameShort')
    if (!PHONE_PATTERN.test(form.phone.trim())) next.phone = t('errors.phoneInvalid')
    if (form.password.length < 8) next.password = t('errors.passwordShort')
    if (!form.region_id) next.region_id = t('errors.pickRegion')
    if (!form.base_location.trim()) next.base_location = t('errors.placeRequired')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    register.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: form.role,
      region_id: form.region_id,
      base_location: form.base_location.trim(),
    })
  }

  // Field-specific errors are shown under the fields; anything else goes in the banner
  const bannerError =
    register.isError && Object.keys(fieldErrors(register.error)).length === 0 ? errorMessage(register.error, t) : null

  return (
    <AuthLayout>
      <h2 className="text-[32px] leading-tight text-ink">{t('auth.signupTitle')}</h2>
      <p className="mt-2 text-[15px] text-muted">{t('auth.signupSubtitle')}</p>

      <form onSubmit={submit} noValidate className="mt-9 space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-ink">{t('auth.roleLabel')}</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map(({ role, Icon }) => {
              const selected = form.role === role
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('role', role)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    selected ? 'border-forest bg-sage' : 'border-line bg-white hover:border-leaf'
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      selected ? 'bg-forest text-white' : 'bg-sage text-leaf'
                    }`}
                  >
                    <Icon size={18} weight="bold" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[15px] font-semibold ${selected ? 'text-forest' : 'text-ink'}`}>
                      {t(`auth.roles.${role}.title`)}
                    </span>
                    <span className="block text-[13px] leading-snug text-muted">{t(`auth.roles.${role}.body`)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <Field
          label={t('auth.name')}
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />
        <Field
          label={t('auth.phone')}
          hint={t('auth.phoneHint')}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="9876543210"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone}
        />
        <Field
          label={t('auth.password')}
          hint={t('auth.passwordHint')}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
        />

        <fieldset>
          <legend className="text-sm font-medium text-ink">{t('auth.region')}</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {regions.data?.map((region) => {
              const selected = form.region_id === region.id
              return (
                <button
                  key={region.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('region_id', region.id)}
                  className={`flex h-12 items-center gap-2.5 rounded-lg border px-3.5 text-left text-[15px] transition-colors ${
                    selected ? 'border-forest bg-sage font-semibold text-forest' : 'border-line bg-white text-ink hover:border-leaf'
                  }`}
                >
                  {selected ? (
                    <CheckCircleIcon size={18} weight="fill" aria-hidden="true" />
                  ) : (
                    <MapPinIcon size={18} className="text-muted" aria-hidden="true" />
                  )}
                  {region.name}
                </button>
              )
            })}
          </div>
          {errors.region_id && <p className="mt-1.5 text-[13px] font-medium text-danger">{errors.region_id}</p>}
        </fieldset>

        <Field
          label={t('auth.place')}
          hint={t(`auth.roles.${form.role}.place`)}
          autoComplete="address-level2"
          value={form.base_location}
          onChange={(e) => set('base_location', e.target.value)}
          error={errors.base_location}
        />

        <FormError message={bannerError} />
        <Button type="submit" className="w-full" loading={register.isPending}>
          {register.isPending ? t('auth.signingUp') : t('auth.signup')}
        </Button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-forest underline-offset-4 hover:underline">
          {t('auth.loginLink')}
        </Link>
      </p>
    </AuthLayout>
  )
}
