# byteblast status

An independent status dashboard for `byteblast.xyz`. It checks the existing site health endpoint server-side, reports availability and response latency, and refreshes every 30 seconds in the browser.

## Run locally

```bash
npm install
npm run dev -- --port 3010
```

Open `http://localhost:3010`.

## Add another monitor

Add another entry to `lib/monitors.ts`:

```ts
{
	id: "service-id",
	name: "Service name",
	description: "What this service does",
	url: "https://service.example.com/api/health",
	kind: "api",
}
```

Supported kinds are `api`, `website`, and `service`. Each entry automatically gets a status card, HTTP result, latency, and refresh behavior.

Set `BYTEBLAST_HEALTH_URL` in `.env.local` to override the default `https://byteblast.xyz/api/health` target.

## Production

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3010
```

The app is independent from the main site and can be placed behind its own hostname or Cloudflare Tunnel ingress.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
