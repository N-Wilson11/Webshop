create or replace function public.reserve_product_stock(p_items jsonb)
returns boolean
language plpgsql
as $$
declare
  requested_item record;
  available_stock integer;
begin
  for requested_item in
    select
      element->>'id' as id,
      sum((element->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as element
    group by element->>'id'
    order by element->>'id'
  loop
    select stock into available_stock
    from public.products
    where id = requested_item.id
    for update;

    if not found or available_stock < requested_item.quantity then
      return false;
    end if;
  end loop;

  for requested_item in
    select
      element->>'id' as id,
      sum((element->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as element
    group by element->>'id'
    order by element->>'id'
  loop
    update public.products
    set stock = stock - requested_item.quantity,
        updated_at = now()
    where id = requested_item.id;
  end loop;

  return true;
end;
$$;

create or replace function public.release_product_stock(p_items jsonb)
returns boolean
language plpgsql
as $$
declare
  requested_item record;
begin
  for requested_item in
    select
      element->>'id' as id,
      sum((element->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as element
    group by element->>'id'
    order by element->>'id'
  loop
    update public.products
    set stock = stock + requested_item.quantity,
        updated_at = now()
    where id = requested_item.id;

    if not found then
      return false;
    end if;
  end loop;

  return true;
end;
$$;
