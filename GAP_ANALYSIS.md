# Gap Analysis: Proyecto Actual vs Documento Maestro

**Fecha:** 2026-02-10 (Actualizado - v4 / Post-migracion a Next.js API Routes)
**Comparacion:** Codigo en produccion vs "WebApp Inmobiliaria NLACE - Documento Maestro"

---

## Resumen Ejecutivo

El proyecto esta **en produccion en Vercel** y ha pasado por un cambio arquitectural importante: la logica de IA se movio completamente del backend Python (FastAPI) a **Next.js API Routes** en el frontend. Esto simplifica la infraestructura (todo corre en Vercel) pero tiene implicancias en las herramientas del agente IA que se redujeron de 5 a 2.

**Estado general: ~65% del MVP**

| Seccion del Documento | Completitud | Cambio vs v3 |
|----------------------|-------------|--------------|
| 2. Arquitectura de Datos | **~60%** | = (mismos 3,511 proyectos) |
| 3. Cerebro IA | **~45%** | ↓ Regresion: de 5 tools a 2 tools |
| 4. Outputs y Reporteria | **~55%** | ↑ Reportes generan con datos reales |
| 5. Navegacion y Segmentacion | **~55%** | = |
| 7. Arquitectura Tecnica | **~70%** | ↑ Todo unificado en Vercel |
| 8. Roadmap Fase 1 MVP | **~60%** | Mixto (mejoras + regresiones) |

---

## Cambio Arquitectural Principal

### Antes: Frontend → Backend Python (FastAPI) → OpenAI + Supabase
### Ahora: Frontend → Next.js API Routes → OpenAI + Supabase

| Aspecto | Antes (FastAPI) | Ahora (Next.js API Routes) |
|---------|----------------|--------------------------|
| Chat IA | `/brain/ask` (Python) | `/api/brain/chat` (TypeScript) |
| Reportes | `/brain/reports/*` (Python) | `/api/brain/reports/*` (TypeScript) |
| Admin | `/brain/admin/*` (Python) | `/api/brain/admin/*` (TypeScript) |
| Agente | LangChain (Python) con 5 tools | OpenAI SDK (TypeScript) con 2 tools |
| Modelo | GPT-4 Turbo | GPT-4o-mini |
| RAG | pgvector + similarity_search | **NO FUNCIONAL** (embeddings = null) |
| Backend | Core de la app | **Codigo muerto** (existe pero no se usa) |
| Deploy | Vercel (FE) + Railway/Render (BE) | **Solo Vercel** (todo unificado) |

---

## 1. ARQUITECTURA DE DATOS (Seccion 2) - ~60%

### Base de Datos en Produccion

| Tabla | Registros | Estado |
|-------|-----------|--------|
| `projects` | 3,511 | Datos reales TINSA (50 columnas) |
| `project_typologies` | 325 | **Incompleto** (deberian ser ~10,000+) |
| `generated_reports` | 17 | Reportes generados con IA |
| `knowledge_docs` | 12 | Base de conocimiento RAG |
| `system_prompts` | 1 | Prompt activo |

### Pipeline ETL

| Requisito | Estado |
|-----------|--------|
| Datos TINSA cargados | **SI** - 3,511 proyectos |
| Geocoding ejecutado | **SI** - 1,686 en cache |
| Tipologias completas | **NO** - Solo 325 para 3,511 proyectos |
| Actualizacion periodica | **NO** - Import manual unico |
| CBR, INE, Portales | **NO** - Fase 2/3 |

### Pendiente critico: Importar CSV Norte/Sur + RM
Los 2 archivos TINSA (35MB + 100MB) aun no se han importado. El importador `tinsa_importer.py` esta listo pero requiere ejecucion local.

---

## 2. CEREBRO IA (Seccion 3) - ~45%

### REGRESION: De 5 tools a 2 tools

La migracion de Python a TypeScript perdio 3 herramientas:

| Tool | Doc. Maestro | FastAPI (v3) | Next.js (v4 actual) |
|------|-------------|-------------|---------------------|
| `search_projects` | SI | SI | **SI** |
| `get_market_stats` | SI | SI | **SI** |
| `compare_regions` | SI | SI | **NO - PERDIDA** |
| `top_sales` | SI | SI | **NO - PERDIDA** |
| `market_summary` | SI | SI | **NO - PERDIDA** |

### RAG: NO FUNCIONAL

| Componente | Estado |
|-----------|--------|
| `vector-store.ts` | Existe pero **embeddings = null** al ingestar |
| `searchKnowledge()` | Usa `textSearch()` en vez de pgvector similarity |
| Knowledge docs | 12 docs en BD pero **sin embeddings** |
| `match_documents()` | Funcion SQL existe pero no se llama |

**Resultado:** El agente IA no tiene acceso a contexto historico (regulaciones, hitos, macro). Las respuestas se basan solo en los datos de la tabla `projects`.

### Lo que SI funciona

| Feature | Estado |
|---------|--------|
| Chat con OpenAI (GPT-4o-mini) | **SI** - Respuestas en tiempo real |
| Tool calling (2 herramientas) | **SI** - Busqueda y estadisticas |
| System prompt configurable desde admin | **SI** |
| CRUD Knowledge Base (UI) | **SI** - Pero sin embeddings reales |
| Markdown rendering en respuestas | **SI** |
| Widget de chat flotante | **SI** - AIChatWidget.tsx |

---

## 3. OUTPUTS Y REPORTERIA (Seccion 4) - ~55%

### Generacion de Reportes: FUNCIONAL CON DATOS REALES

| Tipo de Reporte | Estado | Datos |
|----------------|--------|-------|
| Contexto de Mercado por Comuna | **SI** | Proyectos reales de Supabase |
| Benchmark de Proyecto | **SI** | Comparativa real |
| Area por Poligono | **SI** | PostGIS `get_projects_in_polygon()` |

### Contenido del Reporte (estructura real)

| Seccion | Estado |
|---------|--------|
| `kpi_grid` (5 KPIs) | **SI** - proyectos, precio, velocidad, stock, MAO |
| `analysis_text` (IA) | **SI** - GPT-4o-mini genera analisis |
| `chart_bar` (stock por estado) | **SI** - Recharts BarChart |
| `chart_scatter` (precio vs velocidad) | **SI** - Recharts ScatterChart |
| `project_table` (top 20) | **SI** - Tabla de proyectos |

### Exportacion

| Formato | Estado |
|---------|--------|
| CSV | **SI** |
| PDF (print) | **SI** |
| Excel (.xlsx) | **NO** |
| PPT | **NO** |

---

## 4. NAVEGACION Y SEGMENTACION (Seccion 5) - ~55%

### Vistas del Sistema

| Vista | Estado |
|-------|--------|
| Dashboard | **SI** - KPIs + mapa + chart |
| Proyectos (lista) | **SI** - Tabla + filtros + paginacion |
| Proyecto (detalle) | **SI** - Metricas completas |
| Mapa | **SI** - Markers color-coded por sell-through |
| Analista IA | **SI** - Chat + admin (prompts + knowledge) |
| Analytics | **SI** - Charts Recharts reales |
| Reportes (lista) | **SI** - Status + crear nuevo |
| Reporte (detalle) | **SI** - Charts + tabla + IA + export |

### Filtros: 7 de 15

| Filtro | Estado |
|--------|--------|
| Busqueda texto | **SI** |
| Filtro por Comuna | **SI** |
| Filtro por Region | **SI** |
| Ordenamiento | **SI** |
| Paginacion | **SI** |
| Poligono en mapa | **SI** |
| Status proyecto | **SI** (badges) |
| Rango precio UF | **NO** |
| Tipologia (1D-1B) | **NO** |
| Estado obra | **NO** |
| MAO / Absorcion | **NO** |
| Radio desde punto | **NO** |
| Desarrollador | **NO** |
| Periodo | **NO** |
| Superficie m2 | **NO** |

---

## 5. ARQUITECTURA TECNICA (Seccion 7) - ~70%

### Stack en Produccion

| Tecnologia | Estado |
|-----------|--------|
| Supabase (PostgreSQL + PostGIS + pgvector) | **SI** |
| Next.js 16 App Router | **SI** - En Vercel |
| Next.js API Routes (reemplazo de FastAPI) | **SI** |
| Shadcn/UI + Radix | **SI** |
| Recharts | **SI** - 5 tipos de charts |
| Mapbox GL JS | **SI** - Markers + polygon draw |
| TailwindCSS | **SI** |
| TanStack Query | **SI** |
| OpenAI SDK (TypeScript) | **SI** - GPT-4o-mini |
| PostGIS spatial queries | **SI** - RPC functions |
| Vercel (deploy unificado) | **SI** |
| FastAPI backend | **MUERTO** - Existe pero no se usa |

### Seguridad

| Requisito | Estado | Impacto |
|-----------|--------|---------|
| Auth en API routes IA | **NO** | **CRITICO** - OpenAI costos expuestos |
| CORS | **N/A** | API routes son same-origin (mejora vs antes) |
| RLS Supabase | **PARCIAL** | Lectura publica |
| Rate limiting | **NO** | Riesgo de abuso |
| Error details | **EXPUESTOS** | str(e) en 500 responses |

---

## 6. BUGS Y PROBLEMAS

### Resueltos en esta version
- ~~Backend URL hardcodeada~~ → **RESUELTO** - Config usa `/api` (same-origin)
- ~~CORS abierto~~ → **RESUELTO** - API Routes son same-origin, no necesitan CORS
- ~~Logout roto~~ → **RESUELTO** desde v3

### Persisten
1. **API routes sin auth** - `/api/brain/*` publicos (costos OpenAI)
2. **RAG no funcional** - vector-store.ts guarda embeddings como null
3. **Solo 2 tools** en agente (habia 5 en version Python)
4. **Backend Python muerto** - Codigo existe pero no se invoca
5. **Metadata layout** - Sigue diciendo `"Create Next App"`
6. **Brain page KPIs hardcodeados** - Valores falsos
7. **Solo 325 tipologias** para 3,511 proyectos
8. **Knowledge docs sin embeddings** - RAG no puede buscar por similitud
9. **Error details expuestos** en 500 responses
10. **Codigo duplicado** - MarkdownRenderer existe en 2 lugares
11. **default-prompt.txt** no se importa (se usa hardcoded en brain-agent.ts)

---

## 7. COMPLIANCE FASE 1 MVP

| Entregable MVP | Estado | Completitud |
|---------------|--------|-------------|
| Integracion TINSA completa | 3,511 proyectos (faltan CSVs nuevos) | **~70%** |
| Dashboard con filtros | KPIs + charts + mapa + 7 filtros | **~70%** |
| Generador informe "Contexto de Mercado" | 3 tipos + IA + export CSV/PDF | **~65%** |
| IA basica (explicacion tendencias) | Chat funcional pero sin RAG ni 3 tools | **~45%** |

---

## 8. TRABAJO PENDIENTE (Priorizado)

### CRITICO (seguridad + funcionalidad core)
- [ ] Agregar auth a API routes `/api/brain/*` (verificar session Supabase)
- [ ] Arreglar RAG: generar embeddings reales con OpenAI en vector-store.ts
- [ ] Restaurar 3 tools perdidas (compare_regions, top_sales, market_summary)
- [ ] Importar CSVs TINSA (Norte/Sur 35MB + RM 100MB)

### ALTA PRIORIDAD
- [ ] Limpiar backend Python muerto (o decidir si se mantiene)
- [ ] Completar tipologias (325 → deberian ser miles)
- [ ] Expandir knowledge base con contenido real (leyes, macro, hitos)
- [ ] KPIs dinamicos en pagina Brain
- [ ] Actualizar metadata layout a "NLACE Intelligence"

### MEDIA PRIORIDAD
- [ ] Filtros: rango precio, tipologia, estado obra, MAO
- [ ] Eliminar MarkdownRenderer duplicado
- [ ] Importar default-prompt.txt en vez de hardcodear
- [ ] Export Excel (.xlsx)
- [ ] Rate limiting en API routes
- [ ] Streaming responses en chat

---

## 9. CONCLUSIONES

### Estado: ~65% MVP, en produccion, pero con regresiones

**Lo positivo:**
- Toda la app corre en Vercel (infraestructura simplificada)
- Reportes generan con datos reales y IA
- 17 reportes ya generados exitosamente
- Chat funciona con OpenAI tool calling
- 8 paginas completas y funcionales
- Export CSV/PDF funcional

**Lo preocupante:**
- **RAG roto** - El diferenciador clave (explicar contexto historico) no funciona porque los embeddings son null
- **3 tools perdidas** en la migracion Python → TypeScript
- **Sin auth** en API routes que llaman a OpenAI
- **Backend muerto** genera confusion y potencial costo

**Prioridad #1:** Arreglar RAG (embeddings) y restaurar los 3 tools perdidos. Sin esto, el agente IA es un chatbot basico que solo consulta la tabla projects, sin la capacidad de correlacionar con contexto historico que es el diferenciador del producto segun el documento maestro.
