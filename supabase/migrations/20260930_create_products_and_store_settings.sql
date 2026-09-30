create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  category text not null default 'cookies',
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_created_at_idx
  on public.products (category, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

insert into public.products (id, name, description, price, currency, category, stock, image_url, featured)
values
  ('choc-chip', 'Classic Chocolate Chip', 'A timeless favorite, loaded with rich chocolate chips.', 3.50, 'EUR', 'cookies', 50, '/images/chocolate-chip.png', true),
  ('pineapple-upside-down', 'Pineapple Upside Down', 'Sweet pineapple and caramelized topping on a soft cookie base.', 4.00, 'EUR', 'cookies', 40, '/images/pineapple-upside-down.png', true),
  ('brownies', 'Brownies', 'Rich and fudgy chocolate brownies.', 3.25, 'EUR', 'cookies', 30, '/images/brownies.png', false),
  ('cocada', 'Cocada', 'A traditional coconut treat, sweet and chewy.', 3.25, 'EUR', 'cookies', 30, '/images/cocada.png', false)
on conflict (id) do nothing;

create table if not exists public.store_settings (
  id integer primary key check (id = 1),
  theme jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

insert into public.store_settings (id, theme)
values (
  1,
  '{
    "shopName": "Cookie Corner",
    "tagline": "Freshly baked happiness, delivered to your door.",
    "colors": {
      "primary": "#8B5E3C",
      "secondary": "#F4B942",
      "accent": "#D96C4C",
      "background": "#FFF8F0",
      "text": "#3A2618"
    }
  }'::jsonb
)
on conflict (id) do nothing;
