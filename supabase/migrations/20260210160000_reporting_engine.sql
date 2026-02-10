-- Create table for storing generated reports
create table if not exists public.generated_reports (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    user_id uuid references auth.users(id), -- Optional: link to creator if auth is enabled
    
    title text not null,
    report_type text not null, -- 'COMMUNE_MARKET', 'PROJECT_BENCHMARK'
    
    -- Parameters used to generate the report (for reproducibility)
    parameters jsonb not null default '{}'::jsonb, 
    -- Example: { "commune": "Santiago", "price_ranges": [0, 2000, 4000], "period": "2023-Q4" }

    -- The complete report content structure
    content jsonb, 
    -- Example: { 
    --   "sections": [
    --      { "type": "text", "content": "El mercado de Santiago..." },
    --      { "type": "matrix_chart", "data": {...} } 
    --   ]
    -- }

    status text not null default 'draft', -- 'draft', 'generating', 'completed', 'failed'
    error_message text
);

-- Indexes for faster lookups
create index if not exists idx_reports_user_id on public.generated_reports(user_id);
create index if not exists idx_reports_type on public.generated_reports(report_type);
create index if not exists idx_reports_created on public.generated_reports(created_at desc);

-- RLS Policies (Open for now/dev, lock down later)
alter table public.generated_reports enable row level security;

create policy "Enable read access for all users" on public.generated_reports
    for select using (true);

create policy "Enable insert access for all users" on public.generated_reports
    for insert with check (true);

create policy "Enable update access for all users" on public.generated_reports
    for update using (true);

-- Function to update 'updated_at' automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_reports_updated_at
    before update on public.generated_reports
    for each row
    execute procedure public.handle_updated_at();
