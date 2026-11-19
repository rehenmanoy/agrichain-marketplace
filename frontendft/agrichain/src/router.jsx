import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import Account from '@/pages/Account'
import AccountLayout from '@/pages/AccountLayout'
import FarmerReviews from '@/pages/farmer/Reviews'
import LandingPage from '@/pages/LandingPage'
import { ComingSoon, RouteError } from '@/pages/Misc'
import Error404Page from '@/pages/Error404Page'
import FarmerLayout from '@/pages/farmer/FarmerLayout'
import Dashboard from '@/pages/farmer/Dashboard'
import Produce from '@/pages/farmer/Produce'
import Orders from '@/pages/farmer/Orders'
import Storage from '@/pages/farmer/Storage'
import BuyerLayout from '@/pages/buyer/BuyerLayout'
import BuyerDashboard from '@/pages/buyer/Dashboard'
import Shop from '@/pages/buyer/Shop'
import Cart from '@/pages/buyer/Cart'
import BuyerOrders from '@/pages/buyer/Orders'
import PartnerLayout from '@/pages/partner/PartnerLayout'
import PartnerHome from '@/pages/partner/Home'
import Available from '@/pages/partner/Available'
import MyDeliveries from '@/pages/partner/MyDeliveries'
import OwnerLayout from '@/pages/owner/OwnerLayout'
import OwnerHome from '@/pages/owner/Home'
import OwnerWarehouses from '@/pages/owner/Warehouses'
import OwnerBookings from '@/pages/owner/Bookings'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      {
        // The same page for every role, under that role's own top bar
        element: <RequireAuth />,
        children: [{ path: '/account', element: <AccountLayout />, children: [{ index: true, element: <Account /> }] }],
      },
      { path: '/coming-soon', element: <ComingSoon /> },
      {
        element: <RequireRole role="FARMER" />,
        children: [
          {
            path: '/farmer',
            element: <FarmerLayout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'produce', element: <Produce /> },
              { path: 'orders', element: <Orders /> },
              { path: 'storage', element: <Storage /> },
              { path: 'reviews', element: <FarmerReviews /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="BUYER" />,
        children: [
          {
            path: '/buyer',
            element: <BuyerLayout />,
            children: [
              { index: true, element: <BuyerDashboard /> },
              { path: 'shop', element: <Shop /> },
              { path: 'cart', element: <Cart /> },
              { path: 'orders', element: <BuyerOrders /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="DELIVERY_PARTNER" />,
        children: [
          {
            path: '/partner',
            element: <PartnerLayout />,
            children: [
              { index: true, element: <PartnerHome /> },
              { path: 'available', element: <Available /> },
              { path: 'deliveries', element: <MyDeliveries /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="WAREHOUSE_OWNER" />,
        children: [
          {
            path: '/owner',
            element: <OwnerLayout />,
            children: [
              { index: true, element: <OwnerHome /> },
              { path: 'warehouses', element: <OwnerWarehouses /> },
              { path: 'bookings', element: <OwnerBookings /> },
            ],
          },
        ],
      },
      { path: '/404error', element: <Error404Page /> },
      // Any unknown address goes to the 404 page
      { path: '*', element: <Navigate to="/404error" replace /> },
    ],
  },
])
