import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { handleApiError } from '../utils/errorHandler';
import { Utensils } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; restaurantId: string; restaurantName: string; slug: string }>(
        '/auth/login',
        { email, password }
      );
      setAuth({ token: data.token, restaurantId: data.restaurantId, restaurantName: data.restaurantName, slug: data.slug });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError('Invalid email or password.');
      handleApiError(err, { operation: 'login', page: 'LoginPage' }, 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl mb-4">
            <Utensils className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OpenDining Admin</h1>
          <p className="text-base text-muted mt-1">Sign in to manage your restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-600 mb-1">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-600 mb-1">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          {error && <p className="text-base text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-base text-muted mt-4">
          New restaurant?{' '}
          <Link to="/register" className="text-brand font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
