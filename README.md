# Feed the Moose

A PWA for tracking cat feeding between household members. Get notifications at feeding times, tap "Fed Moose" with a photo, and others see it's done.

## Features

- Configurable feeding windows (e.g., 9am, 5pm)
- "Fed Moose" button with camera capture
- Push notifications for feeding times and when someone feeds
- Photo feed of all feedings with timestamps
- Simple auth (shared secret + name)
- PWA installable on iOS/Android home screen

## Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: SvelteKit API routes on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Photo Storage**: Cloudflare R2
- **Push**: Web Push with VAPID (@pushforge/builder)
- **Deploy**: GitHub Actions → Cloudflare

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your secrets (see below for VAPID keys)

# Run database migration
pnpm db:migrate

# Start dev server
pnpm dev
```

### Generate VAPID Keys

```bash
pnpm generate-vapid
```

Copy the output into your `.dev.vars`:
- `VAPID_PUBLIC_KEY` - the public key
- `VAPID_PRIVATE_KEY` - the private key (JSON format)

### Cloudflare Setup

1. **Create D1 Database**:
   ```bash
   wrangler d1 create feed-the-moose-db
   ```
   Copy the `database_id` into `wrangler.toml`

2. **Create R2 Bucket**:
   ```bash
   wrangler r2 bucket create moose-photos
   ```

3. **Set Secrets**:
   ```bash
   wrangler secret put SHARED_SECRET
   wrangler secret put VAPID_PUBLIC_KEY
   wrangler secret put VAPID_PRIVATE_KEY
   wrangler secret put VAPID_SUBJECT
   ```

4. **Run Production Migration**:
   ```bash
   pnpm db:migrate:prod
   ```

### Deploy

Push to `main` branch triggers GitHub Actions deploy. Or manually:

```bash
pnpm build
pnpm deploy
```

### Cron Setup

The app has an endpoint `/api/cron/check-feedings` that checks for unfed windows and sends notifications. You need to call it periodically.

**Option 1: Cloudflare Workers Cron (Recommended)**

Create a separate worker or use Cloudflare's cron triggers to call:
```
GET https://your-app.workers.dev/api/cron/check-feedings
Authorization: Bearer YOUR_SHARED_SECRET
```

**Option 2: External Cron Service**

Use cron-job.org, GitHub Actions scheduled workflow, or similar to call the endpoint every 5 minutes.

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Home - feeding windows
│   ├── feed/                 # Feeding history
│   ├── settings/             # Configure times + notifications
│   ├── login/                # Auth
│   └── api/
│       ├── feedings/         # Record feedings
│       ├── photos/           # Serve photos from R2
│       ├── push/             # Push subscription management
│       └── cron/             # Scheduled notification check
├── lib/
│   ├── server/               # Server-only code (D1, R2, auth)
│   └── components/           # Svelte components
└── service-worker.ts         # Push + caching
```

## Icons

Replace the placeholder icons in `static/` with actual images:
- `favicon.png` - 32x32
- `icon-192.png` - 192x192
- `icon-512.png` - 512x512
- `apple-touch-icon.png` - 180x180

## License

MIT
