-- Public, unowned app data. No emails, names of people, or IPs.

create table if not exists visitor_stats (
  id text primary key,
  count integer not null default 0
);

insert into visitor_stats (id, count)
values ('month-current', 18420)
on conflict (id) do nothing;

create table if not exists visitor_pings (
  id serial primary key,
  city text not null,
  lat real not null,
  lng real not null,
  created_at timestamptz not null default now()
);

create index if not exists visitor_pings_created_at_idx
  on visitor_pings (created_at desc);

create table if not exists sponsor_slots (
  id serial primary key,
  company text not null unique,
  url text not null,
  tagline text not null,
  slot text not null default 'both',
  active boolean not null default true
);

insert into sponsor_slots (company, url, tagline, slot, active)
values
  ('LOCALWEIGHTS', 'https://huggingface.co', 'GGUF drops, ranked by what actually fits.', 'both', true),
  ('VRAMHAUS', 'https://ollama.com', 'Run the model. Skip the cloud bill.', 'both', true),
  ('NIGHTSHIFT GPU', 'https://lmstudio.ai', 'Desktop inference for people with a job in the morning.', 'both', true),
  ('OPENNODE', 'https://github.com/ggml-org/llama.cpp', 'The runtime the rest of the stack pretends to be.', 'both', true),
  ('SILICON ATTIC', 'https://unsloth.ai', 'Quants that still think.', 'both', true)
on conflict (company) do nothing;

create table if not exists sponsor_requests (
  id serial primary key,
  company text not null,
  website text not null,
  tagline text not null,
  slot text not null,
  created_at timestamptz not null default now()
);
