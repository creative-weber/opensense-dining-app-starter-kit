import PublicPageShell from '../components/PublicPageShell';

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy policy"
      title="Privacy by design for a dine-in workflow"
      description="The app is intentionally conservative with data. It only collects the information needed to place and manage restaurant orders."
    >
      <section>
        <h2 className="text-lg font-semibold text-stone-950">What we collect</h2>
        <p className="mt-2">Guest name, phone number, order contents, and table details that are necessary to complete an order.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-950">How data is used</h2>
        <p className="mt-2">Order data is routed to the restaurant workflow, displayed in the admin dashboard, and used to provide status updates to guests.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-950">What we do not do</h2>
        <p className="mt-2">The app does not sell guest data, and the customer experience can be used without account creation for the demo ordering flow.</p>
      </section>
    </PublicPageShell>
  );
}