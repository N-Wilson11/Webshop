create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) > 0),
  customer_email text not null,
  delivery_address text not null check (char_length(delivery_address) > 0),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  currency text not null check (char_length(currency) = 3)
);

alter table public.orders enable row level security;
