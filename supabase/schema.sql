create extension if not exists pgcrypto;

create table if not exists public.playbook_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  section text not null default 'Playbook',
  excerpt text not null default '',
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  audience text not null default 'all' check (audience in ('internal', 'client', 'all')),
  sort_order integer not null default 100,
  notion_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  phone text not null,
  volume text not null,
  message text not null,
  source text not null default 'website',
  submitted_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists playbook_pages_set_updated_at on public.playbook_pages;
create trigger playbook_pages_set_updated_at
before update on public.playbook_pages
for each row execute function public.set_updated_at();

alter table public.playbook_pages enable row level security;
alter table public.leads enable row level security;

insert into public.playbook_pages (
  title,
  slug,
  section,
  excerpt,
  content,
  status,
  audience,
  sort_order
) values
  (
    'Welcome to the Playbook',
    'welcome',
    'Start Here',
    'The first page your team or clients see after logging in.',
    '## How this portal works

Use the sidebar to browse playbook sections. Admins can edit pages, create drafts, and publish updates.

This seed content is here so the app has a first page before a Notion export is imported.',
    'published',
    'all',
    1
  ),
  (
    'Client Onboarding',
    'client-onboarding',
    'Client Portal',
    'A template page for customer-facing processes.',
    '## Onboarding steps

1. Confirm account owner and access level.
2. Capture goals, constraints, and timelines.
3. Share the relevant playbook section.
4. Schedule the first review.',
    'published',
    'client',
    2
  )
on conflict (slug) do nothing;
