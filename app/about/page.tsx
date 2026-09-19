import Link from "next/link";

const timeline = [
  { label: "Engineering mindset", value: "Designing systems that are simple, secure, and operationally clear." },
  { label: "Product lens", value: "Balancing user experience with maintainability and deployment clarity." },
  { label: "Ops focus", value: "Treating uptime, observability, and resilience as core product quality." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 md:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <span aria-hidden="true">←</span> Back
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">About</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">I build software that works in the real world.</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 text-sm leading-7 text-slate-300">
            <p>
              I am a developer and operator focused on building reliable software, secure systems, and clean product experiences. My work bridges product thinking with infrastructure discipline so the result feels polished without losing operational clarity.
            </p>
            <p>
              That means I care about the complete lifecycle: architecture decisions, shipping velocity, deployment reliability, observability, and how the system behaves once real users begin depending on it.
            </p>
            <p>
              My projects tend to sit at the intersection of product engineering, self-hosted operations, and secure automation. I prefer systems that are understandable, measurable, and resilient under pressure.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Core strengths</p>
            <div className="mt-5 space-y-4">
              {timeline.map((item) => (
                <div key={item.label} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
