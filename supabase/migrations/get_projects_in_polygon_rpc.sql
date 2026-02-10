-- Función para buscar proyectos dentro de un polígono WKT
create or replace function get_projects_in_polygon(polygon_wkt text)
returns setof public.projects
language sql
security definer
as $$
  select *
  from public.projects
  where st_contains(st_geomfromtext(polygon_wkt, 4326), location);
$$;
