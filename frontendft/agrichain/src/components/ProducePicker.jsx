import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { COMMON_PRODUCE, matchesProduce, produceAltName, produceName } from '@/lib/produce'
import { ProduceMark } from './Bits'

const CATEGORIES = [
  { value: 'VEGETABLE', label: 'produce.vegetables', search: 'produce.searchVegetables' },
  { value: 'FRUIT', label: 'produce.fruits', search: 'produce.searchFruits' },
]

/**
 * Choose a produce item: a Vegetables / Fruits switch, the most sold items as tiles,
 * and a search box for everything else in that category.
 * With `noneLabel`, an extra "not sure" choice selects null.
 * With `onAdd`, a link for produce that is not in the list calls onAdd(category, whatWasTyped).
 */
export function ProducePicker({ label, produce = [], value, onChange, noneLabel, onAdd }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const searchId = useId()
  const listId = useId()

  const selected = produce.find((p) => p.id === value) ?? null
  const [category, setCategory] = useState(selected?.category ?? 'VEGETABLE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const inCategory = produce.filter((p) => p.category === category)
  const common = COMMON_PRODUCE[category].map((name) => inCategory.find((p) => p.name === name)).filter(Boolean)
  const results = query.trim() ? inCategory.filter((p) => matchesProduce(p, query)) : []
  const showList = open && query.trim() !== ''
  const categoryInfo = CATEGORIES.find((c) => c.value === category)

  const choose = (item) => {
    onChange(item?.id ?? null)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && showList && results[active]) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape' && showList) {
      // Close the list only, not the whole panel
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  const tileClass = (isSelected) =>
    `relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
      isSelected ? 'border-forest bg-sage' : 'border-line bg-white hover:border-leaf'
    }`

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{label}</legend>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label={t('produce.categoryLabel')} className="inline-flex rounded-lg bg-line-soft p-1">
          {CATEGORIES.map((c) => {
            const checked = c.value === category
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => {
                  setCategory(c.value)
                  setQuery('')
                }}
                className={`h-9 rounded-md px-5 text-sm transition-colors ${
                  checked ? 'bg-forest font-semibold text-white shadow-sm' : 'text-ink hover:text-forest'
                }`}
              >
                {t(c.label)}
              </button>
            )
          })}
        </div>
        {noneLabel && (
          <button
            type="button"
            aria-pressed={value === null}
            onClick={() => choose(null)}
            className={`h-9 rounded-full border px-4 text-sm transition-colors ${
              value === null ? 'border-forest bg-sage font-semibold text-forest' : 'border-line bg-white text-ink hover:border-leaf'
            }`}
          >
            {noneLabel}
          </button>
        )}
      </div>

      <p className="mt-5 text-[13px] text-muted">{t('produce.commonHeading')}</p>
      <div className="mt-2 grid grid-cols-4 gap-2.5">
        {common.map((item) => {
          const isSelected = item.id === value
          return (
            <button key={item.id} type="button" aria-pressed={isSelected} onClick={() => choose(item)} className={tileClass(isSelected)}>
              {isSelected && (
                <CheckCircleIcon size={16} weight="fill" className="absolute top-1.5 right-1.5 text-forest" aria-hidden="true" />
              )}
              <ProduceMark name={item.name} category={item.category} size="sm" />
              <span className="text-[13px] leading-tight font-semibold text-ink">{produceName(item.name, lang)}</span>
              <span className="text-[11px] leading-tight text-muted">{produceAltName(item.name, lang)}</span>
            </button>
          )
        })}
      </div>

      <div className="relative mt-5">
        <label htmlFor={searchId} className="block text-[13px] text-muted">
          {t(categoryInfo.search)}
        </label>
        <div className="relative mt-1.5">
          <MagnifyingGlassIcon
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
            placeholder={t('produce.searchPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className="h-11 w-full rounded-lg border border-line bg-white pr-3.5 pl-10 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-leaf focus:ring-4 focus:ring-sage"
          />
        </div>

        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={t(categoryInfo.search)}
            className="absolute inset-x-0 top-full z-10 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-line bg-white py-1.5 shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">{t('produce.noMatch', { query: query.trim() })}</li>
            ) : (
              results.map((item, index) => (
                <li
                  key={item.id}
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={item.id === value}
                  // mousedown keeps focus in the box, so the click isn't lost to blur
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(item)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${index === active ? 'bg-sage' : ''}`}
                >
                  <ProduceMark name={item.name} category={item.category} size="sm" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">{produceName(item.name, lang)}</span>
                    <span className="block text-xs text-muted">{produceAltName(item.name, lang)}</span>
                  </span>
                  {item.id === value && <CheckCircleIcon size={18} weight="fill" className="text-forest" aria-hidden="true" />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={() => onAdd(category, query.trim())}
          className="mt-3 text-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          {t('produce.addOwn')}
        </button>
      )}

      {/* An item picked from search (or the other category) isn't among the tiles, so show it here */}
      {selected && !common.some((p) => p.id === selected.id) && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-forest bg-sage px-4 py-3" aria-live="polite">
          <ProduceMark name={selected.name} category={selected.category} size="sm" />
          <span className="flex-1">
            <span className="block text-xs text-muted">{t('produce.chosen')}</span>
            <span className="block text-sm font-semibold text-ink">
              {produceName(selected.name, lang)}
              <span className="font-normal text-muted"> {produceAltName(selected.name, lang)}</span>
            </span>
          </span>
          <CheckCircleIcon size={20} weight="fill" className="text-forest" aria-hidden="true" />
        </div>
      )}
    </fieldset>
  )
}
