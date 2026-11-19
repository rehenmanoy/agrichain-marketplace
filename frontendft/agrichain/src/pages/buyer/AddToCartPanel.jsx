import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPinIcon, ShoppingCartSimpleIcon } from '@phosphor-icons/react'
import { useAddToCart } from '@/api/cart'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { produceAltName, produceName } from '@/lib/produce'
import { ProduceMark } from '@/components/Bits'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { FormError } from '@/components/Field'
import { Stepper } from '@/components/Stepper'
import { useToast } from '@/components/toast-context'

/** Choose how much of a listing to put in the cart. Mounted only while open. */
export function AddToCartPanel({ listing, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const toast = useToast()
  const add = useAddToCart()

  const available = Math.floor(listing.available_qty)
  const [qty, setQty] = useState(Math.min(5, available))
  const name = produceName(listing.produce_name, lang)

  const submit = () =>
    add.mutate(
      { listing_id: listing.id, quantity: qty },
      {
        onSuccess: () => {
          toast(t('cart.added', { qty: number(qty), produce: name }))
          onClose()
        },
      },
    )

  return (
    <Panel
      open
      onClose={onClose}
      title={t('cart.addTitle', { produce: name })}
      footer={
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{t('cart.produceCost')}</span>
            <span className="font-serif text-3xl text-ink">{rupees(qty * listing.listing_price)}</span>
          </div>
          <p className="text-[13px] text-muted">{t('cart.deliveryAtCheckout')}</p>
          <FormError message={add.isError ? errorMessage(add.error, t) : null} />
          <Button className="w-full" icon={ShoppingCartSimpleIcon} onClick={submit} loading={add.isPending} disabled={qty < 1}>
            {t('cart.add')}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4 rounded-xl bg-paper p-4">
          <ProduceMark name={listing.produce_name} category={listing.produce_category} size="lg" />
          <div className="min-w-0">
            <p className="font-serif text-xl text-ink">{name}</p>
            <p className="text-sm text-muted">{produceAltName(listing.produce_name, lang)}</p>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
              <MapPinIcon size={14} className="shrink-0" aria-hidden="true" />
              <span className="truncate">
                {t('buyer.order.from', { farmer: listing.farmer_name, place: listing.farmer_location })}
              </span>
            </p>
          </div>
          <p className="ml-auto font-serif text-xl whitespace-nowrap text-ink">
            {t('common.perKg', { price: rupees(listing.listing_price) })}
          </p>
        </div>

        <Stepper
          label={t('buyer.order.howMuch')}
          srLabel={t('buyer.order.qtyLabel')}
          suffix="kg"
          value={qty}
          onChange={(v) => setQty(Math.round(v))}
          min={1}
          max={available}
          step={1}
          hint={t('buyer.shop.available', { qty: number(available) })}
        />
      </div>
    </Panel>
  )
}
