alter table public.playbook_pages
  add column if not exists notion_page_id text unique,
  add column if not exists imported_at timestamptz;

create table if not exists public.playbook_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.playbook_pages(id) on delete cascade,
  notion_block_id text not null unique,
  parent_block_id text,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  has_children boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists playbook_blocks_set_updated_at on public.playbook_blocks;
create trigger playbook_blocks_set_updated_at
before update on public.playbook_blocks
for each row execute function public.set_updated_at();

alter table public.playbook_pages enable row level security;
alter table public.playbook_blocks enable row level security;
