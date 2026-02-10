-- Add missing TINSA columns to projects table
-- These columns map directly to TINSA's 47-field structure

-- Identification & Period tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tinsa_key text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS period text;          -- '1P', '2P' (semester)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zona text;            -- 'NORTE', 'SUR', 'CENTRO'

-- Actors
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS seller text;          -- VENDE
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS builder text;         -- CONSTRUYE

-- Construction & Classification
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS construction_status text;  -- ESTADO OBRA (Faenas, Obra Gruesa, Terminaciones, Entregado)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS kitchen_type text;         -- TIPO DE COCINA
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS street_number text;        -- NUMERO

-- Velocity & Time
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS velocity_projected numeric(10,2);  -- UNIDADES/MES (P)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS months_on_sale numeric(10,1);       -- MESES EN VENTA

-- Stock
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS initial_stock integer;      -- STOCK INICIAL
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS period_offer integer;       -- OFERTA DEL PERIODO

-- Extras
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS parking_count integer;          -- CANT ESTACIONAMIENTOS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS parking_price numeric(10,2);    -- PRECIO ESTACIONAMIENTO
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS storage_price numeric(10,2);    -- PRECIO BODEGA
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS pilot_available boolean;        -- PILOTO DISPONIBLE
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sales_room boolean;             -- SALA DE VENTAS EN EL PROYECTO
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2); -- DESCUENTO PROMEDIO
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subsidy_type text;              -- TIPO DE SUBSIDIO

-- Add typology-level TINSA fields
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS typology_code text;        -- TIPOLOGIA (1D-1B, 2D-2B, etc.)
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS kitchen_type text;          -- TIPO DE COCINA
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS parking_spots integer;      -- PLAZAS
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS land_surface numeric(10,2); -- SUPERFICIE TERRENO
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS avg_price_uf numeric(10,2); -- PRECIO PROMEDIO
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS price_per_m2_uf numeric(10,2); -- already exists, just ensuring
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS min_price_uf numeric(10,2);  -- PRECIO MINIMO UF
ALTER TABLE public.project_typologies ADD COLUMN IF NOT EXISTS max_price_uf numeric(10,2);  -- PRECIO MAXIMO UF

-- Indexes for new query patterns
CREATE INDEX IF NOT EXISTS projects_zona_idx ON public.projects (zona);
CREATE INDEX IF NOT EXISTS projects_year_period_idx ON public.projects (year, period);
CREATE INDEX IF NOT EXISTS projects_developer_idx ON public.projects (developer);
CREATE INDEX IF NOT EXISTS projects_subsidy_idx ON public.projects (subsidy_type);
CREATE INDEX IF NOT EXISTS projects_construction_status_idx ON public.projects (construction_status);

-- Drop the old unique constraint and create a better one for TINSA data
-- TINSA rows are unique by project + commune + typology + period
-- But for the projects table we want uniqueness by name + commune
-- (kept as-is since it already exists)
