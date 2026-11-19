import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
  PlantIcon,
  PlusIcon,
  ProhibitIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useDeleteListing, useMyListings, useStopListing } from '@/api/listings'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { round2 } from '@/lib/pricing'
import { produceAltName, produceName } from '@/lib/produce'
import { Card, PageHeader, Pill, ProduceMark } from '@/components/Bits'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { PriceRuler } from '@/components/PriceRuler'
import { useToast } from '@/components/toast-context'
import { ListingPanel } from './ListingPanel'

export default function Produce() {
  const { t } = useTranslation()
  const listings = useMyListings()
  const [params, setParams] = useSearchParams()

  // The open panel lives in the URL (?sell=1, ?edit=ID, ?again=ID) so dashboard links can open it
  const editId = Number(params.get('edit') || params.get('again'))
  const panelListing = listings.data?.find((l) => l.id === editId)
  const panel = params.get('sell')
    ? { mode: 'create' }
    : panelListing
      ? { mode: params.get('again') ? 'again' : 'edit', listing: panelListing }
      : null
  const openPanel = (key, value) => setParams({ [key]: value })
  const closePanel = () => setParams({})

  const selling = listings.data?.filter((l) => l.is_active) ?? []
  const stopped = listings.data?.filter((l) => !l.is_active) ?? []

  return (
    <>
      <PageHeader
        title={t('produce.title')}
        subtitle={t('produce.subtitle')}
        action={
          <Button icon={PlusIcon} onClick={() => openPanel('sell', '1')}>
            {t('produce.sell')}
          </Button>
        }
      />

      {listings.isPending ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : listings.isError ? (
        <Card>
          <ErrorState message={errorMessage(listings.error, t)} onRetry={listings.refetch} />
        </Card>
      ) : listings.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={PlantIcon}
            title={t('produce.emptyTitle')}
            body={t('produce.emptyBody')}
            action={
              <Button icon={PlusIcon} onClick={() => openPanel('sell', '1')}>
                {t('produce.sell')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-10">
          {selling.length > 0 && (
            <section aria-labelledby="selling-heading">
              <h2 id="selling-heading" className="mb-3 text-xl text-ink">
                {t('produce.sellingCount', { count: selling.length })}
              </h2>
              <Card as="ul">
                {selling.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} onEdit={() => openPanel('edit', listing.id)} />
                ))}
              </Card>
            </section>
          )}

          {stopped.length > 0 && (
            <section aria-labelledby="stopped-heading">
              <h2 id="stopped-heading" className="mb-3 text-xl text-ink">
                {t('produce.stoppedHeading')}
              </h2>
              <Card as="ul">
                {stopped.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onEdit={() => openPanel('edit', listing.id)}
                    onSellAgain={() => openPanel('again', listing.id)}
                  />
                ))}
              </Card>
            </section>
          )}
        </div>
      )}

      {panel && (
        <ListingPanel
          key={`${panel.mode}-${panel.listing?.id ?? 'new'}`}
          mode={panel.mode}
          listing={panel.listing}
          onClose={closePanel}
        />
      )}
    </>
  )
}

function ListingRow({ listing, onEdit, onSellAgain }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const stop = useStopListing()
  const remove = useDeleteListing()
  const [confirming, setConfirming] = useState(null) // 'stop' | 'delete' | null
  const name = produceName(listing.produce_name, lang)
  // Produce the farmer added has no market price to compare with
  const hasMarketPrice = listing.market_price != null
  const diff = hasMarketPrice ? round2(listing.listing_price - listing.market_price) : 0

  const onStop = () =>
    stop.mutate(listing.id, {
      onSuccess: () => {
        setConfirming(null)
        toast(t('produce.stoppedToast', { produce: name }))
      },
      onError: (error) => {
        setConfirming(null)
        toast(errorMessage(error, t), 'error')
      },
    })

  const onDelete = () =>
    remove.mutate(listing.id, {
      onSuccess: () => {
        setConfirming(null)
        toast(t('produce.deletedToast', { produce: name }))
      },
      onError: (error) => {
        setConfirming(null)
        toast(errorMessage(error, t), 'error')
      },
    })

  return (
    <li
      className={`grid grid-cols-[1.4fr_0.9fr_1.1fr_1.2fr_21rem] items-center gap-6 border-t border-line-soft px-6 py-5 first:border-t-0 ${
        listing.is_active ? '' : 'bg-paper/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <ProduceMark name={listing.produce_name} category={listing.produce_category} />
        <div>
          <p className="font-semibold text-ink">{name}</p>
          <p className="text-sm text-muted">{produceAltName(listing.produce_name, lang)}</p>
        </div>
      </div>

      <div>
        <p className="text-ink">{t('produce.left', { qty: number(listing.available_qty) })}</p>
        <div className="mt-1">
          {listing.is_active ? <Pill>{t('produce.selling')}</Pill> : <Pill tone="muted">{t('produce.stopped')}</Pill>}
        </div>
      </div>

      <div>
        <p className="font-serif text-xl whitespace-nowrap text-ink">{t('common.perKg', { price: rupees(listing.listing_price) })}</p>
        <p className="text-[13px] text-muted">
          {!hasMarketPrice
            ? t('produce.farmerPrice')
            : diff > 0
              ? t('produce.aboveMarket', { amount: rupees(diff) })
              : diff < 0
                ? t('produce.belowMarket', { amount: rupees(-diff) })
                : t('produce.atMarket')}
        </p>
      </div>

      <PriceRuler price={listing.listing_price} marketPrice={listing.market_price} />

      {/* Every listing: Change, Stop selling (or Sell again when stopped), Delete */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" icon={PencilSimpleIcon} onClick={onEdit}>
          {t('produce.change')}
        </Button>
        {listing.is_active ? (
          <Button variant="secondary" size="sm" icon={ProhibitIcon} onClick={() => setConfirming('stop')}>
            {t('produce.stop')}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={ArrowCounterClockwiseIcon} onClick={onSellAgain}>
            {t('produce.sellAgain')}
          </Button>
        )}
        <Button variant="danger" size="sm" icon={TrashIcon} onClick={() => setConfirming('delete')}>
          {t('produce.delete')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming === 'stop'}
        onClose={() => setConfirming(null)}
        onConfirm={onStop}
        loading={stop.isPending}
        title={t('produce.stopTitle', { produce: name })}
        body={t('produce.stopBody')}
        confirmLabel={t('common.yesStop')}
      />
      <ConfirmDialog
        open={confirming === 'delete'}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        loading={remove.isPending}
        title={t('produce.deleteTitle', { produce: name })}
        body={t('produce.deleteBody')}
        confirmLabel={t('common.yesDelete')}
      />
    </li>
  )
}
