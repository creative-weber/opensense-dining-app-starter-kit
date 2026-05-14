import PublicPageShell from '../components/PublicPageShell';

const SUPPORT_ITEMS = [
  {
    title: 'Repository issues',
    text: 'Use the project issue tracker for bugs, feature requests, and deployment questions.',
  },
  {
    title: 'Deployment owner',
    text: 'If you are using a hosted instance, the restaurant or deployment operator should be your first contact.',
  },
  {
    title: 'In-app help',
    text: 'The customer and admin apps both expose help affordances for day-to-day operations.',
  },
];

export default function SupportPage() {
  return (
    <PublicPageShell
      eyebrow="Support"
      title="Need help using OpenSense Dining?"
      description="This open source build keeps support lightweight: repository issues, operator contact, and the built-in help UI cover the most common needs."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORT_ITEMS.map((item) => (
          <section key={item.title} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-lg font-semibold text-stone-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
          </section>
        ))}
      </div>
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-lg font-semibold">What to include in a support request</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          <li>The route or screen where the issue appears.</li>
          <li>What you expected to happen and what happened instead.</li>
          <li>Any browser, device, or restaurant configuration details that might matter.</li>
        </ul>
      </section>
    </PublicPageShell>
  );
}