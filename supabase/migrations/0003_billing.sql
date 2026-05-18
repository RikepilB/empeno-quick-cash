-- ============================================================================
-- 0003_billing.sql
-- Phase 4: subscription billing (invoices, plan changes, period rollover)
-- and a small RLS fix carried over from Phase 3.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. invoices table — one row per Culqi charge (real or demo)
-- ----------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id text references public.plans(id),
  amount_pen integer not null,
  status text not null check (status in ('pending','paid','failed','refunded','demo')),
  culqi_charge_id text unique,
  culqi_order_id text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invoices_business_idx
  on public.invoices(business_id, created_at desc);

alter table public.invoices enable row level security;

create policy "invoices_owner_read" on public.invoices
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Writes only via SECURITY DEFINER server functions — no direct client policy.

-- ----------------------------------------------------------------------------
-- 2. Loosen solicitudes biz-read policy
--    The old policy restricted business reads to status='active'. After accept,
--    biz portal needs to read closed solicitudes they bid on (for the propuestas
--    list to show category/brand/model).
-- ----------------------------------------------------------------------------
drop policy if exists "solicitudes_business_read_active" on public.solicitudes;

create policy "solicitudes_business_read" on public.solicitudes
  for select to authenticated using (
    -- active solicitudes visible to any subscribed business
    (
      status = 'active'
      and exists (
        select 1 from public.businesses b
        join public.subscriptions s on s.business_id = b.id
        where b.owner_id = auth.uid()
          and s.status in ('active','trialing')
      )
    )
    -- AND any solicitud the business has a propuesta on (any status)
    or exists (
      select 1
      from public.propuestas p
      join public.businesses b on b.id = p.business_id
      where p.solicitud_id = public.solicitudes.id
        and b.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 3. RPC: change_subscription_plan
--    Server-side plan switch. Called by billing.ts after a successful
--    Culqi charge (or by the demo path). Returns the updated subscription row.
-- ----------------------------------------------------------------------------
create or replace function public.change_subscription_plan(
  p_plan_id text,
  p_culqi_subscription_id text default null,
  p_period_end timestamptz default null
) returns public.subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_business_id uuid;
  v_sub public.subscriptions;
begin
  -- Caller must own a business
  select b.id into v_business_id
  from public.businesses b
  where b.owner_id = auth.uid()
  limit 1;
  if v_business_id is null then raise exception 'No business for current user'; end if;

  -- Verify plan exists
  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'Unknown plan: %', p_plan_id;
  end if;

  -- Update the current active/trialing subscription. If none, create one.
  update public.subscriptions
     set plan_id = p_plan_id,
         status = 'active',
         culqi_subscription_id = coalesce(p_culqi_subscription_id, culqi_subscription_id),
         current_period_end = coalesce(p_period_end, current_period_end),
         propuestas_used_this_period = 0
   where business_id = v_business_id
     and status in ('active','trialing','past_due')
  returning * into v_sub;

  if v_sub.id is null then
    insert into public.subscriptions
      (business_id, plan_id, status, culqi_subscription_id, current_period_end)
    values
      (v_business_id, p_plan_id, 'active', p_culqi_subscription_id, p_period_end)
    returning * into v_sub;
  end if;

  return v_sub;
end$$;

revoke all on function public.change_subscription_plan(text, text, timestamptz) from public;
grant execute on function public.change_subscription_plan(text, text, timestamptz) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. RPC: reset_period_usage
--    Sets propuestas_used_this_period = 0 and bumps current_period_end +1 month
--    for every active subscription whose period has ended. Intended to run from
--    a Supabase scheduled cron once per day.
-- ----------------------------------------------------------------------------
create or replace function public.reset_period_usage()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  with rolled as (
    update public.subscriptions
       set propuestas_used_this_period = 0,
           current_period_end = current_period_end + interval '1 month'
     where status in ('active','trialing')
       and current_period_end is not null
       and current_period_end <= now()
    returning id
  )
  select count(*) into v_count from rolled;
  return v_count;
end$$;

revoke all on function public.reset_period_usage() from public;
-- only callable from server (no grant to anon/authenticated)

-- ----------------------------------------------------------------------------
-- 5. RPC: record_invoice
--    Inserts an invoice tied to the caller's business. Used by the demo
--    path of startCheckout when CULQI_SECRET_KEY is missing.
-- ----------------------------------------------------------------------------
create or replace function public.record_invoice(
  p_subscription_id uuid,
  p_plan_id text,
  p_amount_pen integer,
  p_status text,
  p_culqi_charge_id text default null,
  p_culqi_order_id text default null,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_business_id uuid;
  v_inv public.invoices;
begin
  select b.id into v_business_id
  from public.businesses b
  where b.owner_id = auth.uid()
  limit 1;
  if v_business_id is null then raise exception 'No business for current user'; end if;

  if p_status not in ('pending','paid','failed','refunded','demo') then
    raise exception 'Invalid invoice status: %', p_status;
  end if;

  insert into public.invoices
    (business_id, subscription_id, plan_id, amount_pen, status,
     culqi_charge_id, culqi_order_id, period_start, period_end,
     paid_at)
  values
    (v_business_id, p_subscription_id, p_plan_id, p_amount_pen, p_status,
     p_culqi_charge_id, p_culqi_order_id, p_period_start, p_period_end,
     case when p_status in ('paid','demo') then now() else null end)
  returning * into v_inv;

  return v_inv;
end$$;

revoke all on function public.record_invoice(uuid, text, integer, text, text, text, timestamptz, timestamptz) from public;
grant execute on function public.record_invoice(uuid, text, integer, text, text, text, timestamptz, timestamptz) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. RPC: increment_propuestas_used
--    Bumps subscriptions.propuestas_used_this_period for the caller's
--    business. Atomic and quota-aware: returns false if the plan limit
--    would be exceeded. SECURITY DEFINER because subscriptions writes are
--    server-only by policy.
-- ----------------------------------------------------------------------------
create or replace function public.increment_propuestas_used()
returns table (used integer, allowed boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_business_id uuid;
  v_sub_id uuid;
  v_used integer;
  v_limit integer;
begin
  select b.id into v_business_id
  from public.businesses b
  where b.owner_id = auth.uid()
  limit 1;
  if v_business_id is null then raise exception 'No business for current user'; end if;

  select s.id, s.propuestas_used_this_period, p.monthly_propuestas
    into v_sub_id, v_used, v_limit
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.business_id = v_business_id
    and s.status in ('active','trialing')
  limit 1;
  if v_sub_id is null then raise exception 'No active subscription'; end if;

  if v_limit is not null and v_used >= v_limit then
    return query select v_used, false;
    return;
  end if;

  update public.subscriptions
     set propuestas_used_this_period = propuestas_used_this_period + 1
   where id = v_sub_id
  returning propuestas_used_this_period into v_used;

  return query select v_used, true;
end$$;

revoke all on function public.increment_propuestas_used() from public;
grant execute on function public.increment_propuestas_used() to authenticated;
