import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProduceList } from '@/api/catalog'
import { useAvailability, useBookStorage } from '@/api/storage'
import { errorMessage } from '@/lib/errors'
import { formatDate, isoDate, number, rupees } from '@/lib/format'
import { MAX_BOOKING_DAYS, inclusiveDays } from '@/lib/storage'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { Field, FormError } from '@/components/Field'
import { PhotoGallery } from '@/components/PhotoGallery'
import { ProducePicker } from '@/components/ProducePicker'
import { Stepper } from '@/components/Stepper'
import { useToast } from '@/components/toast-context'

/** Ask a warehouse owner for space: photos, what, how much, which dates, and what it will cost */
export function BookPanel({ warehouse, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const produceList = useProduceList()
  const book = useBookStorage()

  const [produceId, setProduceId] = useState(null)
  const [kg, setKg] = useState(100)
  const [startDate, setStartDate] = useState(isoDate(1))
  const [endDate, setEndDate] = useState(isoDate(7))

  const today = isoDate(0)
  const days = inclusiveDays(startDate, endDate)
  const datesError =
    !startDate || !endDate
      ? t('storage.pickDates')
      : startDate < today
        ? t('storage.startInPast')
        : endDate < startDate
          ? t('storage.endBeforeStart')
          : days > MAX_BOOKING_DAYS
            ? t('storage.tooLong', { max: MAX_BOOKING_DAYS })
            : null

  // How much room there is on the busiest day of the chosen dates
  const availability = useAvailability(warehouse.id, startDate, endDate, !datesError)
  const free = Math.floor(availability.data?.free_kg ?? 0)
  const noRoom = !datesError && availability.isSuccess && free < 1
  const qty = Math.min(kg, Math.max(free, 1))
  const cost = datesError ? 0 : days * qty * warehouse.price_per_kg_per_day

  const submit = () =>
    book.mutate(
      {
        warehouse_id: warehouse.id,
        produce_id: produceId ?? undefined,
        quantity_kg: qty,
        start_date: startDate,
        end_date: endDate,
      },
      {
        onSuccess: () => {
          toast(t('storage.requestedToast', { name: warehouse.name }))
          onClose()
        },
      },
    )

  return (
    <Panel
      open
      onClose={onClose}
      title={t('storage.bookTitle', { name: warehouse.name })}
      subtitle={`${warehouse.location} · ${t('storage.rate', { rate: number(warehouse.price_per_kg_per_day) })}`}
      footer={
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{t('storage.estimate')}</span>
            <span className="font-serif text-3xl text-ink">{rupees(cost)}</span>
          </div>
          <FormError message={book.isError ? errorMessage(book.error, t) : null} />
          <Button
            className="w-full"
            onClick={submit}
            loading={book.isPending}
            disabled={Boolean(datesError) || noRoom || availability.isPending}
          >
            {book.isPending ? t('storage.sending') : t('storage.sendRequest')}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <PhotoGallery photos={warehouse.photos} name={warehouse.name} />

        <ProducePicker
          label={t('storage.whatProduce')}
          produce={produceList.data}
          value={produceId}
          onChange={setProduceId}
          noneLabel={t('storage.notSure')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t('storage.startDate')}
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Field
            label={t('storage.endDate')}
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {datesError ? (
          <p role="alert" className="-mt-4 text-[13px] font-medium text-danger">
            {datesError}
          </p>
        ) : (
          <p className="-mt-4 text-sm text-muted">
            {t('storage.days', { count: days })} · {t('storage.fromTo', { start: formatDate(startDate, lang), end: formatDate(endDate, lang) })}
          </p>
        )}

        {noRoom ? (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {t('storage.noRoomForDates')}
          </p>
        ) : (
          <Stepper
            label={t('storage.howMuch')}
            srLabel={t('storage.kgLabel')}
            suffix="kg"
            value={qty}
            onChange={(v) => setKg(Math.round(v))}
            min={1}
            max={Math.max(free, 1)}
            step={10}
            hint={
              datesError || availability.isPending
                ? undefined
                : t('storage.freeForDates', { free: number(free), total: number(warehouse.total_capacity_kg) })
            }
          />
        )}

        {!datesError && !noRoom && (
          <p className="rounded-xl bg-sage px-4 py-3 text-sm text-forest">
            {t('storage.days', { count: days })} × {number(qty)} kg × {rupees(warehouse.price_per_kg_per_day)} ={' '}
            <span className="font-semibold">{rupees(cost)}</span>
          </p>
        )}

        <p className="text-[13px] leading-relaxed text-muted">{t('storage.approvalNote')}</p>
      </div>
    </Panel>
  )
}
