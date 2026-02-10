# 🔧 Correcciones de Configuración - Resumen

## ✅ Problemas Resueltos

### 1. **Backend URL Hardcodeada** ✅

**Problema:**
- URLs del backend (`http://localhost:8000`) estaban hardcodeadas en múltiples componentes
- Dificulta el deployment a producción
- No permite configuración por entorno

**Solución:**
- ✅ Creado archivo de configuración centralizado: `src/config/index.ts`
- ✅ Variable de entorno: `NEXT_PUBLIC_API_URL`
- ✅ Actualizado `.env.local` con la variable
- ✅ Todos los componentes ahora usan `endpoints` del config

**Archivos Modificados:**
1. `src/config/index.ts` (nuevo)
2. `src/components/BrainChat.tsx`
3. `src/components/brain/SystemPromptEditor.tsx`
4. `src/components/brain/KnowledgeBaseManager.tsx`
5. `.env.local`

**Uso:**
```typescript
import { endpoints } from '@/config'

// Antes
axios.post('http://localhost:8000/brain/ask', data)

// Después
axios.post(endpoints.brain.ask, data)
```

---

### 2. **Logout Roto** ✅

**Problema:**
- El logout usaba un form HTML con action `/auth/signout`
- La ruta no existía
- El usuario no podía cerrar sesión

**Solución:**
- ✅ Creada server action: `src/app/actions/auth.ts`
- ✅ Función `signOut()` que usa Supabase auth
- ✅ Actualizado layout del dashboard para usar la action
- ✅ Redirect automático a `/login` después del logout

**Archivos Modificados:**
1. `src/app/actions/auth.ts` (nuevo)
2. `src/app/dashboard/layout.tsx`

**Código de la Server Action:**
```typescript
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

---

## 📁 Estructura de Configuración

### **`src/config/index.ts`**

```typescript
export const config = {
  // Backend API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // App settings
  app: {
    name: 'Mercado Inmobiliario',
    version: '1.0.0',
  },
}

// API endpoints
export const endpoints = {
  brain: {
    ask: `${config.apiUrl}/brain/ask`,
    health: `${config.apiUrl}/brain/health`,
    admin: {
      prompts: `${config.apiUrl}/brain/admin/prompts`,
      knowledge: `${config.apiUrl}/brain/admin/knowledge`,
    },
  },
}
```

---

## 🌍 Variables de Entorno

### **`.env.local`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dbnkdfedcsxtwtzrrfld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_AYP2dBJrhpmvAIFvIXiKpg_iOHJMA_L

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibmxhY2UiLCJhIjoiY200aGU5aGhiMDNhaTJucHppa3RxZG43aiJ9.CqvLmLt7Ks88z3iovw7joA

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Para Producción**

Crear `.env.production`:

```bash
# Backend API (Production)
NEXT_PUBLIC_API_URL=https://api.mercado-inmobiliario.com

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
```

---

## 🧪 Testing

### **Probar Logout:**

1. Ir a `/dashboard`
2. Click en el avatar del usuario (esquina superior derecha)
3. Click en "Cerrar Sesión"
4. Verificar que redirige a `/login`
5. Verificar que no se puede acceder a `/dashboard` sin login

### **Probar Backend URL:**

1. Cambiar `NEXT_PUBLIC_API_URL` en `.env.local`
2. Reiniciar el servidor de Next.js
3. Verificar que el Analista IA funciona
4. Verificar que el admin panel funciona

```bash
# Cambiar URL
echo "NEXT_PUBLIC_API_URL=http://localhost:9000" >> .env.local

# Reiniciar
npm run dev
```

---

## 📋 Checklist de Validación

- [x] Config centralizado creado
- [x] Variable de entorno agregada
- [x] Todos los componentes actualizados
- [x] Server action de logout creada
- [x] Layout actualizado
- [x] Logout funciona correctamente
- [x] No hay URLs hardcodeadas
- [x] TypeScript sin errores
- [ ] Probado en producción

---

## 🚀 Deployment

### **Vercel/Netlify**

1. Agregar variables de entorno en el dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_MAPBOX_TOKEN=...
   ```

2. Deploy:
   ```bash
   git push origin main
   ```

### **Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build con variables de entorno
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAPBOX_TOKEN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🐛 Troubleshooting

### **Error: "Cannot find module '@/config'"**

**Solución:**
1. Verificar que el archivo existe en `src/config/index.ts`
2. Reiniciar el servidor de Next.js
3. Limpiar cache: `rm -rf .next && npm run dev`

### **Logout no funciona**

**Solución:**
1. Verificar que `src/app/actions/auth.ts` existe
2. Verificar que está importado en el layout
3. Revisar la consola del navegador
4. Verificar que Supabase está configurado correctamente

### **Backend no responde**

**Solución:**
1. Verificar que el backend está corriendo: `http://localhost:8000`
2. Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
3. Reiniciar Next.js después de cambiar variables de entorno
4. Revisar CORS en el backend

---

## 📚 Mejores Prácticas

### **Variables de Entorno**

✅ **DO:**
- Usar `NEXT_PUBLIC_` para variables expuestas al cliente
- Centralizar configuración en un archivo
- Documentar todas las variables necesarias
- Usar valores por defecto razonables

❌ **DON'T:**
- Hardcodear URLs o secrets
- Exponer secrets del servidor con `NEXT_PUBLIC_`
- Commitear archivos `.env.local`

### **Server Actions**

✅ **DO:**
- Usar `'use server'` al inicio del archivo
- Validar inputs
- Manejar errores apropiadamente
- Usar redirect después de mutaciones

❌ **DON'T:**
- Exponer lógica sensible
- Olvidar validación
- Retornar datos sensibles

---

**Última actualización**: 2026-02-10
**Versión**: 1.0
