alter table public.orders
  add column if not exists completed_at timestamptz;

create index if not exists orders_completed_at_created_at_idx
  on public.orders (completed_at, created_at desc);
