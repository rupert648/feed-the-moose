# Feed the Moose - Implementation Plan

A PWA for tracking cat feeding between household members. Get notifications at feeding times, tap "Fed Moose" with a photo, and others see it's done.

## Tech Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| **Frontend** | SvelteKit | PWA with service worker |
| **Backend** | SvelteKit API routes | `+server.ts` files |
| **Database** | Cloudflare D1 | SQLite, stores subscriptions, feeding events, users |
| **Photo Storage** | Cloudflare R2 | S3-compatible, cheap egress |
| **Web Push** | `@pushforge/builder` | TypeScript-first, zero deps, Workers-compatible |
| **Hosting** | Cloudflare Workers | Via `@sveltejs/adapter-cloudflare` |
| **Scheduled Tasks** | Workers Cron Triggers | For feeding time notifications |
| **CI/CD** | GitHub Actions | Auto-deploy on push to main |

## Features

1. **Authentication** - Simple shared secret + name (no accounts)
2. **Feeding Windows** - Configurable times (e.g., 9am, 5pm)
3. **Feed Button** - Opens camera, uploads photo, marks as fed
4. **Push Notifications** - "Time to feed!" and "X fed Moose!"
5. **Feeding History** - Feed of photos with timestamps and who fed
6. **PWA** - Installable on iOS/Android home screen

## Project Structure

```
feed-the-moose/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Home: photo, feeding windows, feed button
│   │   ├── +page.server.ts           # Load feeding status, random photo
│   │   ├── +layout.svelte            # Shell, nav, auth check
│   │   ├── +layout.server.ts         # Auth middleware
│   │   ├── login/
│   │   │   ├── +page.svelte          # Secret + name form
│   │   │   └── +page.server.ts       # Handle login
│   │   ├── feed/
│   │   │   ├── +page.svelte          # Feeding history with photos
│   │   │   └── +page.server.ts       # Load feeding history
│   │   ├── settings/
│   │   │   ├── +page.svelte          # Configure feeding times
│   │   │   └── +page.server.ts       # Load/save settings
│   │   └── api/
│   │       ├── feedings/
│   │       │   └── +server.ts        # POST: record feeding + upload photo
│   │       ├── push/
│   │       │   ├── subscribe/
│   │       │   │   └── +server.ts    # POST: save push subscription
│   │       │   └── vapid-key/
│   │       │       └── +server.ts    # GET: public VAPID key
│   │       └── settings/
│   │           └── +server.ts        # GET/PUT feeding schedule
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db.ts                 # D1 query helpers
│   │   │   ├── auth.ts               # Cookie signing/validation
│   │   │   ├── push.ts               # Web Push sending (pushforge)
│   │   │   └── r2.ts                 # R2 upload/download helpers
│   │   ├── components/
│   │   │   ├── FeedingWindow.svelte  # Single feeding window card
│   │   │   ├── CameraCapture.svelte  # Camera modal for feeding photo
│   │   │   ├── FeedingCard.svelte    # Card in feeding history
│   │   │   └── TimeInput.svelte      # Feeding time picker
│   │   └── stores/
│   │       └── notifications.ts      # Push subscription state
│   ├── service-worker.ts             # Push + caching
│   ├── app.d.ts                      # Cloudflare binding types
│   ├── app.html                      # HTML shell with PWA meta tags
│   └── app.css                       # Global styles
├── static/
│   ├── manifest.json                 # PWA manifest
│   ├── icon-192.png                  # App icons
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── migrations/
│   └── 0001_initial.sql              # D1 schema
├── wrangler.toml                     # Cloudflare config (D1, R2, cron)
├── svelte.config.js                  # SvelteKit + adapter-cloudflare
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions deploy
└── .env.example                      # Document required secrets
```

## Database Schema (D1)

```sql
-- Users (just names, identified by cookie)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Push subscriptions (one per device per user)
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  key_p256dh TEXT NOT NULL,
  key_auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Feeding events (with photo)
CREATE TABLE feedings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  window_time TEXT NOT NULL,           -- e.g., "09:00" - which window this fed
  photo_key TEXT,                       -- R2 object key
  fed_at TEXT DEFAULT (datetime('now'))
);

-- Feeding schedule (global)
CREATE TABLE feeding_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT UNIQUE NOT NULL,           -- e.g., "09:00", "17:00"
  label TEXT,                          -- e.g., "Morning", "Evening" (optional)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for checking today's feedings
CREATE INDEX idx_feedings_fed_at ON feedings(fed_at);
```

## Authentication Flow

1. User visits app → redirected to `/login` if no valid cookie
2. User enters shared secret + their name
3. Server validates secret against `SHARED_SECRET` env var
4. Server creates/gets user record in D1
5. Server sets signed cookie: `{ userId, name, exp }`
6. Cookie signed with HMAC-SHA256 using `SHARED_SECRET`
7. Subsequent requests validate cookie in `+layout.server.ts`

## Feeding Window Logic

- Feeding times configured in settings (e.g., 9am, 5pm)
- Each window is either "fed" or "unfed" for the current day
- Windows reset at midnight
- When a window's time passes and it's unfed → push notification sent
- When someone feeds → all subscribers get "X fed Moose!" notification

Example timeline:
```
8:59am  - No windows active yet
9:00am  - "Morning feed" window becomes active, push sent
9:30am  - User clicks "Feed Moose" → marks morning as fed, push sent
5:00pm  - "Evening feed" window becomes active, push sent
Next day 12:00am - All windows reset to unfed
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SHARED_SECRET` | Password to access the app |
| `VAPID_PUBLIC_KEY` | Public key for push subscriptions |
| `VAPID_PRIVATE_KEY` | Private key for sending pushes |
| `VAPID_SUBJECT` | `mailto:your@email.com` |

Set secrets via: `wrangler secret put SECRET_NAME`

## Implementation Phases

### Phase 1: Project Scaffolding
- [ ] Create SvelteKit project with TypeScript
- [ ] Install dependencies: `@sveltejs/adapter-cloudflare`, `@cloudflare/workers-types`, `@pushforge/builder`
- [ ] Configure `svelte.config.js` with Cloudflare adapter
- [ ] Set up `app.d.ts` with typed Cloudflare bindings (D1, R2)
- [ ] Create `wrangler.toml` with D1, R2 bindings and cron trigger
- [ ] Create D1 migration file
- [ ] Create `static/manifest.json` for PWA
- [ ] Update `app.html` with PWA meta tags
- [ ] Create GitHub Actions deploy workflow
- [ ] Create `.env.example`

### Phase 2: Authentication
- [ ] Create `$lib/server/auth.ts` - cookie signing with Web Crypto
- [ ] Create login page UI - secret input + name input
- [ ] Create login `+page.server.ts` - validate secret, create/get user, set cookie
- [ ] Create `+layout.server.ts` - validate cookie, load user, redirect if not authed
- [ ] Create logout functionality

### Phase 3: Core Feeding Flow
- [ ] Create `$lib/server/db.ts` - helpers for D1 queries
- [ ] Create `$lib/server/r2.ts` - upload/download photo helpers
- [ ] Create home page `+page.server.ts` - load today's feeding status per window
- [ ] Create home page UI - show feeding windows with fed/unfed status
- [ ] Create `CameraCapture.svelte` - camera access, capture photo
- [ ] Create `POST /api/feedings` - upload photo to R2, record feeding in D1
- [ ] Wire up "Feed Moose" button → camera → API → refresh
- [ ] Show random photo from previous feedings on home page

### Phase 4: Feeding History
- [ ] Create feed page `+page.server.ts` - load paginated feeding history
- [ ] Create feed page UI - scrollable list of feeding cards with photos
- [ ] Create `FeedingCard.svelte` - photo, timestamp, fed by name

### Phase 5: Settings
- [ ] Create settings page `+page.server.ts` - load feeding schedule
- [ ] Create settings page UI - list times, add/remove
- [ ] Create `TimeInput.svelte` - time picker component
- [ ] Create `PUT /api/settings` - update feeding schedule

### Phase 6: Push Notifications
- [ ] Create `$lib/server/push.ts` - send push using @pushforge/builder
- [ ] Create `GET /api/push/vapid-key` - return public VAPID key
- [ ] Create `POST /api/push/subscribe` - store subscription in D1
- [ ] Create `$lib/stores/notifications.ts` - manage subscription state
- [ ] Add "Enable notifications" UI in settings
- [ ] Create `service-worker.ts` - handle push event, show notification
- [ ] Handle notification click → open app
- [ ] Trigger "X fed Moose!" push when feeding recorded

### Phase 7: Scheduled Notifications (Cron)
- [ ] Create scheduled handler in worker
- [ ] Check current time against feeding schedule
- [ ] Track which windows have been notified today (avoid spam)
- [ ] If feeding time passed and not fed → send "Time to feed Moose!"

### Phase 8: PWA Polish
- [ ] Finalize `manifest.json` with icons, theme, display: standalone
- [ ] Add all PWA meta tags to `app.html`
- [ ] Configure service worker caching strategy
- [ ] Test "Add to Home Screen" on iOS and Android

### Phase 9: Final Polish & Deploy
- [ ] Add loading states and error handling throughout
- [ ] Style the app nicely
- [ ] Test full flow end-to-end
- [ ] Test on iOS Safari (PWA mode)
- [ ] Test on Android Chrome
- [ ] Deploy via GitHub Actions
- [ ] (Later) Add custom domain

## Cloudflare Resources to Create

Before deploying, you'll need to create these via Cloudflare dashboard or wrangler CLI:

```bash
# Create D1 database
wrangler d1 create feed-the-moose-db

# Create R2 bucket
wrangler r2 bucket create moose-photos

# Set secrets
wrangler secret put SHARED_SECRET
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_SUBJECT

# Generate VAPID keys (run locally, then set as secrets)
npx @pushforge/builder generate-vapid-keys

# Run migration
wrangler d1 execute feed-the-moose-db --file=migrations/0001_initial.sql
```

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Scaffolding | 1-2 hours |
| Phase 2: Auth | 1-2 hours |
| Phase 3: Core Feeding | 3-4 hours |
| Phase 4: History | 1-2 hours |
| Phase 5: Settings | 1-2 hours |
| Phase 6: Push | 2-3 hours |
| Phase 7: Cron | 1-2 hours |
| Phase 8: PWA | 1 hour |
| Phase 9: Polish | 2-3 hours |
| **Total** | **~15-20 hours** |
