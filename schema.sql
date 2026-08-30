-- Grand Lodge of Ghana 2026 Registration Portal
create extension if not exists pgcrypto;

do $$ begin
  create type public.application_status as enum ('pending','under_review','approved','rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('staff','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique not null default ('GLG-2026-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  full_name text not null,
  email text not null,
  phone text not null,
  occupation text,
  date_of_birth date,
  house_address text,
  id_card_name text,
  applicant_type text not null check (applicant_type in ('Ghanaian','International')),
  country text not null,
  message text,
  status public.application_status not null default 'pending',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  title text not null,
  date date not null,
  location text not null default 'Ghana',
  created_at timestamptz not null default now()
);

create table if not exists public.initiation_classes (
  id bigint generated always as identity primary key,
  title text not null,
  date date,
  location text default 'Ghana',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.events enable row level security;
alter table public.initiation_classes enable row level security;

drop policy if exists "public can submit applications" on public.applications;
create policy "public can submit applications"
  on public.applications for insert to anon, authenticated
  with check (true);

drop policy if exists "public can read own application" on public.applications;
create policy "public can read own application"
  on public.applications for select to anon, authenticated
  using (true);

drop policy if exists "public can update payment" on public.applications;
create policy "public can update payment"
  on public.applications for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "admins can read applications" on public.applications;
create policy "admins can read applications"
  on public.applications for select to authenticated
  using (public.is_admin());

drop policy if exists "admins can update applications" on public.applications;
create policy "admins can update applications"
  on public.applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can delete applications" on public.applications;
create policy "admins can delete applications"
  on public.applications for delete to authenticated
  using (public.is_admin());

drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage events" on public.events;
create policy "admins manage events"
  on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read events" on public.events;
create policy "public read events"
  on public.events for select to anon, authenticated
  using (true);

drop policy if exists "admins manage initiation" on public.initiation_classes;
create policy "admins manage initiation"
  on public.initiation_classes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read initiation" on public.initiation_classes;
create policy "public read initiation"
  on public.initiation_classes for select to anon, authenticated
  using (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.events (title, date, location) values
  ('Initiation Ceremony', '2026-06-15', 'Accra, Ghana'),
  ('Annual Communication', '2026-08-10', 'Accra, Ghana'),
  ('Grand Lodge Meeting', '2026-10-05', 'Kumasi, Ghana')
on conflict do nothing;

-- AFTER creating your first staff account in Supabase Auth, promote it to admin:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'YOUR-STAFF-EMAIL');
