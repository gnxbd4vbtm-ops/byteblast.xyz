# byteblast.xyz

A clean-room rebuild of the byteblast personal site and operations surface. The project is built with Next.js, TypeScript, Tailwind, SQLite storage, and a server-first architecture for a public portfolio, site-focused status dashboard, and private admin control plane.

## Product goals

- Professional developer portfolio with a concise, high-trust brand presence
- Public status dashboard dedicated strictly to site health and uptime without hardcoded values
- Private admin control plane with edit forms for site status and content updates
- SQLite-backed storage engine with WAL mode replacing legacy JSONL flat files
- Admin-only `/api/v1/status` telemetry endpoint returning exit codes, error codes, and latency for building independent status pages
- Production-ready deployment setup for self-hosted Linux hosts running behind Cloudflare Tunnel

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Node.js Linux runtime (v22+)
- SQLite storage engine (`node:sqlite` in WAL mode)
- Systemd process supervision & Cloudflare Tunnel

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Environment variables

The app expects the following variables to be present in local or production environments:

- `NEXT_PUBLIC_SITE_URL` - Canonical website URL
- `PUBLIC_EMAIL` - Public inquiry email address
- `ADMIN_EMAIL` - Operator email address
- `STATUS_DOMAIN` - Custom status domain or subdomain
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` - SMTP delivery settings for contact notifications and replies
- `ADMIN_USERNAME` - Admin authentication username
- `ADMIN_PASSWORD` - Admin authentication password
- `ADMIN_SESSION_SECRET` - HMAC signing key & Bearer token for status API
- `GITHUB_USERNAME` - GitHub profile for portfolio repository display
- `GITHUB_TOKEN` - Optional personal access token for higher rate limits

## Core Architecture & Features

### 1. SQLite Storage Layer (`lib/db.ts`)
- Replaces legacy JSONL flat files with atomic, WAL-mode SQLite storage (`data/byteblast.db`).
- Tables:
  - `site_events`: Page views, clicks, visitor IDs, referrers, and user agents.
  - `contact_messages`: Inbound contact inquiries.
  - `site_status`: Live site status state (`operational`, `degraded`, `maintenance`, `outage`), headline, and details.
  - `site_content`: Dynamic copy for hero headlines, descriptions, availability badges, and posture notes.
  - `system_probes`: Operational health probes, exit codes, HTTP status codes, latency, and error codes.
- Automatic one-time migration from existing JSONL files on initialization.

### 2. Dedicated Site Status Page (`/status`)
- Focused **exclusively** on the `byteblast.xyz` site itself (no fake deployment queues or hardcoded dummy dates).
- Displays live SQLite probe latency, calculated uptime %, 24h traffic volume, and dynamic status copy managed by the operator.
- Fully dynamic rendering (`force-dynamic`).

### 3. Admin Edit Form (`/admin`)
- Restricted by secure HMAC-signed cookie authentication.
- Real-time edit forms for:
  - **Site Status**: Change operational state, headline, and public incident note.
  - **Site Content**: Update hero headline, bio description, focus callout, and status notes without redeploying.
- View live audience metrics, inbound contact messages, and recent system probes.

### 4. Admin-Only Status API (`/api/v1/status`)
- Built specifically to power independent status pages or third-party monitoring agents (Uptime Kuma, BetterStack, etc.).
- Authentication via:
  - `Authorization: Bearer <ADMIN_SESSION_SECRET>`
  - `x-admin-key: <ADMIN_SESSION_SECRET>`
  - `?token=<ADMIN_SESSION_SECRET>`
  - Active admin session cookie in browser
- Returns exit codes (`exitCode: 0`), error codes (`errorCode`), node process memory, system uptime, database latency, probe history, and error logs.

## Production Deployment

Production deployment files and scripts are located in `deploy/`:
- `deploy/byteblast-web.service` - Systemd service unit for the Next.js app with security hardening and loopback binding.
- `deploy/cloudflared.service` - Systemd service unit for the Cloudflare Tunnel daemon.
- `deploy/cloudflare-tunnel.yml` - Tunnel configuration mapping `byteblast.xyz`, `www`, and `status` to `http://127.0.0.1:3000`.
- `deploy/deploy.sh` - Automated deployment script (git pull, npm install, build, service restart, health check).
- `deploy/setup.sh` - Host provisioning script (cloudflared install, firewall lockdown, service enablement).
- `deploy/README.md` - Complete production runbook.

## Endpoints

- Public site: `/`
- Site status: `/status`
- Health check: `/api/health`
- Private admin control: `/admin`
- Admin login: `/admin/login`
- Telemetry API (Admin only): `/api/v1/status`
