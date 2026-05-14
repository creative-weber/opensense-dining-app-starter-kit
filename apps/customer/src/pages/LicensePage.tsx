import PublicPageShell from '../components/PublicPageShell';

export default function LicensePage() {
  return (
    <PublicPageShell
      eyebrow="License"
      title="MIT licensed open source software"
      description="OpenSense Dining is intended to be shared, modified, and self-hosted under the MIT License."
    >
      <section>
        <h2 className="text-lg font-semibold text-stone-950">What that means</h2>
        <p className="mt-2">You can use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the MIT license terms.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-950">What to check in the repository</h2>
        <p className="mt-2">The repository root should include a LICENSE file so downstream users can verify the full license text quickly.</p>
      </section>
    </PublicPageShell>
  );
}