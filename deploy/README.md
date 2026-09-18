# Production Deployment Guide: byteblast.xyz

This guide details the production hosting setup for `byteblast.xyz` on a self-hosted Linux machine (Ubuntu/Debian) running behind Cloudflare Tunnel with systemd process supervision and a local SQLite storage engine.

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │             Cloudflare Edge             │
                      │  (DNS, SSL/TLS, DDoS, Zero Trust Access)│
                      └────────────────────┬────────────────────┘
                                           │
                                           │ Outbound TLS Tunnel
                                           │ (No inbound open ports!)
                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Linux Host (Ubuntu / Debian)                                           │
│                                                                        │
│   ┌───────────────────────────┐         ┌────────────────────────────┐ │
│   │    cloudflared daemon     │         │   byteblast-web (Next.js)  │ │
│   │   (systemd unit service)  │────────▶│      127.0.0.1:3000        │ │
│   └───────────────────────────┘ Proxy   └──────────────┬─────────────┘ │
│                                                        │               │
│                                                        ▼               │
│                                         ┌────────────────────────────┐ │
│                                         │   SQLite (WAL Mode)        │ │
│                                         │   data/byteblast.db        │ │
│                                         └────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Security & Operational Benefits:
1. **Zero open inbound ports**: The host firewall denies all inbound HTTP/HTTPS traffic (`ufw default deny incoming`). The `cloudflared` daemon establishes outbound QUIC/HTTP2 tunnels to Cloudflare Edge.
2. **Hardened systemd isolation**: Next.js runs under an unprivileged user (`byte`) with `NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=full`, and restricted write paths (`ReadWritePaths=.../data`).
3. **Loopback binding**: The Node app binds strictly to `127.0.0.1:3000` so it cannot be reached from the local network directly.
4. **SQLite with WAL mode**: Fast synchronous queries without the operational overhead of external database servers.

---

## 1. Prerequisites

- Linux host running Ubuntu 22.04+ or Debian 12+
- Node.js 22+ (verified on Node 26) & npm
- A Cloudflare account managing your domain (`byteblast.xyz`)

---

## 2. Host Provisioning

Run the setup script:

```bash
cd /home/byte/Projects/byteblast.xyz
sudo ./deploy/setup.sh
```

This will:
- Check for or install the `cloudflared` package.
- Install the `byteblast-web.service` systemd unit to `/etc/systemd/system/`.
- Configure UFW firewall to block all inbound traffic except SSH (port 22).

---

## 3. Cloudflare Tunnel Configuration

### Step A: Authenticate Cloudflare CLI
```bash
cloudflared tunnel login
```
Follow the URL provided to authorize your Cloudflare domain. This downloads your certificate to `~/.cloudflared/cert.pem`.

### Step B: Create your tunnel
```bash
cloudflared tunnel create byteblast-prod
```
Note the generated Tunnel UUID (e.g. `6a5b4c3d-2e1f-4a0b-9c8d-7e6f5a4b3c2d`).

### Step C: Configure DNS routing
Route your domain and subdomains through the tunnel:
```bash
cloudflared tunnel route dns byteblast-prod byteblast.xyz
cloudflared tunnel route dns byteblast-prod www.byteblast.xyz
cloudflared tunnel route dns byteblast-prod status.byteblast.xyz
```

### Step D: Update Tunnel Configuration
Copy the configuration template:
```bash
sudo cp deploy/cloudflare-tunnel.yml /etc/cloudflared/config.yml
```
Edit `/etc/cloudflared/config.yml` and replace:
- `tunnel: <REPLACE_WITH_YOUR_TUNNEL_UUID>` with your actual UUID.
- `credentials-file:` path pointing to your JSON credentials file (`/home/byte/.cloudflared/<UUID>.json`).

### Step E: Enable and Start Tunnel Service
```bash
sudo cp deploy/cloudflared.service /etc/systemd/system/cloudflared.service
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

---

## 4. Production Application Deployment

Configure your production environment file:
```bash
cp .env.example .env.local
# Set strong production secrets:
# ADMIN_PASSWORD=<strong-random-password>
# ADMIN_SESSION_SECRET=<strong-random-secret>
```

Build and start the application service:
```bash
./deploy/deploy.sh
```

Verify service status:
```bash
sudo systemctl status byteblast-web
journalctl -u byteblast-web -f
```

---

## 5. Independent Status Page & Telemetry API

To build an independent status page (or connect to an external monitor like Uptime Kuma or BetterStack), query the admin-only telemetry endpoint:

### Endpoint: `GET /api/v1/status`

### Authentication Options:
1. **Bearer Token**: `Authorization: Bearer <ADMIN_SESSION_SECRET>`
2. **Header**: `x-admin-key: <ADMIN_SESSION_SECRET>`
3. **Query Param**: `?token=<ADMIN_SESSION_SECRET>`
4. **Session Cookie**: Logged in via `/admin` in browser.

### Example Query:
```bash
curl -s -H "Authorization: Bearer $ADMIN_SESSION_SECRET" https://byteblast.xyz/api/v1/status | jq .
```

### Response Schema:
```json
{
  "ok": true,
  "exitCode": 0,
  "service": "byteblast.xyz",
  "timestamp": "2026-09-17T18:15:00.000Z",
  "site": {
    "state": "operational",
    "headline": "Site is fully operational",
    "message": "All systems operating normally.",
    "updatedAt": "2026-09-17T18:10:00.000Z"
  },
  "system": {
    "nodeVersion": "v26.8.2",
    "platform": "linux",
    "uptimeSeconds": 3600,
    "memory": {
      "rssMb": 85.2,
      "heapUsedMb": 44.1,
      "heapTotalMb": 66.8
    }
  },
  "diagnostics": {
    "exitCode": 0,
    "database": {
      "status": "connected",
      "latencyMs": 0.42,
      "errorCode": null
    },
    "recentErrors": [],
    "recentProbes": [
      {
        "timestamp": "2026-09-17T18:14:59.000Z",
        "probeType": "api_v1_status_probe",
        "statusCode": 200,
        "latencyMs": 0.85,
        "errorCode": null,
        "message": "Independent status probe queried"
      }
    ]
  },
  "metrics": {
    "trafficEvents": 142,
    "uniqueVisitors": 38,
    "pageViews": 96,
    "clicks": 46,
    "errorRatePercent": 0.0
  }
}
```

---

## 6. Maintenance & Backups

### Database Backup
Because SQLite is running in WAL mode, create a hot, online zero-downtime backup with:
```bash
sqlite3 data/byteblast.db ".backup data/byteblast-backup-$(date +%Y%m%d%H%M).db"
```

### Log Inspection
- Web server logs: `journalctl -u byteblast-web -n 100 -f`
- Cloudflare Tunnel logs: `journalctl -u cloudflared -n 100 -f`
