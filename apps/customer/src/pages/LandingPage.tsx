import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, QrCode, ShieldCheck, Sparkles, Utensils, UtensilsCrossed } from 'lucide-react';

const STEPS = [
  {
    Icon: QrCode,
    title: 'Scan the table QR',
    desc: 'Each table can open the ordering flow from a QR code or direct link.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Browse the live menu',
    desc: 'Guests can filter dishes, see prices, and build an order without installing anything.',
  },
  {
    Icon: LayoutDashboard,
    title: 'Hand off to the kitchen',
    desc: 'Orders move into the admin dashboard and kitchen workflow immediately.',
  },
  {
    Icon: ShieldCheck,
    title: 'Track and support the flow',
    desc: 'The guest, kitchen, and operator views stay aligned from order to completion.',
  },
];

const FOOTER_LINKS = [
  { to: '/demo', label: 'Demo' },
  { to: '/support', label: 'Support' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/license', label: 'License' },
];

const ADMIN_DASHBOARD_URL = 'http://localhost:5173/dashboard';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed,transparent_35%),linear-gradient(180deg,#fffaf5_0%,#f8fafc_55%,#ffffff_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-stone-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/20">
              <Utensils className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Open source dining</p>
              <p className="text-sm text-stone-500">Guest demo, admin dashboard, and compliance pages in one place.</p>
            </div>
          </div>
          <a
            href={ADMIN_DASHBOARD_URL}
            className="hidden items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 sm:inline-flex"
          >
            Admin dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </header>

        <main className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <section className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Open source restaurant ordering
            </p>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-stone-950 sm:text-6xl">
              Show the dining flow before the first order is placed.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600 sm:text-xl">
              This landing page demonstrates the guest experience, links to a live demo, and gives
              operators a direct path into the admin dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
              >
                Open dining demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={ADMIN_DASHBOARD_URL}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-base font-semibold text-stone-900 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              >
                Open admin dashboard
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ Icon, title, desc }, idx) => (
                <div key={title} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Step {idx + 1}</p>
                  <h2 className="mt-1 text-base font-semibold text-stone-900">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="rounded-[28px] bg-stone-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Demo snapshot</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Table 12</p>
                  <p className="text-sm text-white/70">QR link opened from the landing page</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Spiced paneer wrap</p>
                  <p className="text-sm text-white/70">Add to cart, checkout, and track status</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Kitchen display</p>
                  <p className="text-sm text-white/70">Orders appear instantly for staff</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/support"
                className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
              >
                Support
              </Link>
              <Link
                to="/license"
                className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
              >
                License
              </Link>
            </div>
          </aside>
        </main>

        <footer className="flex flex-col gap-3 border-t border-stone-200 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for open source demos, guest ordering, and restaurant operations.</p>
          <nav className="flex flex-wrap gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="font-medium text-stone-600 transition hover:text-stone-950">
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
}
