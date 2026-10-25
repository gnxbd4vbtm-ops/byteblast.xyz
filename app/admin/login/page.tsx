import PasskeyLoginForm from "./passkey-login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center bg-[var(--background)] px-5 py-10 text-[var(--foreground)]">
      <div className="w-full rounded-md border border-[var(--line)] bg-[#18191c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">Private access</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--copy)]">
          Use the credentials configured in the environment to access the private operations dashboard.
        </p>

        <PasskeyLoginForm />
      </div>
    </main>
  );
}
