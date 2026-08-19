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

  update public.orders
     set status = 'confirmed', confirmed_at = p_now
   where id = p_order_id;

  insert into public.ledger (side, value, reason, session_id, created_at)
  values ('support', v_order.score_value, 'gift_purchase:' || v_order.gift_id, v_order.session_id, p_now);

  return query select 'confirmed'::text, v_order.score_value;
end;
$$;
