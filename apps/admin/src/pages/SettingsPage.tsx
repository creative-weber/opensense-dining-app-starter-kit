import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import type { RestaurantSettings, OpenHours, DayHours } from '../types';
import { ExternalLink, Save } from 'lucide-react';

const DAYS: { key: keyof OpenHours; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_DAY: DayHours = { open: '09:00', close: '22:00', closed: false };

function makeDefaultHours(): OpenHours {
  return {
    mon: { ...DEFAULT_DAY }, tue: { ...DEFAULT_DAY }, wed: { ...DEFAULT_DAY },
    thu: { ...DEFAULT_DAY }, fri: { ...DEFAULT_DAY },
    sat: { ...DEFAULT_DAY }, sun: { ...DEFAULT_DAY },
  };
}

export default function SettingsPage() {
  const { setAuth, token, restaurantId, slug } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#f97316');
  const [kdsPin, setKdsPin] = useState('');
  const [openHours, setOpenHours] = useState<OpenHours>(makeDefaultHours());
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);

  const kdsPath = slug
    ? `/kitchen/${slug}${restaurantId ? `?rid=${encodeURIComponent(restaurantId)}` : ''}`
    : null;

  useEffect(() => {
    api.get<RestaurantSettings>('/admin/restaurant')
      .then(({ data }) => {
        setName(data.name ?? '');
        setAddress(data.address ?? '');
        setPhone(data.phone ?? '');
        setLogoUrl(data.logo_url ?? '');
        setBrandColor(data.brand_color ?? '#f97316');
        setKdsPin(data.kds_pin ?? '');
        setOpenHours(data.open_hours ?? makeDefaultHours());
        setDailySummaryEnabled(data.daily_summary_enabled ?? false);
      })
      .catch((err: unknown) => {
        handleApiError(err, { operation: 'fetch settings', page: 'SettingsPage' });
      })
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (day: keyof OpenHours, field: keyof DayHours, value: string | boolean) => {
    setOpenHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const { data } = await api.put<RestaurantSettings>('/admin/restaurant', {
        name: name.trim() || undefined,
        address: address.trim() || null,
        logoUrl: logoUrl.trim() || null,
        phone: phone.trim() || null,
        brandColor,
        kdsPin: kdsPin.trim() || null,
        openHours,
        dailySummaryEnabled,
      });
      // Sync restaurant name in auth store if it changed
      if (token && restaurantId) {
        setAuth({ token, restaurantId, restaurantName: data.name, slug: data.slug });
      }
      handleSuccess('Settings saved successfully');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      handleApiError(err, { operation: 'save settings', page: 'SettingsPage' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="h-8 w-40 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Restaurant Profile ─────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Restaurant Profile</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">Restaurant Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-base
                           focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-base
                           focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-600 mb-1">Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-600 mb-1">Logo URL</label>
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base
                         focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
        </section>

        {/* ── Branding ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Branding</h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">Brand Color</label>
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-16 rounded-lg border border-border cursor-pointer" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-medium text-gray-600 mb-1">Hex Value</label>
              <input type="text" value={brandColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBrandColor(e.target.value); }}
                maxLength={7}
                className="w-32 border border-border rounded-xl px-3 py-2.5 text-base font-mono
                           focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: brandColor }} />
              <span className="text-base text-muted">Customer menu accent</span>
            </div>
          </div>
        </section>

        {/* ── Operating Hours ───────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-gray-900">Operating Hours</h2>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 flex-wrap">
                <span className="w-24 text-base font-medium text-gray-700">{label}</span>
                <label className="flex items-center gap-1.5 text-base text-muted cursor-pointer">
                  <input type="checkbox" checked={openHours[key].closed}
                    onChange={(e) => updateDay(key, 'closed', e.target.checked)}
                    className="rounded" />
                  Closed
                </label>
                {!openHours[key].closed && (
                  <>
                    <input type="time" value={openHours[key].open}
                      onChange={(e) => updateDay(key, 'open', e.target.value)}
                      className="border border-border rounded-lg px-2 py-1.5 text-base
                                 focus:outline-none focus:ring-2 focus:ring-brand" />
                    <span className="text-base text-muted">to</span>
                    <input type="time" value={openHours[key].close}
                      onChange={(e) => updateDay(key, 'close', e.target.value)}
                      className="border border-border rounded-lg px-2 py-1.5 text-base
                                 focus:outline-none focus:ring-2 focus:ring-brand" />
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── KDS PIN ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="font-bold text-gray-900">Kitchen Display PIN</h2>
            <p className="text-base text-muted mt-0.5">Staff use this PIN to access the Kitchen Display System.</p>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-600 mb-1">PIN (4–6 digits)</label>
            <input type="password" value={kdsPin} onChange={(e) => setKdsPin(e.target.value)}
              maxLength={6} placeholder="e.g. 1234"
              pattern="[0-9]{4,6}"
              className="w-36 border border-border rounded-xl px-3 py-2.5 text-base font-mono
                         focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div className="pt-1">
            {kdsPath ? (
              <Link
                to={kdsPath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-border bg-gray-50 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Open Kitchen Display
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-base text-muted">Save settings once so your Kitchen Display URL can be generated.</p>
            )}
          </div>
        </section>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-gray-900 mb-3">Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={dailySummaryEnabled}
                onChange={(e) => setDailySummaryEnabled(e.target.checked)} />
              <div className="w-10 h-6 bg-gray-200 peer-checked:bg-brand rounded-full transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                              peer-checked:translate-x-4 transition-transform" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">Daily summary report</p>
              <p className="text-base text-muted">Receive an end-of-day revenue &amp; order summary.</p>
            </div>
          </label>
        </section>

        {/* ── Save bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand text-white text-base font-semibold
                       px-5 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {success && <p className="text-base text-emerald-600 font-medium">Settings saved!</p>}
          {error && <p className="text-base text-red-600">{error}</p>}
        </div>

      </form>
    </div>
  );
}
