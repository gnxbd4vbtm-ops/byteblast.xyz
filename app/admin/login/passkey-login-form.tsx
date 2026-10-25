"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type ApiResponse = {
  error?: string;
};

const fieldClassName =
  "w-full rounded-md border border-[var(--border-strong)] bg-[#0b0c0e] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

async function postJson<T = ApiResponse>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(result.error ?? "The request could not be completed.");
  }

  return result as T;
}

function getPasskeyFailureMessage(error: unknown, operation: "registration" | "authentication") {
  if (error instanceof Error && error.name === "NotAllowedError") {
    return operation === "authentication"
      ? "Passkey sign-in was canceled or timed out. If you have not registered a passkey on this device, sign in with your password and register one first."
      : "Passkey registration was canceled or timed out. Try again.";
  }

  return error instanceof Error ? error.message : `Passkey ${operation} failed.`;
}

export default function PasskeyLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loginError, setLoginError] = useState("");

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });

      if (response.redirected) {
        router.push("/admin");
        return;
      }

      const result = (await response.json()) as ApiResponse;
      setLoginError(result.error ?? "Sign-in failed.");
    } catch {
      setLoginError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function registerPasskey() {
    setBusy(true);
    setMessage("");

    try {
      const options = await postJson<PublicKeyCredentialCreationOptionsJSON>("/api/admin/passkey/register/options", {
        username,
        password,
      });
      const response = await startRegistration({ optionsJSON: options });
      await postJson("/api/admin/passkey/register/verify", { response });
      setMessage("Passkey registered. You can now sign in with it.");
    } catch (error) {
      setMessage(getPasskeyFailureMessage(error, "registration"));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPasskey() {
    setBusy(true);
    setMessage("");

    try {
      const options = await postJson<PublicKeyCredentialRequestOptionsJSON>(
        "/api/admin/passkey/authenticate/options",
        {},
      );
      const response = await startAuthentication({ optionsJSON: options });
      await postJson("/api/admin/passkey/authenticate/verify", { response });
      router.push("/admin");
    } catch (error) {
      setMessage(getPasskeyFailureMessage(error, "authentication"));
      setBusy(false);
    }
  }

  return (
    <>
      <form action="/api/admin/login" method="post" onSubmit={signInWithPassword} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm text-[var(--copy)]">
          <span>Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username webauthn"
            className={`${fieldClassName} admin-username-input`}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setLoginError("");
            }}
            required
          />
        </label>

        <label className="block space-y-2 text-sm text-[var(--copy)]">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className={fieldClassName}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setLoginError("");
            }}
            required
          />
        </label>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
          disabled={busy}
        >
          Sign in with password
        </button>
        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-400">
          {loginError}
        </p>
      </form>

      <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
        <button
          type="button"
          onClick={signInWithPasskey}
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-md border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Waiting for passkey..." : "Sign in with a passkey"}
        </button>
        <button
          type="button"
          onClick={registerPasskey}
          disabled={busy || !username.trim() || !password}
          className="w-full text-sm text-[var(--copy)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Register a passkey with your password
        </button>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-[var(--copy)]">
          {message}
        </p>
      </div>
    </>
  );
}