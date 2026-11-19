import { HouseIcon, PackageIcon, PlantIcon, StarIcon, WarehouseIcon } from '@phosphor-icons/react'
import { useIncomingOrders } from '@/api/orders'
import { AppHeader } from './AppHeader'

export function FarmerHeader() {
  const orders = useIncomingOrders()
  const newOrders = orders.data?.filter((o) => o.status === 'PENDING').length ?? 0

  const links = [
    { to: '/farmer', label: 'nav.home', icon: HouseIcon, end: true },
    { to: '/farmer/produce', label: 'nav.produce', icon: PlantIcon },
    { to: '/farmer/orders', label: 'nav.orders', icon: PackageIcon, badge: newOrders, badgeLabel: 'orders.tabNew' },
    { to: '/farmer/storage', label: 'nav.storage', icon: WarehouseIcon },
    { to: '/farmer/reviews', label: 'nav.reviews', icon: StarIcon },
  ]
  return <AppHeader homePath="/farmer" links={links} />
}
