import { useEffect, useState } from 'react';
import api from '../api';
import useAuthStore from '../store/authStore';
import { handleApiError } from '../utils/errorHandler';
import type { Order } from '../types';
import { ClipboardList, ShoppingBag, Table2, Utensils } from 'lucide-react';

export default function DashboardPage() {
  const { restaurantName, slug } = useAuthStore();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<Order[]>('/admin/orders?status=pending')
      .then(({ data }) => setPendingCount(data.length))
      .catch((err) => {
        handleApiError(err, { operation: 'fetch pending orders', page: 'DashboardPage' });
      });
  }, []);

  const customerUrl = `${window.location.origin.replace(':5173', ':5174')}/menu/${slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{restaurantName}</h1>
        <p className="text-base text-muted mt-0.5">Welcome back!</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-slate-600" aria-hidden="true" />
            </div>
            <span className="text-base font-medium text-muted">Pending Orders</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {pendingCount === null ? '…' : pendingCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-brand" aria-hidden="true" />
            </div>
            <span className="text-base font-medium text-muted">Your Menu</span>
          </div>
          <a href="/menu" className="text-base font-semibold text-brand hover:underline">Manage →</a>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <h2 className="font-bold text-gray-900">Quick Actions</h2>
        <a href="/tables"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Table2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-base">Generate QR Codes</p>
            <p className="text-base text-muted">Print QR codes for each table</p>
          </div>
        </a>
        <a href="/orders"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors">
          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-teal-700" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-base">View Live Orders</p>
            <p className="text-base text-muted">Update order statuses</p>
          </div>
        </a>
      </div>

      {/* Menu URL */}
      {slug && (
        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4">
          <p className="text-base font-semibold text-brand mb-1">Your Public Menu URL</p>
          <a
            href={customerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base text-gray-800 break-all hover:underline"
          >
            {customerUrl}
          </a>
        </div>
      )}
    </div>
  );
}
