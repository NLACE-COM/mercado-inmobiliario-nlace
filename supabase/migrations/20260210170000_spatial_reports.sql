-- Function to get Project Benchmark based on a Polygon (WKT format)
create or replace function get_projects_in_polygon(
  polygon_wkt text
)
returns table (
  id uuid,
  name text,
  developer text,
  total_units int,
  sold_units int,
  stock int,
  percent_sold numeric,
  avg_price_uf numeric,
  sales_speed numeric,
  mao numeric,
  latitude float8,
  longitude float8
)
language sql
as $$
  select 
    id,
    name,
    developer,
    total_units,
    sold_units,
    available_units as stock,
    case when total_units > 0 then round((sold_units::numeric / total_units) * 100, 1) else 0 end as percent_sold,
    avg_price_uf,
    sales_speed_monthly as sales_speed,
    months_to_sell_out as mao,
    latitude,
    longitude
  from projects
  where 
    -- Filter projects with valid coordinates
    latitude is not null and longitude is not null
    and ST_Contains(
      ST_GeomFromText(polygon_wkt, 4326),
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    )
  order by sales_speed_monthly desc nulls last;
$$;
