import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateProduce } from '@/api/catalog'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { Field, FormError } from '@/components/Field'
import { useToast } from '@/components/toast-context'

const CATEGORIES = [
  { value: 'VEGETABLE', label: 'produce.vegetables' },
  { value: 'FRUIT', label: 'produce.fruits' },
]

/**
 * Add a produce type that is not in the list. It has no market price, so the farmer sets the price
 * when selling it. Mounted only while open.
 */
export function NewProducePanel({ startCategory = 'VEGETABLE', startName = '', onClose, onCreated }) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateProduce()
  const [name, setName] = useState(startName)
  const [category, setCategory] = useState(startCategory)
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError(t('produce.newNameShort'))
      return
    }
    create.mutate(
      { name: name.trim(), category },
      {
        onSuccess: (item) => {
          toast(t('produce.newAdded', { name: item.name }))
          onCreated(item)
        },
      },
    )
  }

  return (
    <Panel
      open
      onClose={onClose}
      title={t('produce.newTitle')}
      subtitle={t('produce.newSubtitle')}
      footer={
        <div className="space-y-3">
          <FormError message={create.isError ? errorMessage(create.error, t) : null} />
          <Button className="w-full" onClick={submit} loading={create.isPending}>
            {create.isPending ? t('owner.form.saving') : t('produce.newAdd')}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-7">
        <Field
          label={t('produce.newName')}
          hint={t('produce.newNameHint')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          error={error}
          maxLength={50}
        />

        <div>
          <p className="text-sm font-medium text-ink" id="new-produce-kind">
            {t('produce.categoryLabel')}
          </p>
          <div role="radiogroup" aria-labelledby="new-produce-kind" className="mt-2 inline-flex rounded-lg bg-line-soft p-1">
            {CATEGORIES.map((c) => {
              const checked = c.value === category
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setCategory(c.value)}
                  className={`h-9 rounded-md px-5 text-sm transition-colors ${
                    checked ? 'bg-forest font-semibold text-white shadow-sm' : 'text-ink hover:text-forest'
                  }`}
                >
                  {t(c.label)}
                </button>
              )
            })}
          </div>
        </div>

        <p className="rounded-xl bg-amber-soft px-4 py-3 text-sm leading-relaxed text-amber">{t('produce.noMarketPriceNote')}</p>
        <button type="submit" className="sr-only" tabIndex={-1}>
          {t('produce.newAdd')}
        </button>
      </form>
    </Panel>
  )
}
