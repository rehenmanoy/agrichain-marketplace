import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'

/** Labelled text input with an optional hint and an error shown under the field */
export function Field({ label, hint, error, type = 'text', className = '', ...inputProps }) {
  const { t } = useTranslation()
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
          className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-ink transition-colors outline-none placeholder:text-muted/70 focus:border-leaf focus:ring-4 focus:ring-sage ${
            error ? 'border-danger' : 'border-line'
          } ${isPassword ? 'pr-11' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-forest"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? <EyeSlashIcon size={18} aria-hidden="true" /> : <EyeIcon size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </p>
  )
}
