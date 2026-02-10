# Configuración de Tablas para el Cerebro IA

## 🎯 Problema Actual

El Cerebro IA muestra errores porque las tablas de Supabase no existen todavía.

## ✅ Solución: Ejecutar el Script SQL

### Paso 1: Ir al SQL Editor de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **SQL Editor** en el menú lateral izquierdo
3. Click en **New Query**

### Paso 2: Copiar y Ejecutar el SQL

1. Abre el archivo: `supabase/migrations/create_ai_brain_tables.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Click en **Run** (o presiona Cmd/Ctrl + Enter)

### Paso 3: Verificar que se Crearon las Tablas

1. En Supabase, ve a **Table Editor**
2. Deberías ver 2 nuevas tablas:
   - ✅ `system_prompts` (con 1 fila - el prompt por defecto)
   - ✅ `knowledge_docs` (vacía por ahora)

## 🚀 Después de Crear las Tablas

1. **Espera a que termine el deploy en Vercel** (el último commit que hice)
2. **Recarga la página** del Cerebro IA en tu navegador
3. **Deberías ver**:
   - ✅ System Prompt cargado correctamente
   - ✅ Base de Conocimientos vacía (sin errores)
   - ✅ Chat funcionando

## 🔧 Alternativa: Usar Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

```bash
cd /Users/cristianlabarca/REPOS/mercado-Inmobiliario
supabase db push
```

Esto aplicará automáticamente la migración.

## ❓ Si Sigue Sin Funcionar

Si después de crear las tablas sigue habiendo errores:

1. Verifica que las tablas se crearon correctamente en Supabase
2. Verifica que el deploy de Vercel terminó exitosamente
3. Abre la consola del navegador (F12) y comparte los errores que veas
4. Revisa los logs de Vercel para ver si hay errores del servidor

## 📝 Nota Importante

La extensión **pgvector** debe estar habilitada en Supabase para que funcione la búsqueda semántica. Si no está habilitada:

1. Ve a **Database** → **Extensions** en Supabase
2. Busca `vector` o `pgvector`
3. Click en **Enable**
