import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LockKeyIcon, UserCircleIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useChangePassword, useUpdateProfile } from '@/api/account'
import { errorMessage, fieldErrors } from '@/lib/errors'
import { Card, Eyebrow, PageHeader } from '@/components/Bits'
import { Button } from '@/components/Button'
import { Field, FormError } from '@/components/Field'
import { useToast } from '@/components/toast-context'

/** Name, place and password for whoever is signed in. Phone and area are shown but cannot be changed here. */
export default function Account() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('account.title')} subtitle={t('account.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProfileCard />
        <PasswordCard />
      </div>
    </>
  )
}

function ProfileCard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const update = useUpdateProfile()
  const [name, setName] = useState(user.name)
  const [place, setPlace] = useState(user.base_location ?? '')
  const [errors, setErrors] = useState({})

  const changed = name.trim() !== user.name || place.trim() !== (user.base_location ?? '')

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (name.trim().length < 2) next.name = t('errors.nameShort')
    if (place.trim().length < 2) next.place = t('errors.placeRequired')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    update.mutate(
      { name: name.trim(), base_location: place.trim() },
      { onSuccess: () => toast(t('account.profileSaved')) },
    )
  }

  const serverErrors = update.isError ? fieldErrors(update.error) : {}

  return (
    <Card className="p-7">
      <Eyebrow icon={UserCircleIcon}>{t('account.profileEyebrow')}</Eyebrow>
      <h2 className="mt-1.5 text-[22px] text-ink">{t('account.profileTitle')}</h2>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <Field
          label={t('account.name')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((current) => ({ ...current, name: undefined }))
          }}
          error={errors.name ?? serverErrors.name}
          maxLength={100}
        />
        <Field
          label={t('account.place')}
          hint={t(`auth.roles.${user.role}.place`)}
          value={place}
          onChange={(e) => {
            setPlace(e.target.value)
            setErrors((current) => ({ ...current, place: undefined }))
          }}
          error={errors.place ?? serverErrors.base_location}
          maxLength={200}
        />

        {/* These two stay as they are: the phone is the login, the area ties the account to its data */}
        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-paper px-5 py-4 text-sm">
          <div>
            <dt className="text-muted">{t('account.phone')}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{user.phone}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('account.area')}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{user.region_name}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted">{t('account.role')}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{t(`auth.roles.${user.role}.title`)}</dd>
          </div>
        </dl>
        <p className="text-[13px] text-muted">{t('account.fixedNote')}</p>

        <FormError message={update.isError && Object.keys(serverErrors).length === 0 ? errorMessage(update.error, t) : null} />
        <Button type="submit" loading={update.isPending} disabled={!changed}>
          {update.isPending ? t('owner.form.saving') : t('account.saveProfile')}
        </Button>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const toast = useToast()
  const change = useChangePassword()
  const [form, setForm] = useState({ current: '', next: '', again: '' })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.current) next.current = t('errors.passwordRequired')
    if (form.next.length < 8) next.next = t('errors.passwordShort')
    else if (form.next === form.current) next.next = t('errors.samePassword')
    if (form.again !== form.next) next.again = t('account.passwordsDiffer')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    change.mutate(
      { current_password: form.current, new_password: form.next },
      {
        onSuccess: (data) => {
          // The server answers with a fresh login: older ones can no longer be renewed
          signIn(data)
          setForm({ current: '', next: '', again: '' })
          toast(t('account.passwordChanged'))
        },
      },
    )
  }

  return (
    <Card className="p-7">
      <Eyebrow icon={LockKeyIcon}>{t('account.passwordEyebrow')}</Eyebrow>
      <h2 className="mt-1.5 text-[22px] text-ink">{t('account.passwordTitle')}</h2>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <Field
          label={t('account.currentPassword')}
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={set('current')}
          error={errors.current}
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
        <FormError message={change.isError ? errorMessage(change.error, t) : null} />
        <Button type="submit" loading={change.isPending}>
          {change.isPending ? t('owner.form.saving') : t('account.changePassword')}
        </Button>
      </form>
    </Card>
  )
}
