# Feed the Moose

A PWA for tracking cat feeding between household members. Get notifications at feeding times, tap "Fed" with a photo, and others see it's done.

## Features

- Configurable feeding windows (e.g., 9am, 5pm) with labels
- "Feed" button with optional camera capture
- Push notifications for feeding reminders and when someone feeds
- Photo feed of all feedings with timestamps
- Simple auth (shared secret + name)
- PWA installable on iOS/Android home screen
- Feeding day resets at 3am UTC (for late-night feeders)

## Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: SvelteKit API routes on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Photo Storage**: Cloudflare R2
- **Push**: Web Push with VAPID (@pushforge/builder)
- **Cron**: Separate Cloudflare Worker with service binding

## Deploy to Cloudflare

### Prerequisites

- Node.js 20+
- pnpm
- Cloudflare account
- Wrangler CLI (`pnpm add -g wrangler`)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/feed-the-moose.git
cd feed-the-moose
pnpm install
```

### 2. Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create feed-the-moose-db
# Copy the database_id from output into wrangler.toml

# Create R2 bucket
wrangler r2 bucket create moose-photos
```

### 3. Update wrangler.toml

Replace the `database_id` with your own from step 2:

```toml
[[d1_databases]]
binding = "DB"
database_name = "feed-the-moose-db"
database_id = "your-database-id-here"
```

### 4. Generate VAPID Keys

```bash
pnpm generate-vapid
```

### 5. Set Secrets

```bash
# A shared password for all users to login
wrangler secret put SHARED_SECRET

# From the generate-vapid output
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY

# Your email for VAPID (mailto:you@example.com)
wrangler secret put VAPID_SUBJECT
```

### 6. Run Database Migration

```bash
pnpm db:migrate:prod
```

### 7. Deploy

```bash
# Build and deploy main app
pnpm build
pnpm deploy

# Deploy cron worker (for scheduled notifications)
pnpm deploy:cron

# Or deploy both at once
pnpm deploy:all
```

Your app is now live at `https://feed-the-moose.<your-subdomain>.workers.dev`

### 8. Custom Domain (Optional)

1. Add your domain to Cloudflare (update nameservers at registrar)
2. Uncomment and update the routes in `wrangler.toml`:

```toml
[[routes]]
pattern = "yourdomain.com"
custom_domain = true
```

3. Redeploy: `pnpm deploy`

## Local Development

```bash
# Copy environment file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your secrets
# Generate VAPID keys with: pnpm generate-vapid

# Run local database migration
pnpm db:migrate

# Start dev server
pnpm dev
```

## GitHub Actions (CI/CD)

To auto-deploy on push to main:

1. Go to your repo Settings > Secrets and variables > Actions
2. Add secret: `CLOUDFLARE_API_TOKEN` (create at Cloudflare dashboard > API Tokens)

The included `.github/workflows/deploy.yml` will deploy on every push to main.

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Home - feed + feeding windows
│   ├── settings/             # Configure times + notifications
│   ├── login/                # Auth
│   └── api/
│       ├── feedings/         # Record/list feedings
│       ├── photos/           # Serve photos from R2
│       ├── push/             # Push subscription management
│       └── cron/             # Scheduled notification check
├── lib/
│   ├── server/               # Server-only code (D1, R2, auth, push)
│   └── components/           # Svelte components
└── service-worker.ts         # Push notifications

cron-worker/                  # Separate worker for scheduled tasks
├── worker.js
└── wrangler.toml
```

## Customization

- Replace cat images in `static/moose-*.png` with your own pet
- Update `static/manifest.json` with your app name
- Adjust `DAY_RESET_HOUR_UTC` in `src/lib/server/feedings.ts` (default: 3am UTC)
- Change `ACTIVE_WINDOW_BEFORE_MINUTES` for when feeding buttons activate (default: 60 min before)

## License

MIT
