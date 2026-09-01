-- Fix 5: honest telemetry + sponsor impressions + watcher per-rig alerts
alter table sponsor_slots add column if not exists impressions integer not null default 0;
alter table sponsor_slots add column if not exists clicks integer not null default 0;

-- Watchers for per-rig drop alerts (Fix 2: habit loop)
create table if not exists watchers (
  id serial primary key,
  rig_hash text not null,
  vram_tier integer not null,
  contact text not null, -- email or webhook url
  contact_type text not null default 'email', -- email | webhook
  created_at timestamptz not null default now(),
  last_notified_at timestamptz
);
create index if not exists watchers_rig_hash_idx on watchers (rig_hash);
create index if not exists watchers_contact_idx on watchers (contact);

-- For sitemap generation tracking (Fix 3)
create table if not exists seo_pages (
  slug text primary key,
  updated_at timestamptz not null default now()
);
