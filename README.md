# ByteBlast

A minimal, modern developer portfolio and personal site for Byte / ByteBlast.

## Features

- Responsive portfolio for home, about, projects, status, contact, and settings pages
- Secure private `/settings` area gated by a password-based session
- Dark-first design with optional light mode
- SEO metadata, Open Graph tags, sitemap, robots, and manifest
- Docker deployment and Cloudflare Tunnel-friendly configuration

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production build

```bash
npm run build
npm run start
```

## Docker

```bash
docker build -t byteblast .
docker run --rm -p 3000:3000 --env-file .env byteblast
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values for your deployment.

To generate a strong hash for `SETTINGS_PASSWORD_HASH`, use a local Node command similar to:

```bash
node -e "const { scryptSync, randomBytes } = require('crypto'); const password = 'your-strong-password'; const salt = randomBytes(16).toString('base64'); const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }); console.log('scrypt$16384$8$1$' + salt + '$' + key.toString('base64'));"
```
