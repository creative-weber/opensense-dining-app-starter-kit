import { QrCode, Utensils, ShoppingCart, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    Icon: QrCode,
    title: 'Scan QR at Your Table',
    desc: 'Every table has a unique QR code. Point your phone camera and tap the link.',
  },
  {
    Icon: Utensils,
    title: 'Browse the Menu',
    desc: "See the full menu with photos, prices, and veg/non-veg indicators. No app needed.",
  },
  {
    Icon: ShoppingCart,
    title: 'Add Items & Checkout',
    desc: 'Build your order at your own pace and place it in seconds.',
  },
  {
    Icon: CheckCircle2,
    title: 'Sit Back & Relax',
    desc: 'Your order goes straight to the kitchen. Track its status in real time.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-2">
      {/* Hero */}
      <div className="bg-brand text-white py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
            <Utensils className="w-9 h-9" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">OpenDining</h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Scan the QR code at your table, browse the menu, and order directly from your phone —
            no waiting for a waiter.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
        <div className="space-y-6">
          {STEPS.map(({ Icon, title, desc }, idx) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-brand" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-semibold text-brand uppercase tracking-wide mb-0.5">
                  Step {idx + 1}
                </p>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-base text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white rounded-2xl border border-border text-center">
          <p className="text-base text-muted mb-1">Are you a restaurant owner?</p>
          <a
            href="http://localhost:5173"
            className="inline-block mt-2 px-5 py-2.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors text-base min-h-11"
          >
            Set up your restaurant →
          </a>
        </div>
      </div>
    </div>
  );
}
