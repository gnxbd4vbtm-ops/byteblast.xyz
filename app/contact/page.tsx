const contactMethods = [
  { label: "Email", value: "contact@byteblast.xyz", href: "mailto:contact@byteblast.xyz" },
  { label: "Admin", value: "admin@byteblast.xyz", href: "mailto:admin@byteblast.xyz" },
  { label: "GitHub", value: "github.byteblast.xyz", href: "https://github.byteblast.xyz" },
];

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Contact</p>
          <h1 className="mt-3 text-3xl font-black text-white">Let’s build something dependable.</h1>
          <div className="mt-6 space-y-4">
            {contactMethods.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="block rounded-2xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-cyan-500/30"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Send a note</p>
          <form action="/api/contact" method="post" className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block">Name</span>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-200">
              <span className="mb-2 block">Subject</span>
              <input
                type="text"
                name="subject"
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block text-sm text-slate-200">
              <span className="mb-2 block">Message</span>
              <textarea
                name="message"
                rows={6}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <button
              type="submit"
              className="inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
