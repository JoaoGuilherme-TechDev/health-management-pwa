-- Create recipes table
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  ingredients text[] not null,
  preparation text[] not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create supplements table
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  benefit text not null,
  dosage text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.recipes enable row level security;
alter table public.supplements enable row level security;

-- Recipes RLS policies - anyone can read, only admins can modify
create policy "recipes_select_all"
  on public.recipes for select
  using (true);

create policy "recipes_insert_admin"
  on public.recipes for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "recipes_update_admin"
  on public.recipes for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "recipes_delete_admin"
  on public.recipes for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Supplements RLS policies - anyone can read, only admins can modify
create policy "supplements_select_all"
  on public.supplements for select
  using (true);

create policy "supplements_insert_admin"
  on public.supplements for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "supplements_update_admin"
  on public.supplements for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "supplements_delete_admin"
  on public.supplements for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
