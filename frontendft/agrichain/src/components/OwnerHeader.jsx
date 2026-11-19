import { HouseIcon, ListChecksIcon, WarehouseIcon } from '@phosphor-icons/react'
import { useIncomingBookings } from '@/api/owner'
import { AppHeader } from './AppHeader'

export function OwnerHeader() {
  const bookings = useIncomingBookings()
  // Things waiting for the owner's answer: new requests and extension requests
  const waiting =
    bookings.data?.filter((b) => b.status === 'REQUESTED' || (b.status === 'ACTIVE' && b.extension?.status === 'PENDING')).length ?? 0

  const links = [
    { to: '/owner', label: 'nav.home', icon: HouseIcon, end: true },
    { to: '/owner/warehouses', label: 'nav.warehouses', icon: WarehouseIcon },
    { to: '/owner/bookings', label: 'nav.bookings', icon: ListChecksIcon, badge: waiting, badgeLabel: 'owner.tabWaiting' },
  ]
  return <AppHeader homePath="/owner" links={links} />
}
