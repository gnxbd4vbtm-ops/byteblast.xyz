export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Terms</p>
        <h1 className="mt-3 text-3xl font-black text-white">Terms of use</h1>
        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-300">
          <p>
            This site is provided as a portfolio and operational status surface for byteblast.xyz. The content may be updated at any time without prior notice in order to reflect active work, status changes, or service maintenance.
          </p>
          <p>
            The private administrative interface is restricted to authorized personnel and must not be used or accessed without appropriate permissions.
          </p>
          <p>
            Any external links, integrations, or public project references are provided for informational purposes and may change over time as projects evolve.
          </p>
        </div>
      </div>
    </main>
  );
}
