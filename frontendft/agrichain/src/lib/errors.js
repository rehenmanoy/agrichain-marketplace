import { isConnectionError } from './api'
import { produceName } from './produce'

/**
 * Turns an API error into a message for the farmer.
 * Common backend errors get a translated message; anything else shows the server's own text.
 */
export function errorMessage(error, t) {
  // No answer at all, or the answer a proxy gives when the server is down (a 5xx with no JSON body)
  if (!error?.response || isConnectionError(error)) return t('errors.network')

  const { status, data } = error.response
  const message = data?.error?.message ?? ''

  if (status === 401) {
    return message.includes('phone number or password') ? t('errors.wrongLogin') : t('errors.sessionExpired')
  }
  if (status === 429) return t('errors.tooMany')
  if (message.startsWith('Your current password is wrong')) return t('errors.wrongCurrentPassword')
  if (message.startsWith('Choose a password different')) return t('errors.samePassword')
  if (message.startsWith('That code is wrong or has expired')) return t('errors.badCode')
  if (message.startsWith('You can add up to') && message.includes('produce types')) return t('errors.tooManyProduce')
  const exists = message.match(/^(.+) already exists$/)
  if (status === 409 && exists) return t('errors.produceExists', { name: exists[1] })
  if (status === 409 && /phone/i.test(message)) return t('errors.phoneTaken')
  if (message.startsWith('Price must be between')) return t('errors.priceBand')
  if (message.startsWith('Not enough capacity')) return t('errors.notEnoughSpace')
  if (message.startsWith('This warehouse has open bookings')) return t('errors.warehouseBusy')
  if (message.startsWith('This warehouse is not accepting bookings')) return t('errors.warehouseClosed')
  const below = message.match(/^Space can't be below the ([\d.]+) kg/)
  if (below) return t('errors.spaceBelowBooked', { kg: below[1] })
  if (status === 409 && /already asked to extend/i.test(message)) return t('errors.alreadyExtending')
  if (message.startsWith('This listing has open orders')) return t('errors.openOrders')
  const short = message.match(/^Not enough (.+)\. Available: (\d+)$/)
  if (short) return t('errors.notEnoughOf', { produce: produceName(short[1], t.lng), qty: short[2] })
  const gone = message.match(/^(.+) is no longer available$/)
  if (gone) return t('errors.itemGone', { produce: produceName(gone[1], t.lng) })
  if (message.startsWith('This listing is no longer available')) return t('errors.listingGone')
  if (message.startsWith('This order has already been picked up')) return t('errors.alreadyTaken')
  if (message.startsWith('Only pending orders can be cancelled')) return t('errors.cantCancel')
  if (status === 409 && /already (reviewed|rated)/i.test(message)) return t('errors.alreadyReviewed')

  return message || t('errors.generic')
}

/** Field errors from a 400 response, as { field: message } */
export function fieldErrors(error) {
  const details = error?.response?.data?.error?.details
  if (!Array.isArray(details)) return {}
  return Object.fromEntries(details.map((d) => [d.field, d.message]))
}
