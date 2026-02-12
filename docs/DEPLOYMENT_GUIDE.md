# Guía de Despliegue en Vercel

## Resumen
Este repositorio es monorepo, pero el despliegue activo en Vercel es el de `frontend` (Next.js).
El backend en `backend/` es legacy y no es necesario para el deploy actual.

## Opción recomendada (Dashboard de Vercel)
1. Importa el repositorio en Vercel.
2. En **Root Directory**, selecciona `frontend`.
3. Framework: `Next.js` (auto detectado).
4. Build command: usa el default de Vercel (`npm run build`) o explícito `npm run build`.
5. Install command: usa el default de Vercel (`npm install`) o explícito `npm install`.
6. Deploy.

Importante: no uses comandos con `cd frontend` si el Root Directory ya es `frontend`.

## Variables de entorno requeridas
Configúralas en Vercel para los ambientes que uses (Preview/Production):

### Públicas
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_API_URL` (opcional; dejar vacío para usar `/api`)

### Secretas (server-side)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_KEY` (opcional, alias de `SUPABASE_SERVICE_ROLE_KEY`)

## Opción CLI (desde la raíz)
```bash
vercel --cwd frontend
```

## Checklist rápido
- `frontend/.env.example` actualizado y sin secretos reales
- No subir `frontend/.env.local`
- Node 20+ (`frontend/.nvmrc`)
- Proyecto en Vercel apuntando a `frontend`
