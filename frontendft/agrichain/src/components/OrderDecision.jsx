import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from '@phosphor-icons/react'
import { useAcceptOrder, useRejectOrder } from '@/api/orders'
import { errorMessage } from '@/lib/errors'
import { itemsText } from '@/lib/orders'
import { Button } from './Button'
import { ConfirmDialog } from './Dialogs'
import { useToast } from './toast-context'

/** Accept / Reject buttons for a new order. Reject asks first, because it cancels the order. */
export function OrderDecision({ order, size = 'sm' }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const accept = useAcceptOrder()
  const reject = useRejectOrder()
  const [confirming, setConfirming] = useState(false)

  const onAccept = () =>
    accept.mutate(order.id, {
      onSuccess: () => toast(t('orders.acceptedToast')),
      onError: (error) => toast(errorMessage(error, t), 'error'),
    })

  const onReject = () =>
    reject.mutate(order.id, {
      onSuccess: () => {
        setConfirming(false)
        toast(t('orders.rejectedToast'))
      },
      onError: (error) => {
        setConfirming(false)
        toast(errorMessage(error, t), 'error')
      },
    })

  return (
    <>
      <div className="flex gap-2">
        <Button size={size} icon={CheckIcon} onClick={onAccept} loading={accept.isPending} disabled={reject.isPending}>
          {accept.isPending ? t('orders.accepting') : t('orders.accept')}
        </Button>
        <Button size={size} variant="secondary" onClick={() => setConfirming(true)} disabled={accept.isPending}>
          {t('orders.reject')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={onReject}
        loading={reject.isPending}
        title={t('orders.rejectTitle')}
        body={t('orders.rejectBody', {
          buyer: order.buyer_name,
          items: itemsText(order, i18n.language),
        })}
        confirmLabel={t('common.yesReject')}
      />
    </>
  )
}
