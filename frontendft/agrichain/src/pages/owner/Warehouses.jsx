import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, TrashIcon, WarehouseIcon } from '@phosphor-icons/react'
import { useDeleteWarehouse, useMyWarehouses, useUpdateWarehouse } from '@/api/owner'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { perQuintalPerMonth } from '@/lib/storage'
import { Card, PageHeader, Pill } from '@/components/Bits'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { WarehouseThumb } from '@/components/PhotoGallery'
import { SpaceBar } from '@/components/SpaceBar'
import { Stars } from '@/components/StarRating'
import { WarehouseReviews } from '@/components/WarehouseReviews'
import { useToast } from '@/components/toast-context'
import { WarehousePanel } from './WarehousePanel'

export default function OwnerWarehouses() {
  const { t } = useTranslation()
  const warehouses = useMyWarehouses()
  const [panel, setPanel] = useState(null) // { mode, warehouse? }

  return (
    <>
      <PageHeader
        title={t('owner.warehouses.title')}
        subtitle={t('owner.warehouses.subtitle')}
        action={
          <Button icon={PlusIcon} onClick={() => setPanel({ mode: 'create' })}>
            {t('owner.warehouses.add')}
          </Button>
        }
      />

      {warehouses.isPending ? (
        <Card>
          <SkeletonRows rows={3} />
        </Card>
      ) : warehouses.isError ? (
        <Card>
          <ErrorState message={errorMessage(warehouses.error, t)} onRetry={warehouses.refetch} />
        </Card>
      ) : warehouses.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={WarehouseIcon}
            title={t('owner.warehouses.emptyTitle')}
            body={t('owner.warehouses.emptyBody')}
            action={<Button onClick={() => setPanel({ mode: 'create' })}>{t('owner.warehouses.add')}</Button>}
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {warehouses.data.map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} onChange={() => setPanel({ mode: 'edit', warehouse })} />
          ))}
        </ul>
      )}

      {panel && <WarehousePanel key={panel.warehouse?.id ?? 'new'} mode={panel.mode} warehouse={panel.warehouse} onClose={() => setPanel(null)} />}
    </>
  )
}

function WarehouseCard({ warehouse, onChange }) {
  const { t } = useTranslation()
  const toast = useToast()
  const update = useUpdateWarehouse()
  const remove = useDeleteWarehouse()
  const [asking, setAsking] = useState(null) // 'pause' | 'remove'
  const [showReviews, setShowReviews] = useState(false)

  const busy = warehouse.open_bookings > 0 // open bookings stop it being paused or removed
  const done = () => setAsking(null)
  const fail = (error) => {
    done()
    toast(errorMessage(error, t), 'error')
  }

  return (
    <Card as="li" className="grid grid-cols-[auto_1.5fr_1fr_11rem] items-center gap-8 px-6 py-5">
      <WarehouseThumb warehouse={warehouse} size="size-28" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-serif text-xl text-ink">{warehouse.name}</p>
          {!warehouse.is_active && <Pill tone="muted">{t('owner.warehouses.paused')}</Pill>}
        </div>
        <p className="text-sm text-muted">{warehouse.location}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={warehouse.is_cold_storage ? 'sky' : 'sage'}>
            {warehouse.is_cold_storage ? t('storage.cold') : t('storage.dry')}
          </Pill>
          {warehouse.photos.length < 2 && <Pill tone="amber">{t('owner.warehouses.needPhotos')}</Pill>}
        </div>
        {warehouse.review_count > 0 && (
          <button
            type="button"
            onClick={() => setShowReviews(true)}
            className="mt-2 flex items-center gap-2 rounded-lg text-[13px] text-muted hover:text-forest"
          >
            <Stars value={warehouse.rating} size={14} />
            {t('reviews.ratingSummary', { rating: warehouse.rating, count: warehouse.review_count })}
          </button>
        )}
        <p className="mt-3 text-sm font-semibold text-ink">{t('storage.rate', { rate: number(warehouse.price_per_kg_per_day) })}</p>
        <p className="text-[13px] text-muted">
          {t('owner.warehouses.perQuintal', { amount: rupees(perQuintalPerMonth(warehouse.price_per_kg_per_day)) })}
        </p>
      </div>

      <div>
        <SpaceBar free={warehouse.available_capacity_kg} total={warehouse.total_capacity_kg} />
        <p className="mt-2 text-[13px] text-muted">
          {warehouse.open_bookings > 0
            ? t('owner.warehouses.openBookings', { count: warehouse.open_bookings })
            : t('owner.warehouses.noBookings')}
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-2">
        <Button variant="secondary" size="sm" onClick={onChange}>
          {t('owner.warehouses.change')}
        </Button>
        {warehouse.is_active ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setAsking('pause')}>
            {t('owner.warehouses.pause')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={update.isPending}
            onClick={() =>
              update.mutate(
                { id: warehouse.id, is_active: true },
                { onSuccess: () => toast(t('owner.warehouses.openedToast', { name: warehouse.name })), onError: fail },
              )
            }
          >
            {t('owner.warehouses.openAgain')}
          </Button>
        )}
        <Button variant="ghost" size="sm" icon={TrashIcon} disabled={busy} onClick={() => setAsking('remove')}>
          {t('owner.warehouses.remove')}
        </Button>
        {busy && <p className="text-center text-xs text-muted">{t('owner.warehouses.busyNote')}</p>}
      </div>

      {showReviews && <WarehouseReviews warehouse={warehouse} onClose={() => setShowReviews(false)} />}
      <ConfirmDialog
        open={asking === 'pause'}
        onClose={done}
        onConfirm={() =>
          update.mutate(
            { id: warehouse.id, is_active: false },
            { onSuccess: () => { done(); toast(t('owner.warehouses.pausedToast', { name: warehouse.name })) }, onError: fail },
          )
        }
        loading={update.isPending}
        tone="primary"
        title={t('owner.warehouses.pauseTitle', { name: warehouse.name })}
        body={t('owner.warehouses.pauseBody')}
        confirmLabel={t('owner.warehouses.yesPause')}
      />
      <ConfirmDialog
        open={asking === 'remove'}
        onClose={done}
        onConfirm={() =>
          remove.mutate(warehouse.id, {
            onSuccess: () => { done(); toast(t('owner.warehouses.removedToast', { name: warehouse.name })) },
            onError: fail,
          })
        }
        loading={remove.isPending}
        title={t('owner.warehouses.removeTitle', { name: warehouse.name })}
        body={t('owner.warehouses.removeBody')}
        confirmLabel={t('owner.warehouses.yesRemove')}
      />
    </Card>
  )
}
