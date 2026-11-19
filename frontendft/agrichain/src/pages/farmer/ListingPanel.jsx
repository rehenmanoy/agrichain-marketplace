import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpinnerIcon } from '@phosphor-icons/react'
import { useProduceList, useProducePrice } from '@/api/catalog'
import { useCreateListing, useUpdateListing } from '@/api/listings'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { priceBand, round2 } from '@/lib/pricing'
import { produceAltName, produceName } from '@/lib/produce'
import { ProduceMark } from '@/components/Bits'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { FormError } from '@/components/Field'
import { PriceRuler } from '@/components/PriceRuler'
import { ProducePicker } from '@/components/ProducePicker'
import { Stepper } from '@/components/Stepper'
import { useToast } from '@/components/toast-context'
import { NewProducePanel } from './NewProducePanel'

/**
 * Sell new produce (mode "create"), change a listing ("edit") or put a stopped one back on sale ("again").
 * Mounted only while open, so its state starts fresh each time.
 */
export function ListingPanel({ mode, listing, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const produceList = useProduceList()
  const create = useCreateListing()
  const update = useUpdateListing()

  const [produceId, setProduceId] = useState(listing?.produce_id ?? null)
  const [qty, setQty] = useState(mode === 'edit' ? listing.available_qty : listing?.available_qty || 10)
  const [priceDraft, setPriceDraft] = useState(null)
  const [adding, setAdding] = useState(null) // { category, name } while the "add your produce" panel is open

  const market = useProducePrice(produceId)
  const marketPrice = market.data?.price
  // Produce a farmer added has no market price: no fair-price band, the farmer sets the price
  const isCustom = market.data?.is_custom ?? listing?.produce_is_custom ?? false
  const price = priceDraft ?? (listing ? listing.listing_price : isCustom ? 50 : marketPrice)
  const band = !isCustom && marketPrice ? priceBand(marketPrice) : null
  const produce = produceList.data?.find((p) => p.id === produceId)
  const name = produceName(produce?.name ?? listing?.produce_name ?? '', lang)

  const mutation = mode === 'create' ? create : update
  const ready = Boolean(produceId && (isCustom ? price > 0 : marketPrice))

  const title =
    mode === 'create'
      ? t('produce.sellTitle')
      : t(mode === 'edit' ? 'produce.editTitle' : 'produce.sellAgainTitle', { produce: name })

  const submit = () => {
    const onSuccess = () => {
      toast(t(mode === 'create' ? 'produce.forSaleToast' : 'produce.savedToast', { produce: name }))
      onClose()
    }

    if (mode === 'create') {
      // Selling at exactly the market price keeps it marked as the market price
      create.mutate(
        {
          produce_id: produceId,
          available_qty: qty,
          listing_price: isCustom ? price : price === marketPrice ? undefined : price,
        },
        { onSuccess },
      )
      return
    }

    const changes = {}
    if (mode === 'again' || qty !== listing.available_qty) changes.available_qty = qty
    // Only "Sell again" puts a stopped listing back on sale; changing a stopped one keeps it stopped
    if (mode === 'again') changes.is_active = true
    if (priceDraft !== null && priceDraft !== listing.listing_price) changes.listing_price = priceDraft
    if (Object.keys(changes).length === 0) return onClose()
    update.mutate({ id: listing.id, ...changes }, { onSuccess })
  }

  const diff = marketPrice && !isCustom ? round2(price - marketPrice) : 0

  return (
    <Panel
      open
      onClose={onClose}
      title={title}
      footer={
        <div className="space-y-3">
          <FormError message={mutation.isError ? errorMessage(mutation.error, t) : null} />
          <Button className="w-full" onClick={submit} disabled={!ready} loading={mutation.isPending}>
            {mode === 'create'
              ? mutation.isPending
                ? t('produce.putting')
                : t('produce.putForSale')
              : mutation.isPending
                ? t('produce.saving')
                : mode === 'again'
                  ? t('produce.sellAgain')
                  : t('produce.saveChanges')}
          </Button>
        </div>
      }
    >
      {mode === 'create' ? (
        <ProducePicker
          label={t('produce.chooseProduce')}
          produce={produceList.data}
          value={produceId}
          onChange={(id) => {
            setProduceId(id)
            setPriceDraft(null)
          }}
          onAdd={(category, typed) => setAdding({ category, name: typed })}
        />
      ) : (
        <div className="flex items-center gap-4 rounded-xl bg-paper p-4">
          <ProduceMark name={listing.produce_name} category={listing.produce_category} size="lg" />
          <div>
            <p className="font-serif text-xl text-ink">{name}</p>
            <p className="text-sm text-muted">{produceAltName(listing.produce_name, lang)}</p>
          </div>
        </div>
      )}

      {produceId && (
        <div className="mt-8 space-y-8">
          {market.isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted" role="status">
              <SpinnerIcon size={16} className="animate-spin" aria-hidden="true" />
              {t('produce.priceLoading')}
            </p>
          ) : market.isError ? (
            <FormError message={t('produce.priceUnavailable')} />
          ) : (
            <>
              {isCustom ? (
                <p className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber">{t('produce.noMarketPriceNote')}</p>
              ) : (
                <div className="flex items-baseline justify-between border-b border-line pb-4">
                  <span className="text-sm text-muted">{t('produce.todayMarket')}</span>
                  <span className="font-serif text-2xl text-ink">{t('common.perKg', { price: rupees(marketPrice) })}</span>
                </div>
              )}

              <div className="space-y-5">
                <Stepper
                  label={t('produce.yourPrice')}
                  srLabel={t('produce.priceLabel')}
                  prefix="₹"
                  value={price}
                  onChange={setPriceDraft}
                  min={isCustom ? 1 : band.min}
                  max={isCustom ? 100000 : band.max}
                  hint={isCustom ? t('produce.setYourOwnPrice') : t('produce.priceRange', { min: rupees(band.min), max: rupees(band.max) })}
                />
                {!isCustom && (
                  <>
                    <PriceRuler price={price} marketPrice={marketPrice} size="lg" />
                    <p className="text-sm font-medium text-leaf">
                      {diff > 0
                        ? t('produce.aboveMarket', { amount: rupees(diff) })
                        : diff < 0
                          ? t('produce.belowMarket', { amount: rupees(-diff) })
                          : t('produce.atMarket')}
                    </p>
                  </>
                )}
              </div>

              <Stepper
                label={t('produce.quantity')}
                srLabel={t('produce.quantityLabel')}
                suffix="kg"
                value={qty}
                onChange={(v) => setQty(Math.round(v))}
                min={mode === 'edit' ? 0 : 1}
                max={100000}
                step={5}
              />

              <p className="rounded-xl bg-sage px-4 py-3 text-sm text-forest">
                {number(qty)} kg × {rupees(price)} = <span className="font-semibold">{rupees(qty * price)}</span>
              </p>
            </>
          )}
        </div>
      )}
      {adding && (
        <NewProducePanel
          key="new-produce"
          startCategory={adding.category}
          startName={adding.name}
          onClose={() => setAdding(null)}
          onCreated={(item) => {
            setProduceId(item.id)
            setPriceDraft(null)
            setAdding(null)
          }}
        />
      )}
    </Panel>
  )
}
