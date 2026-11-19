import { HouseIcon, PackageIcon, ShoppingCartSimpleIcon, StorefrontIcon } from '@phosphor-icons/react'
import { useMyOrders } from '@/api/buyer'
import { useCart } from '@/api/cart'
import { AppHeader } from './AppHeader'

const ACTIVE = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY']

export function BuyerHeader() {
  const orders = useMyOrders()
  const cart = useCart()
  const active = orders.data?.filter((o) => ACTIVE.includes(o.status)).length ?? 0

  const links = [
    { to: '/buyer', label: 'nav.home', icon: HouseIcon, end: true },
    { to: '/buyer/shop', label: 'nav.shop', icon: StorefrontIcon },
    { to: '/buyer/cart', label: 'nav.cart', icon: ShoppingCartSimpleIcon, badge: cart.data?.item_count ?? 0, badgeLabel: 'cart.tabItems' },
    { to: '/buyer/orders', label: 'nav.myOrders', icon: PackageIcon, badge: active, badgeLabel: 'buyer.tabActive' },
  ]
  return <AppHeader homePath="/buyer" links={links} />
}
