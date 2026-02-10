# Guía de Despliegue - Mercado Inmobiliario

Este proyecto consta de dos partes principales: un Frontend (Next.js) y un Backend (FastAPI). A continuación, los pasos para desplegar ambos.

---

## 1. Backend (FastAPI) en Railway o Render
*Recomendado por su soporte nativo para Docker y Python.*

### Pasos:
1. Sube los cambios con el archivo `backend/requirements.txt` recientemente generado.
2. Crea una cuenta en [Railway.app](https://railway.app) o [Render.com](https://render.com).
3. Conecta tu repositorio de GitHub.
4. Selecciona la carpeta `backend` como el directorio base.
5. Configura las variables de entorno:
   - `OPENAI_API_KEY`: Tu llave de OpenAI.
   - `SUPABASE_URL`: Tu URL de Supabase.
   - `SUPABASE_KEY`: Tu Service Role Key.
6. El sistema detectará automáticamente el `Dockerfile` y desplegará la API.

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
