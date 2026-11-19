import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { round2 } from '@/lib/pricing'

/**
 * A number with − and + buttons. Typing is allowed; the value is clamped to [min, max]
 * when the field loses focus.
 */
export function Stepper({ label, srLabel, value, onChange, min = 0, max = Infinity, step = 1, prefix, suffix, hint }) {
  const { t } = useTranslation()
  const id = useId()
  const hintId = `${id}-hint`
  const [draft, setDraft] = useState(null)

  const clamp = (n) => Math.min(max, Math.max(min, round2(n)))
  const commit = () => {
    if (draft === null) return
    const n = Number(draft)
    setDraft(null)
    if (draft.trim() !== '' && Number.isFinite(n)) onChange(clamp(n))
  }

  const buttonClass =
    'flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-forest transition-colors hover:border-leaf hover:bg-sage disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label={t('common.decrease', { label: srLabel ?? label })}
        >
          <MinusIcon size={16} weight="bold" aria-hidden="true" />
        </button>
        <div className="flex h-12 min-w-36 items-center justify-center gap-1 rounded-lg border border-line bg-white px-3 focus-within:border-leaf">
          {prefix && <span className="font-serif text-xl text-muted">{prefix}</span>}
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={Number.isFinite(max) ? max : undefined}
            step={step}
            value={draft ?? String(value)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            aria-describedby={hint ? hintId : undefined}
            className="w-20 [appearance:textfield] bg-transparent text-center font-serif text-2xl text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {suffix && <span className="text-sm text-muted">{suffix}</span>}
        </div>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label={t('common.increase', { label: srLabel ?? label })}
        >
          <PlusIcon size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
