# byteblast.xyz

## What is it?

This is my personal site and infrastructure status surface. It is a Next.js app for my portfolio, public status page, admin tools, and the small pieces of operational tooling I use to keep the site running.

## Why does it exist?

I wanted one place to present my work, keep the site status visible, and manage the little operational details without fighting a bunch of disconnected tools. It keeps the site itself, the uptime/status information, and the admin controls in one self-hosted setup.

## How do I install/use it?

Requirements:

- Node.js 22 or later
- npm

Setup:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000 in a browser.

The app reads site, email, authentication, and optional GitHub settings from environment variables. See .env.example for the full list. Admin login supports a password and WebAuthn passkeys. Authentication has no built-in fallback credentials; configure these values explicitly:

- `ADMIN_USERNAME` and `ADMIN_PASSWORD` for admin login
- `ADMIN_SESSION_SECRET` for signing and verifying admin sessions only
- `PASSKEY_CHALLENGE_SECRET` for signing short-lived WebAuthn challenges
- `STATUS_API_KEY` for authenticating requests to `/api/v1/status`

For Apple iCloud+ custom-domain email, set `SMTP_HOST=smtp.mail.me.com`, `SMTP_PORT=587`, and `SMTP_SECURE=false` to use STARTTLS. Set `SMTP_USER` and `SMTP_FROM` to the full custom-domain email address, and use an Apple app-specific password for `SMTP_PASSWORD` (not your Apple Account password). Generate the app-specific password in your Apple Account settings, then add these values to `.env.local`.

Use a distinct, long random value for each secret. Generate values with `openssl rand -base64 32`. `PASSKEY_CHALLENGE_SECRET` is required to use passkey registration or authentication. The status API key is never accepted from a URL or browser session; send it in the Authorization header:

```bash
curl -H "Authorization: Bearer ${STATUS_API_KEY}" "${NEXT_PUBLIC_SITE_URL}/api/v1/status"
```

In production, `NEXT_PUBLIC_SITE_URL` must be the canonical HTTPS origin. Authentication redirects and WebAuthn origin validation use this configured origin rather than forwarded host headers. Local development uses `http://localhost:${PORT:-3000}`. The app adds a per-request nonce-based Content Security Policy; `unsafe-eval` is allowed only in development for Next.js debugging.

For deployment, this repo also includes the Linux service, Cloudflare Tunnel, and release automation under the deploy/ folder.

## What can it do?

- Serve a simple developer portfolio
- Show a public status page for the live site
- Track operational health and uptime data in SQLite
- Let me update site status and homepage copy from an admin panel without redeploying
- Secure the admin area with password login and WebAuthn passkeys for passwordless access
- Store registered passkeys in SQLite and verify browser-based authentication challenges
- Accept contact form messages and send them through SMTP
- Expose a private status API for monitoring or custom status pages
- Run on a self-hosted Linux setup using systemd and Cloudflare Tunnel

## Is it maintained?

Yes, it is maintained for my live byteblast.xyz deployment and the day-to-day needs of running the site. I use it as a working system, not just a static portfolio.

## Who/what uses it?

- Visitors checking the portfolio and site status
- Me, as the admin/operator
- Monitoring tools or status pages using the private status API
- The local Linux infrastructure that hosts the app and tunnel
