create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in (
    'visit', 'support_selected', 'quiz_completed', 'support_arena',
    'share_clicked', 'share_claimed', 'gift_clicked', 'payment_confirmed'
  )),
  session_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_created_at_idx on public.funnel_events (created_at desc);
create index if not exists funnel_events_stage_idx on public.funnel_events (stage);
create index if not exists funnel_events_session_idx on public.funnel_events (session_id);

create or replace function public.claim_share_reward(
  p_session_id text,
  p_now timestamptz default now()
)
returns table(status text, value integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ledger (side, value, reason, session_id, created_at)
  values ('support', 10, 'share_reward', p_session_id, p_now);

  insert into public.funnel_events (stage, session_id, created_at)
  values ('share_claimed', p_session_id, p_now);

  return query select 'claimed'::text, 10;
end;
$$;

alter table public.funnel_events enable row level security;
revoke all on public.funnel_events from anon, authenticated;
grant all on public.funnel_events to service_role;
revoke all on function public.claim_share_reward(text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_share_reward(text, timestamptz) to service_role;
