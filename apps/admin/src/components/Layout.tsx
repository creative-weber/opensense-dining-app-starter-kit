import { NavLink, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LayoutDashboard, Utensils, Table2, ClipboardList, Settings, LogOut } from 'lucide-react';

const NAV = [
  { to: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/menu', Icon: Utensils, label: 'Menu' },
  { to: '/tables', Icon: Table2, label: 'Tables & QR' },
  { to: '/orders', Icon: ClipboardList, label: 'Orders' },
  { to: '/settings', Icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { restaurantName, clearAuth } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-surface-2">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-border">
        <div className="px-5 py-5 border-b border-border">
          <p className="text-base text-muted">Admin</p>
          <p className="font-bold text-gray-900 truncate">{restaurantName}</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={clearAuth}
            className="flex items-center gap-2 text-base text-muted hover:text-red-600 transition-colors px-3 py-2.5 w-full rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex">
        {NAV.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 text-base font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-muted'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
