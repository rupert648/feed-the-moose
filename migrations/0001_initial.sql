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
  window_time TEXT NOT NULL,
  photo_key TEXT,
  fed_at TEXT DEFAULT (datetime('now'))
);

-- Feeding schedule (global)
CREATE TABLE feeding_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT UNIQUE NOT NULL,
  label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Track which windows have sent notifications today
CREATE TABLE notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  window_time TEXT NOT NULL,
  notification_date TEXT NOT NULL,
  sent_at TEXT DEFAULT (datetime('now')),
  UNIQUE(window_time, notification_date)
);

-- Index for checking today's feedings
CREATE INDEX idx_feedings_fed_at ON feedings(fed_at);
CREATE INDEX idx_feedings_window_time ON feedings(window_time);
