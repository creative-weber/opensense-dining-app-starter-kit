import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RequireAuth() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
