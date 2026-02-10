-- Primero eliminamos la función existente para evitar conflictos de tipos
DROP FUNCTION IF EXISTS get_projects_in_polygon(text);

-- Luego creamos la nueva versión
create or replace function get_projects_in_polygon(polygon_wkt text)
returns setof public.projects
language sql
security definer
as $$
  select *
  from public.projects
  where st_contains(st_geomfromtext(polygon_wkt, 4326), location);
$$;
