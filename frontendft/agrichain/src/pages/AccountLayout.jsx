import { AppShell } from '@/components/AppShell'
import { BuyerHeader } from '@/components/BuyerHeader'
import { FarmerHeader } from '@/components/FarmerHeader'
import { OwnerHeader } from '@/components/OwnerHeader'
import { PartnerHeader } from '@/components/PartnerHeader'
import { useAuth } from '@/auth/AuthContext'

const HEADERS = {
  FARMER: FarmerHeader,
  BUYER: BuyerHeader,
  DELIVERY_PARTNER: PartnerHeader,
  WAREHOUSE_OWNER: OwnerHeader,
}

/** The account page is the same for every role, but sits under that role's own top bar */
export default function AccountLayout() {
  const { user } = useAuth()
  const Header = HEADERS[user?.role] ?? FarmerHeader
  return <AppShell header={<Header />} />
}
