# Guía de Despliegue - Mercado Inmobiliario

Este proyecto consta de dos partes principales: un Frontend (Next.js) y un Backend (FastAPI). A continuación, los pasos para desplegar ambos.

---

## 1. Backend (FastAPI) en Vercel
*Recomendado ya que posees cuenta **Vercel Pro**, lo que permite tiempos de ejecución largos para la IA.*

### Pasos:
1. Sube los cambios con el archivo `backend/vercel.json` y `backend/requirements.txt`.
2. En Vercel, crea un **Nuevo Proyecto**.
3. Selecciona el mismo repositorio.
4. **Configuración de Proyecto (Backend):**
   - **Nombe**: `mercado-inmobiliario-backend`
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
5. Configura las variables de entorno en Vercel:
   - `OPENAI_API_KEY`: Tu llave de OpenAI.
   - `SUPABASE_URL`: Tu URL de Supabase.
   - `SUPABASE_KEY`: Tu Service Role Key.
6. Vercel desplegará tu API de Python automáticamente.

---

## 2. Frontend (Next.js) en Vercel

### Pasos:
1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Selecciona tu repositorio `mercado-inmobiliario-nlace`.
3. **Configuración de Proyecto (Importante):**
   - **Root Directory**: Cambia esto a `frontend`.
   - **Framework Preset**: Next.js.
4. **Variables de Entorno**:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Tu token de Mapbox.
   - `NEXT_PUBLIC_API_URL`: Aquí debes poner la **URL de tu backend desplegado** (ej: `https://mi-api.railway.app`).
5. Haz clic en **Deploy**.

---

## 3. Consideraciones Post-Despliegue

### CORS:
Asegúrate de que en `backend/app/main.py` la lista de `allow_origins` incluya el dominio que te asigne Vercel (ej: `https://mercado-inmobiliario.vercel.app`).

### Supabase RLS:
Asegúrate de que tus políticas de seguridad en Supabase permitan que la API lea y escriba en las tablas correspondientes.
