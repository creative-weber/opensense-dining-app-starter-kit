import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, MessageSquareText, QrCode, ShoppingCart, Store } from 'lucide-react';
import PublicPageShell from '../components/PublicPageShell';

const DEMO_STEPS = [
  {
    icon: QrCode,
    title: 'Scan the QR code',
    description: 'Open the sample restaurant from your phone or desktop browser.',
  },
  {
    icon: ShoppingCart,
    title: 'Add dishes to the cart',
    description: 'Use the same menu and checkout flow the live app uses.',
  },
  {
    icon: ChefHat,
    title: 'Watch the kitchen handoff',
    description: 'The admin dashboard receives the order immediately after checkout.',
  },
];

const SAMPLE_ITEMS = [
  'Paneer tikka wrap',
  'Herb rice bowl',
  'Mango lime soda',
  'Dark chocolate brownie',
];

export default function DemoPage() {
  return (
    <PublicPageShell
      eyebrow="Customer demo"
      title="A safe public demo for the dining experience"
      description="This page is designed for people evaluating the project. It gives a quick walk-through of the guest flow and links to the live ordering route and the admin dashboard."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">How the demo works</p>
            <div className="mt-4 space-y-4">
              {DEMO_STEPS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-950">{title}</h2>
                    <p className="text-sm text-stone-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu/demo?table=12"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Open the live menu demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="http://localhost:5173/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              Open admin dashboard
            </a>
          </div>
        </section>

        <aside className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-stone-950 px-4 py-3 text-white">
            <Store className="h-5 w-5 text-amber-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Sample restaurant</p>
              <p className="text-sm text-white/70">OpenDining Demo Kitchen</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {SAMPLE_ITEMS.map((item) => (
              <div key={item} className="rounded-2xl border border-stone-200 px-4 py-3">
                <p className="font-medium text-stone-950">{item}</p>
                <p className="text-sm text-stone-500">Demo menu item shown in the public showcase.</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-brand/5 p-4 text-sm text-stone-600">
            <MessageSquareText className="mb-2 h-5 w-5 text-brand" aria-hidden="true" />
            Public demos should never expose private restaurant data. This route is intentionally safe to share.
          </div>
        </aside>
      </div>
    </PublicPageShell>
  );
}