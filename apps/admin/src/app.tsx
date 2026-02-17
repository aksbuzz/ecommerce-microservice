import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { BrandsPage } from '@/pages/catalog/brands/brands.page'
import { ItemsPage } from '@/pages/catalog/items/items.page'
import { TypesPage } from '@/pages/catalog/types/types.page'
import { DashboardPage } from '@/pages/dashboard/dashboard.page'
import { LoginPage } from '@/pages/login/login.page'
import { OrdersPage } from '@/pages/orders/orders.page'
import { WebhooksPage } from '@/pages/webhooks/webhooks.page'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/catalog/items', element: <ItemsPage /> },
          { path: '/catalog/brands', element: <BrandsPage /> },
          { path: '/catalog/types', element: <TypesPage /> },
          { path: '/orders', element: <OrdersPage /> },
          { path: '/webhooks', element: <WebhooksPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
