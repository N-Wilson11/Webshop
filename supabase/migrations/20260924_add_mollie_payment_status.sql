alter table public.orders
  add column if not exists payment_id text,
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('open', 'pending', 'paid', 'canceled', 'expired', 'failed')),
  add column if not exists paid_at timestamptz;

create unique index if not exists orders_payment_id_key
  on public.orders (payment_id)
  where payment_id is not null;
