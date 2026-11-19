import { HouseIcon, ListChecksIcon, PackageIcon } from '@phosphor-icons/react'
import { useAvailableDeliveries } from '@/api/partner'
import { AppHeader } from './AppHeader'

export function PartnerHeader() {
  const available = useAvailableDeliveries()

  const links = [
    { to: '/partner', label: 'nav.home', icon: HouseIcon, end: true },
    {
      to: '/partner/available',
      label: 'nav.available',
      icon: PackageIcon,
      badge: available.data?.length ?? 0,
      badgeLabel: 'partner.tabWaiting',
    },
    { to: '/partner/deliveries', label: 'nav.myDeliveries', icon: ListChecksIcon },
  ]
  return <AppHeader homePath="/partner" links={links} />
}
