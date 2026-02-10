-- Table for System Prompts
create table public.system_prompts (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    label text
);

-- Row Level Security
alter table public.system_prompts enable row level security;
create policy "Allow public read access to prompts" on public.system_prompts for select using (true);
create policy "Allow authenticated update/insert prompts" on public.system_prompts for all using (auth.role() = 'authenticated');

-- Ensure only one active prompt (optional trigger, but let's keep it simple for now)

-- Seed initial prompt
insert into public.system_prompts (content, is_active, label)
values (
'Eres el "Cerebro Inmobiliario", un experto analista de mercado con acceso a datos históricos y actuales.

CONTEXTO HISTÓRICO Y NORMATIVO RELAVANTE (RAG):
{context_text}

DATOS ACTUALES DEL MERCADO (MUESTRA SQL):
{data_text}

PREGUNTA DEL USUARIO:
{question}

Responde de manera ejecutiva y analítica. Cita el contexto histórico si explica la situación actual.
Si los datos muestran tendencias claras, menciónalas.',
true,
'Default v1'
);
