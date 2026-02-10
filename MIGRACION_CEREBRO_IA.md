# Migración del Cerebro IA a Next.js

## ✅ Cambios Realizados

### 1. Nueva Arquitectura
- **Antes**: Backend Python (FastAPI) + Frontend Next.js
- **Ahora**: Todo en Next.js (API Routes + Frontend)

### 2. Archivos Creados

#### API Routes (Next.js)
- `/api/brain/chat/route.ts` - Chat con IA
- `/api/brain/admin/prompts/route.ts` - Gestión de prompts
- `/api/brain/admin/knowledge/route.ts` - Base de conocimientos

#### Utilidades
- `/lib/supabase-server.ts` - Cliente Supabase para servidor
- `/lib/vector-store.ts` - Vector store para RAG
- `/lib/brain-agent.ts` - Agente IA con herramientas
- `/lib/default-prompt.txt` - Prompt por defecto

### 3. Dependencias Instaladas
```json
{
  "langchain": "latest",
  "@langchain/openai": "latest",
  "@langchain/community": "latest",
  "@langchain/core": "latest",
  "openai": "latest",
  "zod": "latest"
}
```

## 🔧 Configuración Necesaria

### Variables de Entorno en Vercel

Debes agregar estas variables en Vercel:

1. **SUPABASE_SERVICE_ROLE_KEY**
   - Ve a tu proyecto Supabase
   - Settings → API → Project API keys
   - Copia el "service_role" key (NO el anon key)
   - Agrégalo en Vercel: Settings → Environment Variables

2. **OPENAI_API_KEY**
   - Ve a https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Agrégala en Vercel: Settings → Environment Variables

3. **NEXT_PUBLIC_SUPABASE_URL** (ya la tienes)
4. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (ya la tienes)

## 🚀 Despliegue

### Opción 1: Deploy Automático
1. Haz push a GitHub
2. Vercel detectará los cambios automáticamente
3. El build se ejecutará
4. ¡Listo!

### Opción 2: Deploy Manual
1. Ve a Vercel Dashboard
2. Deployments → Redeploy
3. Espera a que termine el build

## ✨ Ventajas de esta Migración

1. **Un solo deploy**: Todo en Vercel, sin backend separado
2. **Más rápido**: No hay cold starts de Python
3. **Más simple**: Un solo proyecto, un solo lenguaje
4. **Más barato**: No necesitas servidor Python adicional
5. **Mejor debugging**: Logs integrados en Vercel

## 🧪 Testing Local

Para probar localmente:

```bash
cd frontend
npm run dev
```

Luego visita:
- http://localhost:3000/dashboard/brain - Chat con IA
- http://localhost:3000/dashboard/brain/settings - Configuración

## 📝 Notas Importantes

1. El backend Python ya NO se usa para el Cerebro IA
2. Puedes mantener el backend Python solo para ETL/procesamiento batch
3. Todas las rutas `/api/brain/*` ahora son Next.js API Routes
4. La base de datos sigue siendo Supabase (no cambió)

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"
→ Agrega `OPENAI_API_KEY` en Vercel

### Error: "Missing Supabase environment variables"
→ Agrega `SUPABASE_SERVICE_ROLE_KEY` en Vercel

### Error: "Cannot find module '@langchain/...'"
→ Ejecuta `npm install --legacy-peer-deps`

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el deploy se completó exitosamente
