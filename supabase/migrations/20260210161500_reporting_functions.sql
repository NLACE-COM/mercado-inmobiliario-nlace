-- Function to generate Market Matrix (Sales & Offer) by Price Range and Period
create or replace function get_market_matrix(
  commune_filter text,
  price_ranges numeric[], -- e.g. [0, 2000, 3000, 4000, 7000, 99999]
  period_type text default 'quarterly' -- 'quarterly' or 'semiannual'
)
returns jsonb
language plpgsql
as $$
declare
  period_format text;
  result jsonb;
begin
  -- Define period formatting based on input
  if period_type = 'quarterly' then
    period_format := 'YYYY-"Q"Q'; -- e.g. 2023-Q1
  else
    period_format := 'YYYY-"S"'; -- This is tricky in PG, let's use custom logic or simplified quarters
    -- Using simple Quarter for now as base
    period_format := 'YYYY-"Q"Q'; 
  end if;

  with project_data as (
    select 
      id,
      name,
      avg_price_uf,
      total_units,
      sold_units,
      available_units,
      sales_start_date,
      -- Determine price segment based on input ranges
      width_bucket(avg_price_uf, price_ranges) as segment_idx
    from projects
    where commune = commune_filter
      and avg_price_uf is not null
  ),
  aggregated as (
    select 
      segment_idx,
      count(*) as project_count,
      sum(total_units) as total_supply,
      sum(sold_units) as total_sales,
      sum(available_units) as current_stock
    from project_data
    group by segment_idx
  )
  select jsonb_build_object(
    'segments', (select jsonb_agg(s) from generate_series(1, array_length(price_ranges, 1)) s),
    'data', (select jsonb_agg(row_to_json(aggregated)) from aggregated)
  ) into result;

  return result;
end;
$$;

-- Function to get Project Benchmark
create or replace function get_project_benchmark(
  commune_filter text
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
  mao numeric
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
    months_to_sell_out as mao
  from projects
  where commune = commune_filter
  order by sales_speed_monthly desc nulls last;
$$;
