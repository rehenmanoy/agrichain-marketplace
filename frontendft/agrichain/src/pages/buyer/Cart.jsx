import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { MapPinIcon, MinusIcon, PlusIcon, ShoppingCartSimpleIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useCart, useCheckout, useRemoveCartItem, useUpdateCartItem } from '@/api/cart'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { DELIVERY_FEE } from '@/lib/pricing'
import { produceName } from '@/lib/produce'
import { Card, PageHeader, ProduceMark } from '@/components/Bits'
import { Button, ButtonLink } from '@/components/Button'
import { Field, FormError } from '@/components/Field'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { useToast } from '@/components/toast-context'

export default function Cart() {
  const { t } = useTranslation()
  const cart = useCart()

  if (cart.isPending || cart.isError) {
    return (
      <>
        <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />
        <Card>
          {cart.isError ? <ErrorState message={errorMessage(cart.error, t)} onRetry={cart.refetch} /> : <SkeletonRows rows={3} />}
        </Card>
      </>
    )
  }

  if (cart.data.item_count === 0) {
    return (
      <>
        <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />
        <Card>
          <EmptyState
            icon={ShoppingCartSimpleIcon}
            title={t('cart.empty')}
            body={t('cart.emptyBody')}
            action={<ButtonLink to="/buyer/shop">{t('buyer.dashboard.shopCta')}</ButtonLink>}
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {cart.data.farmers.map((group) => (
            <FarmerGroup key={group.farmer_id} group={group} />
          ))}
        </div>
        <Summary cart={cart.data} />
      </div>
    </>
  )
}

function FarmerGroup({ group }) {
  const { t } = useTranslation()
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line-soft bg-paper px-6 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage font-serif text-forest" aria-hidden="true">
          {group.farmer_name?.[0]}
        </span>
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-ink">{t('cart.fromFarmer', { farmer: group.farmer_name })}</p>
          <p className="flex items-center gap-1 truncate text-[13px] text-muted">
            <MapPinIcon size={13} className="shrink-0" aria-hidden="true" />
            {group.farmer_location}
          </p>
        </div>
      </div>

      <ul>
        {group.items.map((item) => (
          <CartLine key={item.id} item={item} />
        ))}
      </ul>

      <dl className="space-y-1.5 border-t border-line-soft px-6 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t('cart.subtotal', { kg: number(group.total_kg) })}</dt>
          <dd className="text-ink">{rupees(group.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t('cart.delivery')}</dt>
          <dd className="text-ink">{rupees(group.delivery_fee)}</dd>
        </div>
        <div className="flex justify-between pt-1 font-semibold">
          <dt className="text-ink">{t('cart.orderTotal')}</dt>
          <dd className="font-serif text-lg text-ink">{rupees(group.total)}</dd>
        </div>
      </dl>
    </Card>
  )
}

function CartLine({ item }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const max = Math.floor(item.available_qty)

  const setQty = (quantity) =>
    update.mutate({ id: item.id, quantity }, { onError: (error) => toast(errorMessage(error, t), 'error') })
  const onRemove = () =>
    remove.mutate(item.id, {
      onSuccess: () => toast(t('cart.removed', { produce: produceName(item.produce_name, i18n.language) })),
      onError: (error) => toast(errorMessage(error, t), 'error'),
    })

  const buttonClass =
    'flex size-8 items-center justify-center rounded-lg border border-line bg-white text-forest transition-colors hover:border-leaf hover:bg-sage disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <li className="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-t border-line-soft px-6 py-4 first:border-t-0">
      <div className="flex gap-3.5">
        <ProduceMark name={item.produce_name} category={item.produce_category} />
        <div className="min-w-0">
          <p className="font-serif text-lg text-ink">{produceName(item.produce_name, i18n.language)}</p>
          <p className="text-sm text-muted">{t('common.perKg', { price: rupees(item.unit_price) })}</p>
          {item.problem && (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-danger">
              <WarningCircleIcon size={15} weight="bold" className="shrink-0" aria-hidden="true" />
              {t(`cart.problem.${item.problem}`, { qty: number(max) })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => setQty(item.quantity - 1)}
          disabled={busy || item.quantity <= 1}
          aria-label={t('common.decrease', { label: produceName(item.produce_name, i18n.language) })}
        >
          <MinusIcon size={14} weight="bold" aria-hidden="true" />
        </button>
        <span className="w-16 text-center text-sm font-semibold text-ink">{number(item.quantity)} kg</span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setQty(item.quantity + 1)}
          disabled={busy || item.quantity >= max}
          aria-label={t('common.increase', { label: produceName(item.produce_name, i18n.language) })}
        >
          <PlusIcon size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-w-28 items-center justify-end gap-3">
        <p className="font-serif text-lg text-ink">{rupees(item.line_total)}</p>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
          aria-label={t('cart.remove', { produce: produceName(item.produce_name, i18n.language) })}
        >
          <TrashIcon size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

function Summary({ cart }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const checkout = useCheckout()
  const [address, setAddress] = useState(user?.base_location ?? '')
  const [addressError, setAddressError] = useState(null)
  const orderCount = cart.farmers.length

  const placeOrder = () => {
    if (address.trim().length < 3) {
      setAddressError(t('buyer.order.addressRequired'))
      return
    }
    checkout.mutate(
      { delivery_address: address.trim() },
      {
        onSuccess: (orders) => {
          toast(t('cart.placed', { count: orders.length }))
          navigate('/buyer/orders')
        },
      },
    )
  }

  return (
    <Card className="p-6 lg:sticky lg:top-24">
      <h2 className="text-xl text-ink">{t('cart.summary')}</h2>

      <div className="mt-5">
        <Field
          label={t('buyer.order.address')}
          hint={t('buyer.order.addressHint')}
          autoComplete="street-address"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setAddressError(null)
          }}
          error={addressError}
        />
      </div>

      <dl className="mt-5 space-y-3 rounded-xl bg-sage px-5 py-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-forest">{t('cart.itemsCost', { count: cart.item_count })}</dt>
          <dd className="font-semibold whitespace-nowrap text-forest">{rupees(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-forest">
            {t('cart.delivery')}
            <span className="block text-xs text-leaf">
              {t('cart.deliveryHint', { base: rupees(DELIVERY_FEE.BASE), perKg: rupees(DELIVERY_FEE.PER_KG) })}
            </span>
          </dt>
          <dd className="font-semibold whitespace-nowrap text-forest">{rupees(cart.delivery_fee)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-sm text-muted">{t('buyer.order.total')}</span>
        <span className="font-serif text-3xl text-ink">{rupees(cart.grand_total)}</span>
      </div>

      {orderCount > 1 && <p className="mt-3 text-[13px] text-muted">{t('cart.splitNote', { count: orderCount })}</p>}
      {cart.has_problems && <p className="mt-3 text-[13px] font-medium text-danger">{t('cart.fixProblems')}</p>}

      <div className="mt-4 space-y-3">
        <FormError message={checkout.isError ? errorMessage(checkout.error, t) : null} />
        <Button className="w-full" onClick={placeOrder} loading={checkout.isPending} disabled={cart.has_problems}>
          {checkout.isPending ? t('buyer.order.placing') : t('buyer.order.place')}
        </Button>
      </div>
    </Card>
  )
}
