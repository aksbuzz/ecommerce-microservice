import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { LoginPage } from '@/pages/auth/login.page'
import { RegisterPage } from '@/pages/auth/register.page'
import { BasketPage } from '@/pages/basket/basket.page'
import { CatalogPage } from '@/pages/catalog/catalog.page'
import { ProductDetailPage } from '@/pages/catalog/product-detail.page'
import { CheckoutPage } from '@/pages/checkout/checkout.page'
import { CheckoutSuccessPage } from '@/pages/checkout/checkout-success.page'
import { OrderDetailPage } from '@/pages/orders/order-detail.page'
import { OrderHistoryPage } from '@/pages/orders/order-history.page'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <PageLayout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/products/:id', element: <ProductDetailPage /> },
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/basket', element: <BasketPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/checkout/success', element: <CheckoutSuccessPage /> },
          { path: '/orders', element: <OrderHistoryPage /> },
          { path: '/orders/:id', element: <OrderDetailPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
