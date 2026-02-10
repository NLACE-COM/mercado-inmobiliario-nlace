# Guía de Despliegue Unificado en Vercel Pro

Este proyecto está configurado para desplegarse como una sola unidad en Vercel, aprovechando los beneficios de tu cuenta **Vercel Pro**.

---

## 🚀 Pasos para el Despliegue (Un solo Proyecto)

1. **Importar Repositorio**:
   - Ve a [Vercel.com](https://vercel.com) e importa tu repositorio `mercado-inmobiliario-nlace`.

2. **Configuración del Proyecto**:
   - **Root Directory**: Deja este campo **vacío** (estamos usando el `vercel.json` de la raíz para coordinar todo).
   - **Framework Preset**: Selecciona **"Other"** (Vercel detectará Next.js y Python automáticamente a través de la configuración).

3. **Variables de Entorno**:
   Agrega todas las variables necesarias en el mismo proyecto:
   
   **Frontend:**
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Tu token de Mapbox.
   - `NEXT_PUBLIC_API_URL`: Deja este valor **vacío** o pon `/api` (el sistema ahora es inteligente y sabe redireccionar internamente).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key de Supabase.

   **Backend:**
   - `OPENAI_API_KEY`: Tu llave de OpenAI.
   - `SUPABASE_URL`: La misma URL de Supabase.
   - `SUPABASE_KEY`: Tu **Service Role Key** (Secreta).

4. **Botón de Deploy**:
   - Haz clic en **Deploy**. 
   - Vercel construirá el Frontend y el Backend simultáneamente.

---

## 🛠 Ventajas de este método
- **Una sola URL**: Tu aplicación estará en `proyecto.vercel.app` y tu API en `proyecto.vercel.app/api`.
- **Sin problemas de CORS**: Al estar en el mismo dominio, el navegador no bloqueará las peticiones.
- **Tiempos Pro**: Al usar Vercel Pro, tus reportes de IA podrán tardar hasta 5 minutos sin cortarse.

---

## 🔍 Notas adicionales
- El archivo `vercel.json` en la raíz se encarga de que las peticiones a `/api/*` lleguen al motor de Python en la carpeta `/backend`.
- El resto de las rutas son manejadas por Next.js en la carpeta `/frontend`.
