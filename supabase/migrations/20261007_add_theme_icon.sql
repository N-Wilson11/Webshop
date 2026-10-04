update public.store_settings
set theme = jsonb_set(theme, '{iconUrl}', '"/icon.svg"'::jsonb)
where not theme ? 'iconUrl';

update public.theme_history
set theme = jsonb_set(theme, '{iconUrl}', '"/icon.svg"'::jsonb)
where not theme ? 'iconUrl';
