type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function PublicPageShell({ eyebrow, title, description, children }: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#f8fafc_100%)]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-stone-200 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">{description}</p>
          <div className="mt-8 space-y-6 text-base leading-7 text-stone-700">{children}</div>
        </div>
      </div>
    </div>
  );
}