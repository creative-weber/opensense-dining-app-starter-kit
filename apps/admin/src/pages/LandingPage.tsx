import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ChefHat, QrCode, ShieldCheck, UtensilsCrossed } from 'lucide-react';

const FEATURES = [
  {
    icon: QrCode,
    title: 'Guest ordering demo',
    description: 'Show the public customer flow before users enter the authenticated dashboard.',
  },
  {
    icon: ChefHat,
    title: 'Kitchen handoff',
    description: 'Orders flow into the dashboard and the KDS-ready workflow immediately.',
  },
  {
    icon: BarChart3,
    title: 'Operational visibility',
    description: 'Track orders, tables, menu items, and settings from a single admin shell.',
  },
];

const CUSTOMER_DEMO_URL = 'http://localhost:5174/demo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-stone-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Open source admin</p>
            <h1 className="text-lg font-bold text-stone-950">OpenSense Dining</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <section className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Operator dashboard entry point
            </p>
            <h2 className="mt-6 text-5xl font-black tracking-tight text-stone-950 sm:text-6xl">
              Route users from the public demo into the admin workflow.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600 sm:text-xl">
              This landing page keeps the dashboard public enough to discover, while the actual
              operational screens stay behind authentication.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={CUSTOMER_DEMO_URL}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-base font-semibold text-stone-900 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              >
                View customer demo
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-stone-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="rounded-[28px] bg-stone-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Dashboard view</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Live orders</p>
                  <p className="text-sm text-white/70">Pending, preparing, ready, and served states</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Table management</p>
                  <p className="text-sm text-white/70">QR codes and capacity planning</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Menu control</p>
                  <p className="text-sm text-white/70">Availability, pricing, and category management</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              <UtensilsCrossed className="mb-2 h-5 w-5 text-brand" aria-hidden="true" />
              Public visitors can explore the demo first, then operators move into the authenticated dashboard.
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}