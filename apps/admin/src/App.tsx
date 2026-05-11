import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const TablesPage = lazy(() => import('./pages/TablesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-surface-2 px-4 py-6" aria-hidden="true">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-56 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
