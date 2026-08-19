create extension if not exists pgcrypto;

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  side text not null check (side in ('support', 'against')),
  value integer not null,
  reason text not null,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_created_at_idx on public.ledger (created_at desc);
create index if not exists ledger_side_idx on public.ledger (side);

create table if not exists public.claims (
  session_id text primary key,
  created_at timestamptz not null,
  value integer not null default 1 check (value = 1)
);

create table if not exists public.config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gift_id text not null,
  amount_cents integer not null check (amount_cents > 0),
  score_value integer not null check (score_value > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  provider text not null,
  session_id text,
  payment_ref text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

insert into public.config (key, value)
values (
  'gifts',
  '[
    {"id":"spark","name":"星火","priceCents":600,"scoreValue":60,"icon":"✦","enabled":true},
    {"id":"wave","name":"声浪","priceCents":1800,"scoreValue":250,"icon":"≈","enabled":true},
    {"id":"pulse","name":"心跳","priceCents":6800,"scoreValue":1000,"icon":"◉","enabled":true},
    {"id":"signal","name":"信号塔","priceCents":12800,"scoreValue":2200,"icon":"⌁","enabled":true}
  ]'::jsonb
)
on conflict (key) do nothing;

create or replace function public.claim_support_stick(
  p_session_id text,
  p_now timestamptz default now()
)
returns table(status text, next_at timestamptz, value integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created_at timestamptz;
begin
  select c.created_at
    into v_created_at
    from public.claims c
   where c.session_id = p_session_id
   for update;

  if v_created_at is not null and v_created_at + interval '1 hour' > p_now then
    return query select 'cooldown'::text, v_created_at + interval '1 hour', 1;
    return;
  end if;

  insert into public.claims (session_id, created_at, value)
  values (p_session_id, p_now, 1)
  on conflict (session_id) do update
    set created_at = excluded.created_at, value = 1;

  insert into public.ledger (side, value, reason, session_id, created_at)
  values ('support', 1, 'support_stick', p_session_id, p_now);

  return query select 'claimed'::text, p_now + interval '1 hour', 1;
end;
$$;

create or replace function public.confirm_gift_order(
  p_order_id uuid,
  p_now timestamptz default now()
)
returns table(status text, score_value integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    return query select 'not_found'::text, 0;
    return;
  end if;

  if v_order.status = 'confirmed' then
    return query select 'already_confirmed'::text, v_order.score_value;
    return;
  end if;

  if v_order.status <> 'pending' then
    return query select 'invalid_status'::text, 0;
    return;
  end if;

  if v_order.created_at + interval '60 seconds' > p_now then
    return query select 'too_early'::text, 0;
    return;
  end if;

  update public.orders
     set status = 'confirmed', confirmed_at = p_now
   where id = p_order_id;

  insert into public.ledger (side, value, reason, session_id, created_at)
  values ('support', v_order.score_value, 'gift_purchase:' || v_order.gift_id, v_order.session_id, p_now);

  return query select 'confirmed'::text, v_order.score_value;
end;
$$;

alter table public.ledger enable row level security;
alter table public.claims enable row level security;
alter table public.config enable row level security;
alter table public.orders enable row level security;

revoke all on public.ledger, public.claims, public.config, public.orders from anon, authenticated;
grant all on public.ledger, public.claims, public.config, public.orders to service_role;
revoke all on function public.claim_support_stick(text, timestamptz) from public, anon, authenticated;
revoke all on function public.confirm_gift_order(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_support_stick(text, timestamptz) to service_role;
grant execute on function public.confirm_gift_order(uuid, timestamptz) to service_role;
