-- Auto-create a profile (and business + trialing subscription, if role=business) when an auth.users row is inserted.
-- The client passes role + identity in supabase.auth.signUp({ options: { data: {...} } }), which lands in raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_business_name text;
  v_district text;
  v_business_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_business_name := new.raw_user_meta_data->>'business_name';
  v_district := new.raw_user_meta_data->>'district';

  if v_role not in ('client','business') then
    raise exception 'Invalid role: %', v_role;
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_full_name);

  if v_role = 'business' then
    if v_business_name is null or length(trim(v_business_name)) = 0 then
      raise exception 'business_name is required for role=business';
    end if;

    insert into public.businesses (owner_id, name, district)
    values (new.id, v_business_name, v_district)
    returning id into v_business_id;

    insert into public.subscriptions (business_id, plan_id, status, propuestas_used_this_period)
    values (v_business_id, 'basico', 'trialing', 0);
  end if;

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
