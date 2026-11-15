import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { PageSpinner } from '@/components/common/PageSpinner'

// ── Storefront pages (lazy loaded) ────────────────────────────────────────────
const HomePage = lazy(() => import('@/pages/HomePage'))
const ShopPage = lazy(() => import('@/pages/ShopPage'))
const CollectionPage = lazy(() => import('@/pages/CollectionPage'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'))
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage'))
const OurStoryPage = lazy(() => import('@/pages/OurStoryPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const ShippingPolicyPage = lazy(() => import('@/pages/policies/ShippingPolicyPage'))
const CancellationPolicyPage = lazy(() => import('@/pages/policies/CancellationPolicyPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/policies/PrivacyPolicyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// ── Admin pages (lazy loaded) ─────────────────────────────────────────────────
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'))
const AdminMaterialsPage = lazy(() => import('@/pages/admin/AdminMaterialsPage'))
const AdminRecipesPage = lazy(() => import('@/pages/admin/AdminRecipesPage'))
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'))
const AdminCostingPage = lazy(() => import('@/pages/admin/AdminCostingPage'))
const AdminExpensesPage = lazy(() => import('@/pages/admin/AdminExpensesPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))

export default function App() {
  return (
    <>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* ── Storefront ─────────────────────────────────────────────── */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderCode" element={<OrderConfirmationPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/our-story" element={<OurStoryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/policies/shipping" element={<ShippingPolicyPage />} />
            <Route path="/policies/cancellations" element={<CancellationPolicyPage />} />
            <Route path="/policies/privacy" element={<PrivacyPolicyPage />} />
          </Route>

          {/* ── Admin auth ─────────────────────────────────────────────── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── Admin protected area ───────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductEditPage />} />
            <Route path="products/:id/edit" element={<AdminProductEditPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="materials" element={<AdminMaterialsPage />} />
            <Route path="recipes" element={<AdminRecipesPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="costing" element={<AdminCostingPage />} />
            <Route path="expenses" element={<AdminExpensesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* ── 404 ────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}
