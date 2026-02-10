-- Add indexes for common search columns to improve performance
CREATE INDEX IF NOT EXISTS idx_projects_commune ON projects(commune);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer);
CREATE INDEX IF NOT EXISTS idx_projects_property_type ON projects(property_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Add composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_projects_region_commune ON projects(region, commune);
CREATE INDEX IF NOT EXISTS idx_projects_coords ON projects(latitude, longitude);

-- Add index for sorting columns
CREATE INDEX IF NOT EXISTS idx_projects_sales_speed ON projects(sales_speed_monthly DESC);
CREATE INDEX IF NOT EXISTS idx_projects_units_sold ON projects(sold_units DESC);
CREATE INDEX IF NOT EXISTS idx_projects_price ON projects(avg_price_uf);

-- Optimize Full Text Search (if we want to search by name textually)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops);
