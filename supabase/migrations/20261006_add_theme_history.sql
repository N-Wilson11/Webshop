create table if not exists public.theme_history (
  id bigint generated always as identity primary key,
  theme jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists theme_history_created_at_idx
  on public.theme_history (created_at desc, id desc);

alter table public.theme_history enable row level security;

create or replace function public.set_store_theme(p_theme jsonb)
returns jsonb
language plpgsql
as $$
declare
  current_theme jsonb;
begin
  select theme into current_theme
  from public.store_settings
  where id = 1
  for update;

  if not found then
    raise exception 'Store settings are not initialized';
  end if;

  if current_theme is distinct from p_theme then
    insert into public.theme_history (theme) values (current_theme);

    delete from public.theme_history
    where id in (
      select id
      from public.theme_history
      order by created_at desc, id desc
      offset 5
    );
  end if;

  update public.store_settings
  set theme = p_theme
  where id = 1
  returning theme into current_theme;

  return current_theme;
end;
$$;

create or replace function public.restore_store_theme(p_history_id bigint)
returns jsonb
language plpgsql
as $$
declare
  current_theme jsonb;
  restored_theme jsonb;
begin
  select theme into restored_theme
  from public.theme_history
  where id = p_history_id
  for update;

  if not found then
    return null;
  end if;

  select theme into current_theme
  from public.store_settings
  where id = 1
  for update;

  delete from public.theme_history where id = p_history_id;
  insert into public.theme_history (theme) values (current_theme);

  delete from public.theme_history
  where id in (
    select id
    from public.theme_history
    order by created_at desc, id desc
    offset 5
  );

  update public.store_settings
  set theme = restored_theme
  where id = 1;

  return restored_theme;
end;
$$;
