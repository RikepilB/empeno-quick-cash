-- EMPEÑALO initial schema
-- 9 tables, all with RLS enabled. Seeds the 3 subscription plans.
-- Apply via Supabase Dashboard → SQL Editor, OR `supabase db push` after `supabase link --project-ref raoprigiowskqnylapqs`.

-- ============================================================================
-- 1. profiles — 1:1 with auth.users, holds role + identity
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('client','business')),
  full_name text,
  dni text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================================
-- 2. businesses — one row per pawn shop, owned by a business profile
-- ============================================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  district text,
  ruc text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses(owner_id);

alter table public.businesses enable row level security;

create policy "businesses_owner_all" on public.businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Any authenticated user may read a business's public-facing info (name/district) for solicitudes views
create policy "businesses_authenticated_read" on public.businesses
  for select to authenticated using (true);

-- ============================================================================
-- 3. plans — static catalog of 3 subscription tiers
-- ============================================================================
create table public.plans (
  id text primary key,
  name text not null,
  price_pen integer not null,
  monthly_propuestas integer,            -- null = unlimited
  features jsonb not null default '[]'::jsonb
);

alter table public.plans enable row level security;

create policy "plans_public_read" on public.plans
  for select using (true);

insert into public.plans (id, name, price_pen, monthly_propuestas, features) values
  ('basico', 'Básico', 10, 5, '["Hasta 5 ofertas/mes","Acceso al marketplace","Soporte por correo"]'::jsonb),
  ('intermedio', 'Intermedio', 20, 30, '["Hasta 30 ofertas/mes","Herramientas de gestión","Reportes mensuales","Soporte prioritario"]'::jsonb),
  ('avanzado', 'Avanzado', 30, null, '["Ofertas ilimitadas","Prioridad en solicitudes","Alertas por categoría","Múltiples usuarios"]'::jsonb);

-- ============================================================================
-- 4. subscriptions — one active per business (enforced via partial unique index)
-- ============================================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('active','past_due','canceled','trialing')),
  culqi_subscription_id text unique,
  current_period_end timestamptz,
  propuestas_used_this_period integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_business
  on public.subscriptions(business_id)
  where status in ('active','trialing','past_due');

alter table public.subscriptions enable row level security;

create policy "subscriptions_owner_read" on public.subscriptions
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- writes only via server (service-role) — no client policy on insert/update

-- ============================================================================
-- 5. solicitudes — items posted by clients
-- ============================================================================
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  brand text,
  model text,
  year int,
  storage text,
  condition text,
  description text,
  expected_amount_pen integer,
  expected_term_days int,
  district text,
  status text not null default 'active' check (status in ('active','accepted','closed','expired')),
  created_at timestamptz not null default now()
);

create index solicitudes_status_created_idx on public.solicitudes(status, created_at desc);
create index solicitudes_client_id_idx on public.solicitudes(client_id);

alter table public.solicitudes enable row level security;

create policy "solicitudes_client_all" on public.solicitudes
  for all using (client_id = auth.uid()) with check (client_id = auth.uid());

-- Businesses with any non-canceled subscription can browse active solicitudes
create policy "solicitudes_business_read_active" on public.solicitudes
  for select to authenticated using (
    status = 'active'
    and exists (
      select 1 from public.businesses b
      join public.subscriptions s on s.business_id = b.id
      where b.owner_id = auth.uid()
        and s.status in ('active','trialing')
    )
  );

-- ============================================================================
-- 6. solicitud_photos — references objects in the 'solicitud-photos' storage bucket
-- ============================================================================
create table public.solicitud_photos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  storage_path text not null,
  position int not null,
  created_at timestamptz not null default now(),
  unique (solicitud_id, position)
);

create index solicitud_photos_solicitud_idx on public.solicitud_photos(solicitud_id, position);

alter table public.solicitud_photos enable row level security;

create policy "solicitud_photos_owner_all" on public.solicitud_photos
  for all using (
    exists (select 1 from public.solicitudes s where s.id = solicitud_id and s.client_id = auth.uid())
  ) with check (
    exists (select 1 from public.solicitudes s where s.id = solicitud_id and s.client_id = auth.uid())
  );

create policy "solicitud_photos_authenticated_read" on public.solicitud_photos
  for select to authenticated using (true);

-- ============================================================================
-- 7. propuestas — offers from businesses on a solicitud
-- ============================================================================
create table public.propuestas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  monto_pen integer not null check (monto_pen > 0),
  tasa_mensual numeric(5,2) not null check (tasa_mensual >= 0),
  plazo_dias int not null check (plazo_dias > 0),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (solicitud_id, business_id)
);

create index propuestas_solicitud_idx on public.propuestas(solicitud_id, status);
create index propuestas_business_idx on public.propuestas(business_id, created_at desc);

alter table public.propuestas enable row level security;

create policy "propuestas_business_owner_all" on public.propuestas
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "propuestas_client_read" on public.propuestas
  for select using (
    exists (select 1 from public.solicitudes s where s.id = solicitud_id and s.client_id = auth.uid())
  );

-- Client may update status to 'accepted' or 'rejected' on propuestas attached to their solicitudes
create policy "propuestas_client_update_status" on public.propuestas
  for update using (
    exists (select 1 from public.solicitudes s where s.id = solicitud_id and s.client_id = auth.uid())
  ) with check (
    status in ('accepted','rejected')
  );

-- ============================================================================
-- 8. operations — created when a client accepts a propuesta; holds redemption code
-- ============================================================================
create table public.operations (
  id uuid primary key default gen_random_uuid(),
  propuesta_id uuid not null unique references public.propuestas(id) on delete cascade,
  redemption_code text not null unique,    -- e.g. EMP-7P3R8
  accepted_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'pending_pickup' check (status in ('pending_pickup','completed','disputed','expired'))
);

create index operations_status_idx on public.operations(status);

alter table public.operations enable row level security;

create policy "operations_client_read" on public.operations
  for select using (
    exists (
      select 1 from public.propuestas p
      join public.solicitudes s on s.id = p.solicitud_id
      where p.id = propuesta_id and s.client_id = auth.uid()
    )
  );

create policy "operations_business_read" on public.operations
  for select using (
    exists (
      select 1 from public.propuestas p
      join public.businesses b on b.id = p.business_id
      where p.id = propuesta_id and b.owner_id = auth.uid()
    )
  );

create policy "operations_business_update" on public.operations
  for update using (
    exists (
      select 1 from public.propuestas p
      join public.businesses b on b.id = p.business_id
      where p.id = propuesta_id and b.owner_id = auth.uid()
    )
  ) with check (status in ('completed','disputed'));

-- ============================================================================
-- 9. Storage bucket for solicitud photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('solicitud-photos', 'solicitud-photos', true)
on conflict (id) do nothing;

create policy "solicitud_photos_authenticated_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'solicitud-photos');

create policy "solicitud_photos_public_read"
  on storage.objects for select using (bucket_id = 'solicitud-photos');

create policy "solicitud_photos_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'solicitud-photos' and owner = auth.uid());

-- ============================================================================
-- 10. Helper: accept_propuesta(propuesta_id, redemption_code)
--     Atomic: marks propuesta accepted, expires siblings, creates operation,
--             closes solicitud.
-- ============================================================================
create or replace function public.accept_propuesta(
  p_propuesta_id uuid,
  p_redemption_code text
) returns public.operations
language plpgsql security definer set search_path = public as $$
declare
  v_solicitud_id uuid;
  v_client_id uuid;
  v_operation public.operations;
begin
  select solicitud_id into v_solicitud_id from public.propuestas where id = p_propuesta_id;
  if v_solicitud_id is null then raise exception 'Propuesta not found'; end if;

  select client_id into v_client_id from public.solicitudes where id = v_solicitud_id;
  if v_client_id <> auth.uid() then raise exception 'Not authorized'; end if;

  -- Mark the chosen propuesta accepted
  update public.propuestas set status = 'accepted' where id = p_propuesta_id and status = 'pending';
  if not found then raise exception 'Propuesta no longer pending'; end if;

  -- Expire siblings
  update public.propuestas set status = 'expired'
    where solicitud_id = v_solicitud_id and id <> p_propuesta_id and status = 'pending';

  -- Close solicitud
  update public.solicitudes set status = 'accepted' where id = v_solicitud_id;

  -- Create operation row
  insert into public.operations (propuesta_id, redemption_code)
  values (p_propuesta_id, p_redemption_code)
  returning * into v_operation;

  return v_operation;
end$$;

revoke all on function public.accept_propuesta(uuid, text) from public;
grant execute on function public.accept_propuesta(uuid, text) to authenticated;
