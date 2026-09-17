export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Privacy</p>
        <h1 className="mt-3 text-3xl font-black text-white">Privacy notice</h1>
        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-300">
          <p>
            byteblast.xyz is designed to keep public-facing information minimal, operationally transparent, and respectful of user privacy.
          </p>
          <p>
            Contact requests may be processed only as needed to respond to inquiries, and administrative operations remain restricted to authenticated system operators.
          </p>
          <p>
            No sensitive operational data is exposed to anonymous visitors. Monitoring, deployment state, and private administrative surfaces are intentionally isolated behind secure access controls.
          </p>
        </div>
      </div>
    </main>
  );
}
