import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const MenuPage = lazy(() => import('./pages/MenuPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const LicensePage = lazy(() => import('./pages/LicensePage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderStatusPage = lazy(() => import('./pages/OrderStatusPage'));
const ActiveOrdersPage = lazy(() => import('./pages/ActiveOrdersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-surface-2 px-4 py-6" aria-hidden="true">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-8 w-40 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-12 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/license" element={<LicensePage />} />
          <Route path="/menu/:slug" element={<MenuPage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          <Route path="/order/:orderId" element={<OrderStatusPage />} />
          <Route path="/orders" element={<ActiveOrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
