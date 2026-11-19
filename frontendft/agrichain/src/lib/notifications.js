/** The i18n key under notifications.types for one notification (a few types read differently by detail) */
export function notificationKey(n) {
  if (n.type === 'ORDER_CANCELLED') return `ORDER_CANCELLED_${String(n.data.by ?? 'buyer').toUpperCase()}`
  if (n.type === 'BOOKING_REJECTED' && n.data.note) return 'BOOKING_REJECTED_NOTE'
  return n.type
}

/** Where clicking a notification takes the reader (the same type means different pages to different roles) */
export function notificationLink(n, role) {
  switch (n.type) {
    case 'ORDER_NEW':
      return '/farmer/orders?tab=new'
    case 'ORDER_ACCEPTED':
      return '/buyer/orders'
    case 'ORDER_CANCELLED':
    case 'ORDER_PICKED_UP':
    case 'ORDER_DELAYED':
    case 'ORDER_DELIVERED':
      if (role === 'BUYER') return '/buyer/orders'
      return n.type === 'ORDER_PICKED_UP' || n.type === 'ORDER_DELAYED' ? '/farmer/orders?tab=active' : '/farmer/orders?tab=done'
    case 'DELIVERY_WAITING':
      return '/partner/available'
    case 'REVIEW_NEW':
      return '/farmer/reviews'
    case 'PARTNER_REVIEW_NEW':
      return '/partner'
    case 'WAREHOUSE_REVIEW_NEW':
      return '/owner'
    case 'BOOKING_REQUESTED':
    case 'EXTENSION_REQUESTED':
      return '/owner/bookings?tab=requests'
    case 'BOOKING_CANCELLED':
    case 'BOOKING_RELEASED':
      return '/owner/bookings?tab=past'
    default:
      return '/farmer/storage' // booking and extension answers go to the farmer's storage page
  }
}
