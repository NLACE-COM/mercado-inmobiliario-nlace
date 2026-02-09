-- Enable PostGIS extension for geospatial data
create extension if not exists postgis;

-- Enable UUID extension for primary keys
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. Projects Table (Master Table from TINSA/Base Data)
--------------------------------------------------------------------------------
create table public.projects (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

    -- Identification (TINSA)
    tinsa_id text unique, -- Original ID from external source if available
    name text not null,
    developer text,
    commune text not null,
    region text not null,
    address text,
    
    -- Geospatial (PostGIS)
    location geometry(Point, 4326), 
    latitude numeric,
    longitude numeric,

    -- Project Characteristics
    project_status text, -- 'En Blanco', 'En Verde', 'Entrega Inmediata'
    property_type text, -- 'Departamento', 'Casa', 'Oficina'
    category text, -- E.g., 'Subsidio DS19', 'Privado'
    total_floors integer,
    total_apartments integer,

    -- Timeline
    sales_start_date date,
    delivery_date date,
    construction_start_date date,
    reception_date date,
    
    -- Current Snapshot Metrics (Updated by ETL periodically)
    total_units integer default 0,
    available_units integer default 0,
    sold_units integer default 0,
    sales_speed_monthly numeric(10, 2), -- Units per month
    months_to_sell_out numeric(10, 1), -- MAO

    -- Pricing Snapshot
    min_price_uf numeric(10, 2),
    max_price_uf numeric(10, 2),
    avg_price_uf numeric(10, 2),
    avg_price_m2_uf numeric(10, 2),

    constraint projects_name_commune_key unique (name, commune)
);

-- Index for geospatial search
create index projects_location_idx on public.projects using gist (location);
create index projects_commune_idx on public.projects (commune);

--------------------------------------------------------------------------------
-- 2. Project Typologies (Mix of Products: 1D-1B, 2D-2B, etc.)
--------------------------------------------------------------------------------
create table public.project_typologies (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id) on delete cascade not null,
    
    -- Typology Definition
    name text, -- E.g., "G2", "A1" or "2D-2B"
    bedrooms integer,
    bathrooms integer,
    
    -- Surface Areas
    surface_total numeric(10, 2),
    surface_indoor numeric(10, 2), -- Useful surface
    surface_terrace numeric(10, 2),

    -- Pricing & Stock
    current_price_uf numeric(10, 2),
    price_per_m2_uf numeric(10, 2),
    stock integer,
    total_units integer, -- Initial total for this typology

    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

--------------------------------------------------------------------------------
-- 3. Metrics History (Time Series for Analytics & Trends)
--------------------------------------------------------------------------------
create table public.project_metrics_history (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id) on delete cascade not null,
    recorded_at date not null default current_date,
    
    -- Commercial Metrics Snapshot
    stock integer,
    sold_accumulated integer,
    sales_monthly integer, -- Flow
    price_avg_uf numeric(10, 2),
    price_avg_m2 numeric(10, 2),
    months_to_sell_out numeric(10, 1), -- MAO

    constraint unique_project_date unique (project_id, recorded_at)
);

--------------------------------------------------------------------------------
-- 4. Market Insights (AI Generated Context)
--------------------------------------------------------------------------------
create table public.market_insights (
    id uuid primary key default uuid_generate_v4(),
    target_type text, -- 'project', 'commune', 'region'
    target_id text, -- UUID of project or Name of commune/region
    
    generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Content
    title text,
    content text not null, -- The AI generated explanation
    insight_type text, -- 'trend', 'anomaly', 'prediction', 'historical_context'
    sentiment text, -- 'positive', 'negative', 'neutral'
    
    -- Metadata
    metrics_analyzed jsonb, -- E.g. {"start_date": "2020-01", "end_date": "2024-01"}
    model_version text
);

--------------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
--------------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.project_typologies enable row level security;
alter table public.project_metrics_history enable row level security;
alter table public.market_insights enable row level security;

-- Public Read Access (MVP)
create policy "Allow public read access to projects" on public.projects for select using (true);
create policy "Allow public read access to typologies" on public.project_typologies for select using (true);
create policy "Allow public read access to metrics" on public.project_metrics_history for select using (true);
create policy "Allow public read access to insights" on public.market_insights for select using (true);
