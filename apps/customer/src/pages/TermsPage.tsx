import PublicPageShell from '../components/PublicPageShell';

const TERMS = [
  'Restaurants are responsible for menu accuracy, pricing, and service operations.',
  'The software is provided as-is for internal operations and public demonstrations.',
  'Guests and operators should comply with local laws, tax rules, and food safety requirements.',
];

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms and conditions"
      title="Terms for open source use"
      description="These terms are intentionally short and practical so the project can be evaluated, self-hosted, and modified with clear expectations."
    >
      <section>
        <h2 className="text-lg font-semibold text-stone-950">Core terms</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-950">Operational note</h2>
        <p className="mt-2">If you self-host the project, you own your deployment, backups, menu content, and customer support obligations.</p>
      </section>
    </PublicPageShell>
  );
}