-- Función para obtener comunas únicas de forma eficiente
create or replace function get_project_communes()
returns table (commune text)
language sql
security definer -- Para que pueda ser llamada por la API sin problemas de RLS complejos por ahora
as $$
  select distinct commune
  from public.projects
  where commune is not null
  order by commune;
$$;
