import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { handleApiError } from '../utils/errorHandler';
import { Utensils } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ restaurantName: '', slug: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Auto-generate slug from restaurant name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      restaurantName: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; restaurantId: string; restaurantName: string; slug: string }>(
        '/auth/register',
        form
      );
      setAuth({ token: data.token, restaurantId: data.restaurantId, restaurantName: data.restaurantName, slug: data.slug });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      handleApiError(err, { operation: 'register', page: 'RegisterPage' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl mb-4">
            <Utensils className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Restaurant</h1>
          <p className="text-base text-muted mt-1">Set up your free account in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label htmlFor="rname" className="block text-base font-medium text-gray-600 mb-1">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input id="rname" type="text" required value={form.restaurantName} onChange={handleNameChange}
              placeholder="e.g. Spice Garden"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>

          <div>
            <label htmlFor="slug" className="block text-base font-medium text-gray-600 mb-1">
              Menu URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand">
              <span className="px-2 text-base text-muted bg-gray-50 border-r border-border py-2.5 whitespace-nowrap">
                /menu/
              </span>
              <input id="slug" type="text" required value={form.slug}
                onChange={set('slug')}
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                className="flex-1 px-2 py-2.5 text-base focus:outline-none" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input id="email" type="email" required value={form.email} onChange={set('email')}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>

          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-600 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input id="password" type="password" required minLength={8} value={form.password} onChange={set('password')}
              placeholder="Minimum 8 characters"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>

          {error && <p className="text-base text-red-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-base text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
