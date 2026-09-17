# byteblast.xyz

A clean-room rebuild of the byteblast personal site and operations surface. The project is built with Next.js, TypeScript, Tailwind, and a server-first architecture for a public portfolio, status dashboard, and private admin interface.

## Product goals

- Professional developer portfolio with a concise, high-trust brand presence
- Public status dashboard for site and service health visibility
- Private admin area protected behind server-side auth
- GitHub-backed project highlights and operational transparency
- Production-friendly deployment model for a self-hosted Linux environment behind Cloudflare Tunnel

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Node.js Linux runtime
- Local status and auth primitives designed for private operator access

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Environment variables

The app expects the following variables to be present in local or production environments:

- `NEXT_PUBLIC_SITE_URL`
- `PUBLIC_EMAIL`
- `ADMIN_EMAIL`
- `STATUS_DOMAIN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `GITHUB_USERNAME`
- `GITHUB_TOKEN`

## Security model

- Public pages do not expose admin state or credentials.
- Private admin access is enforced by cookie-based server-side auth.
- The app uses explicit allowlists for external host access and avoids broad remote fetch behavior.
- Status data is separated from public rendering and should be treated as operational metadata rather than user content.

## Deployment architecture

The recommended production deployment is a Linux service using a standalone Next.js build behind a Cloudflare Tunnel or equivalent reverse proxy. The public site should be served directly, while the status and admin surfaces remain restricted to trusted access paths.

### Suggested systemd service

Use the generated deployment file in `deploy/byteblast-web.service` as a starting point for the Node runtime.

## Monitoring and health

- Public health endpoint: `/api/health`
- Status page: `/status`
- Private admin surface: `/admin`
- Admin login: `/admin/login`
