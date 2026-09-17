export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-5 py-10">
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Private access</p>
        <h1 className="mt-3 text-3xl font-black text-white">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Use the credentials configured in the environment to access the private operations dashboard.
        </p>

        <form action="/api/admin/login" method="post" className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm text-slate-200">
            <span>Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="admin"
              required
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="••••••••"
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
