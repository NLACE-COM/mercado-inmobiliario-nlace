# Gap Analysis: Proyecto Actual vs Documento Maestro

**Fecha:** 2026-02-11 (v5 - Revision exhaustiva completa)
**Comparacion:** Codigo en produccion vs "WebApp Inmobiliaria NLACE - Documento Maestro"

---

## Resumen Ejecutivo

El proyecto esta **en produccion en Vercel** con Next.js 16. La logica de IA se ejecuta 100% en Next.js API Routes (TypeScript + OpenAI SDK). El backend Python (FastAPI + LangChain) **existe en el repositorio pero NO se ejecuta en produccion** (vercel.json solo configura `"framework": "nextjs"`).

**Estado general: ~68% del MVP Fase 1**

| Seccion del Documento Maestro | Completitud | Cambio vs v4 | Detalle |
|-------------------------------|-------------|--------------|---------|
| 2. Arquitectura de Datos | **~60%** | = | 3,511 proyectos, tipologias incompletas |
| 3. Cerebro IA | **~40%** | ↓ Nota corregida | 2 tools, RAG roto, sin auth |
| 4. Outputs y Reporteria | **~65%** | ↑ Confirmado funcional | 3 tipos reporte + IA + export |
| 5. Navegacion y Segmentacion | **~75%** | ↑ Revision detallada | 8 paginas completas, 7/15 filtros |
| 7. Arquitectura Tecnica | **~70%** | = | Stack completo en Vercel |
| 8. Roadmap Fase 1 MVP | **~65%** | ↑ Ajustado | Frontend mas avanzado de lo estimado |

---

## Arquitectura Actual en Produccion

```
Usuario → Vercel (Next.js 16) → Supabase Cloud (PostgreSQL + PostGIS + pgvector)
                              → OpenAI API (GPT-4o-mini)
                              → Mapbox GL JS
```

### Que se ejecuta en produccion

| Componente | Tecnologia | Estado |
|-----------|-----------|--------|
| Frontend SSR | Next.js 16 App Router | EN PRODUCCION |
| API Routes IA | Next.js `/api/brain/*` | EN PRODUCCION (sin auth) |
| Base de datos | Supabase Cloud | EN PRODUCCION |
| Mapa | Mapbox GL JS | EN PRODUCCION |
| Auth | Supabase Auth SSR | EN PRODUCCION |
| Backend Python | FastAPI + LangChain | **CODIGO MUERTO** (no se ejecuta) |

### Backend Python: muerto pero valioso

El backend Python en `backend/` tiene una implementacion **mas completa** que la version TypeScript:
- **5 tools** vs 2 en TypeScript (compare_regions, top_sales, market_summary perdidos)
- **RAG funcional** con pgvector + OpenAI embeddings (1536 dim) vs embeddings=null en TS
- **GPT-4 Turbo** vs GPT-4o-mini en TypeScript
- **Cache en memoria** con TTL vs sin cache en TypeScript

Esto significa que la migracion a TypeScript fue una **regresion funcional** del agente IA.

---

## 1. ARQUITECTURA DE DATOS (Seccion 2 del Maestro) - ~60%

### Base de Datos en Produccion

| Tabla | Registros | Estado | Nota |
|-------|-----------|--------|------|
| `projects` | 3,511 | COMPLETA | 55 columnas, datos TINSA reales |
| `project_typologies` | 325 | **INCOMPLETA** | Deberian ser ~10,000+ (2-4 por proyecto) |
| `project_metrics_history` | 0 | **VACIA** | Sin snapshots historicos |
| `market_insights` | 0 | **VACIA** | Sin insights generados |
| `generated_reports` | 17+ | ACTIVA | Reportes IA generados |
| `knowledge_docs` | 12 | **MINIMA** | Sin embeddings reales |
| `system_prompts` | 1 | OK | Prompt activo |
| `profiles` | ~1 | OK | Con trigger auth.users |

### Migraciones SQL (13 archivos)

| Migracion | Contenido | Estado |
|-----------|-----------|--------|
| `initial_schema.sql` | 4 tablas core + RLS + indexes | APLICADA |
| `enable_vector.sql` | pgvector + knowledge_docs + match_documents() | APLICADA |
| `create_profiles.sql` | profiles + is_admin() + trigger | APLICADA |
| `admin_brain.sql` | system_prompts + seed data | APLICADA |
| `add_tinsa_columns.sql` | 24 columnas TINSA adicionales | APLICADA |
| `optimize_performance.sql` | 10+ indexes compuestos + trigram | APLICADA |
| `enable_vector_store.sql` | Recreacion knowledge_docs + IVFFlat index | APLICADA |
| `reporting_engine.sql` | generated_reports + triggers | APLICADA |
| `reporting_functions.sql` | get_market_matrix() + get_project_benchmark() | APLICADA |
| `spatial_reports.sql` | get_projects_in_polygon() PostGIS | APLICADA |
| `get_communes_rpc.sql` | RPC comunas distintas | APLICADA |
| `get_projects_in_polygon_rpc.sql` | RPC busqueda espacial | APLICADA |
| `create_ai_brain_tables.sql` | Duplicado (system_prompts/knowledge_docs) | REDUNDANTE |

### Pipeline ETL

| Herramienta | Estado | Nota |
|-------------|--------|------|
| `import_tinsa.py` | EJECUTADO | Importo 3,511 proyectos |
| `tinsa_importer.py` | DISPONIBLE | Version mejorada con tipologias (no ejecutado) |
| `geocode_projects.py` | EJECUTADO | 1,686 coordenadas en cache |
| `mock_data.py` | DISPONIBLE | Generador de datos de prueba |
| `csv_to_supabase.py` | TEMPLATE | Importador generico |
| `bigquery_to_supabase.py` | NO USADO | Requiere credenciales GCP |

### Fuentes de datos segun Documento Maestro

| Fuente | Estado |
|--------|--------|
| TINSA (proyectos inmobiliarios) | **SI** - 3,511 proyectos |
| CBR (Conservador Bienes Raices) | **NO** - Fase 2 |
| INE (indicadores macro) | **NO** - Fase 2 |
| Portales inmobiliarios | **NO** - Fase 3 |
| SII (avaluos fiscales) | **NO** - Fase 3 |

---

## 2. CEREBRO IA (Seccion 3 del Maestro) - ~40%

### Herramientas del Agente

| Tool | Doc. Maestro | Python (existe) | TypeScript (produccion) |
|------|-------------|-----------------|------------------------|
| `search_projects` | SI | SI | **SI** - Busqueda por comuna/precio |
| `get_market_stats` | SI | SI | **SI** - Stats agregadas |
| `compare_regions` | SI | SI | **NO** - PERDIDA en migracion |
| `top_sales` | SI | SI | **NO** - PERDIDA en migracion |
| `market_summary` | SI | SI | **NO** - PERDIDA en migracion |

**En produccion: 2 de 5 tools (40%)**

### RAG (Retrieval Augmented Generation)

| Componente | Estado en Produccion |
|-----------|---------------------|
| Tabla `knowledge_docs` | Existe con 12 documentos |
| Campo `embedding` (vector 1536) | **NULL en todos los registros** |
| Funcion `match_documents()` SQL | Existe pero **nunca se llama** |
| `searchKnowledge()` en vector-store.ts | Usa `textSearch()` (no pgvector) |
| Integracion en brain-agent.ts | **NO EXISTE** - queryBrainWithRAG no usa RAG |

**Resultado:** El nombre `queryBrainWithRAG` es engañoso. El agente NO consulta la knowledge base. No hay contexto historico en las respuestas IA. Esto es un **gap critico** vs el Documento Maestro que define RAG como diferenciador del producto.

### Lo que SI funciona del Cerebro IA

| Feature | Estado | Detalles |
|---------|--------|----------|
| Chat con OpenAI | **SI** | GPT-4o-mini, respuestas en español |
| Tool calling (2 tools) | **SI** | get_market_stats + search_projects |
| Datos reales en respuestas | **SI** | Consulta tabla projects via Supabase |
| System prompt configurable | **SI** | CRUD desde admin + fallback hardcoded |
| CRUD Knowledge Base (UI) | **SI** | Pero docs se guardan sin embeddings |
| Widget chat flotante | **SI** | AIChatWidget.tsx en todas las paginas |
| Chat dedicado | **SI** | BrainChat.tsx con historial |
| Markdown en respuestas | **SI** | Basico (bold, listas, headers) |

---

## 3. OUTPUTS Y REPORTERIA (Seccion 4 del Maestro) - ~65%

### Generacion de Reportes

| Tipo de Reporte | Funciona | Datos | IA |
|----------------|----------|-------|-----|
| Contexto de Mercado por Comuna | **SI** | Proyectos reales via ilike | GPT-4o-mini |
| Area por Poligono | **SI** | PostGIS `get_projects_in_polygon()` | GPT-4o-mini |
| Benchmark de Proyecto | **SI** | `get_project_benchmark()` RPC | GPT-4o-mini |

### Secciones del Reporte (estructura real generada)

| Seccion | Implementada | Tipo |
|---------|-------------|------|
| KPI Grid (6 metricas) | **SI** | total_projects, avg_price, avg_price_m2, total_stock, avg_sales_speed, avg_mao |
| Analisis texto IA | **SI** | 3 parrafos GPT-4o-mini con datos reales |
| Chart bar (estado de obra) | **SI** | Recharts BarChart |
| Chart scatter (precio vs velocidad) | **SI** | Recharts ScatterChart |
| Tabla proyectos (top 20) | **SI** | Con nombre, developer, stock, precio, MAO |

### Exportacion

| Formato | Estado | Nota |
|---------|--------|------|
| CSV | **SI** | Export desde tabla proyectos |
| PDF (impresion) | **SI** | Print CSS + window.print() |
| Excel (.xlsx) | **NO** | No implementado |
| PowerPoint | **NO** | No implementado |

### Auto-refresh mientras genera

- **SI** - Polling cada 3 segundos mientras status='generating'

---

## 4. NAVEGACION Y SEGMENTACION (Seccion 5 del Maestro) - ~75%

### Paginas del Sistema

| Pagina | Ruta | Datos | Completitud |
|--------|------|-------|-------------|
| Landing | `/` | Estatica | 60% - Hero + features + CTA |
| Login | `/login` | Real (Supabase Auth) | 70% - Login + signup, falta reset password |
| Dashboard | `/dashboard` | Real (3,511 proyectos) | 85% - 4 KPIs + mapa + chart regiones |
| Proyectos (lista) | `/dashboard/projects` | Real + filtros + paginacion | 90% - Tabla + busqueda + filtro region |
| Proyecto (detalle) | `/dashboard/projects/[id]` | Real (50+ campos) | 95% - Metricas completas |
| Mapa | `/dashboard/map` | Real (coordenadas) | 85% - Markers color-coded por sell-through |
| Analista IA | `/dashboard/brain` | Redirect a settings | 50% - Solo redirect |
| Brain Admin | `/dashboard/brain/settings` | Real | 70% - Prompts + Knowledge Base |
| Analytics | `/dashboard/analytics` | Real (client-side) | 90% - KPIs + charts + tabla regiones |
| Reportes (lista) | `/dashboard/reports` | Real | 75% - Status + crear nuevo |
| Reporte (detalle) | `/dashboard/reports/[id]` | Real (IA generada) | 85% - Charts + tabla + export |

**Total: 11 rutas, todas con datos reales excepto landing**

### Filtros Implementados: 7 de 15

| Filtro | Estado | Ubicacion |
|--------|--------|-----------|
| Busqueda por texto | **SI** | Proyectos, tabla |
| Filtro por comuna | **SI** | Proyectos, reportes |
| Filtro por region | **SI** | Proyectos, analytics |
| Ordenamiento (velocidad venta) | **SI** | Dashboard, tablas |
| Paginacion (50/pagina) | **SI** | Proyectos |
| Poligono en mapa | **SI** | Reportes (Mapbox Draw) |
| Status proyecto (badges) | **SI** | Tablas, detalle |
| Rango precio UF | **NO** | - |
| Tipologia (1D-1B) | **NO** | - |
| Estado obra | **NO** | - |
| MAO / Absorcion | **NO** | - |
| Radio desde punto | **NO** | - |
| Desarrollador | **NO** | - |
| Periodo temporal | **NO** | - |
| Superficie m2 | **NO** | - |

### Componentes UI Clave

| Componente | Tipo | Estado |
|-----------|------|--------|
| `MapboxMap.tsx` | Mapa interactivo | 90% - Markers + popups + color-coded |
| `ProjectsTable.tsx` | Tabla paginada | 85% - Search + filter + pagination |
| `KPICard.tsx` | Tarjeta metrica | 80% - Formatos: number, UF, % |
| `MarketOverviewChart.tsx` | BarChart regiones | 85% - Recharts, 3 series |
| `PriceDistributionChart.tsx` | PieChart precios | 80% - 6 rangos |
| `SalesTrendsChart.tsx` | LineChart tendencias | 85% - Dual-axis |
| `CreateReportDialog.tsx` | Dialog crear reporte | 75% - 3 tipos + mapa poligono |
| `ReportView.tsx` | Renderizador reportes | 85% - 6 tipos seccion + auto-refresh |
| `AIChatWidget.tsx` | Chat flotante | 85% - Markdown + sources |
| `BrainChat.tsx` | Chat dedicado | 80% - Historial + error handling |
| `MarkdownRenderer.tsx` | Parser MD | 70% - Basico (bold, listas, headers) |

---

## 5. ARQUITECTURA TECNICA (Seccion 7 del Maestro) - ~70%

### Stack Tecnologico

| Tecnologia | Requerido | Implementado |
|-----------|-----------|-------------|
| Next.js App Router | SI | **SI** - v16.1.6 |
| React | SI | **SI** - v19.2.3 |
| Supabase (PostgreSQL) | SI | **SI** - Cloud |
| PostGIS | SI | **SI** - Funciones RPC espaciales |
| pgvector | SI | **PARCIAL** - Tabla existe, embeddings null |
| Shadcn/UI + Radix | SI | **SI** - 15+ componentes |
| TailwindCSS | SI | **SI** - v4 |
| Recharts | SI | **SI** - Bar, Line, Pie, Scatter |
| Mapbox GL JS | SI | **SI** - Markers + Draw |
| TanStack Query | SI | **SI** - QueryProvider |
| OpenAI SDK | SI | **SI** - GPT-4o-mini |
| LangChain | SI | **NO** - Reemplazado por OpenAI SDK directo |
| Vercel | SI | **SI** - Deploy unificado |

### Seguridad

| Requisito | Estado | Severidad |
|-----------|--------|-----------|
| Auth en paginas (middleware) | **SI** | OK - Protege /dashboard/* |
| Auth en API routes IA | **NO** | **CRITICO** - Todos los /api/brain/* publicos |
| Rate limiting API | **NO** | **CRITICO** - Sin limite de llamadas OpenAI |
| RLS Supabase | **PARCIAL** | MEDIO - Lectura publica habilitada |
| CORS | **N/A** | OK - API Routes son same-origin |
| Error details | **EXPUESTOS** | BAJO - error.message en 500 responses |
| Ownership (reportes) | **NO** | ALTO - Cualquiera ve reportes de otros |
| Admin routes | **PUBLICAS** | **CRITICO** - /api/brain/admin/* sin auth |
| Debug endpoint | **PUBLICO** | BAJO - Solo muestra timestamp |

### Deploy

| Aspecto | Estado |
|---------|--------|
| vercel.json | `{ "framework": "nextjs" }` |
| Frontend SSR | Desplegado en Vercel |
| API Routes | Desplegadas como Serverless Functions |
| maxDuration | 60s (requiere Pro plan, Hobby=10s) |
| Backend Python | **NO desplegado** (codigo muerto en repo) |

---

## 6. INVENTARIO DE BUGS Y PROBLEMAS

### CRITICOS (seguridad en produccion)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 1 | **API routes sin auth** | Todos los `/api/brain/*` | Cualquiera puede usar IA, generar reportes, administrar knowledge base. Exposicion de costos OpenAI |
| 2 | **Admin routes publicas** | `/api/brain/admin/*` | Cualquiera puede modificar prompts del sistema y borrar knowledge docs |
| 3 | **Sin rate limiting** | Todos los endpoints IA | DDoS + costos OpenAI ilimitados |
| 4 | **Sin ownership en reportes** | `/api/brain/reports/*` | Un usuario puede ver reportes de otro |

### ALTOS (funcionalidad core rota)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 5 | **RAG no funcional** | `vector-store.ts:27` | `embedding: null` al ingestar. Knowledge base inutil |
| 6 | **3 tools perdidas** | `brain-agent.ts` | Solo 2 de 5 tools implementadas (40%) |
| 7 | **queryBrainWithRAG no usa RAG** | `brain-agent.ts:129` | Nombre engañoso. No llama searchKnowledge() |
| 8 | **Solo 325 tipologias** | DB | 3,511 proyectos deberian tener ~10,000+ tipologias |
| 9 | **project_metrics_history vacia** | DB | Sin datos historicos para trends |
| 10 | **maxDuration=60s en Hobby** | `generate/route.ts:6` | Vercel Hobby plan limita a 10s. Reportes pueden fallar |

### MEDIOS (UX y calidad)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 11 | **Metadata "Create Next App"** | `layout.tsx:16` | Titulo/descripcion genericos en produccion |
| 12 | **Brain page solo redirect** | `brain/page.tsx` | Ruta /dashboard/brain no tiene contenido propio |
| 13 | **Error details expuestos** | `chat/route.ts:46` | `details: error.message` en response 500 |
| 14 | **MarkdownRenderer duplicado** | `shared/` + `ReportView.tsx` | Dos implementaciones diferentes |
| 15 | **fs/path imports muertos** | `admin/prompts/route.ts` | Imports no usados |
| 16 | **CreateReportDialog URL fragil** | `CreateReportDialog.tsx` | Chequea localhost/127.0.0.1 en string |
| 17 | **Sin loading skeletons** | Multiples paginas | No hay feedback visual durante carga |
| 18 | **Boton notificaciones inerte** | `dashboard/layout.tsx` | Campana sin onClick handler |
| 19 | **"Nuevo Proyecto" inerte** | `projects/page.tsx` | Boton sin handler |
| 20 | **Sin navegacion mobile** | `dashboard/layout.tsx` | Sidebar oculto en mobile sin menu hamburger |

### BAJOS (mejoras deseables)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 21 | **Markdown limitado en chat** | `MarkdownRenderer.tsx` | Solo bold, listas, headers. Falta code blocks, links |
| 22 | **Sin sort en tablas** | `ProjectsTable.tsx` | No se puede ordenar por columna |
| 23 | **Sin cluster en mapa** | `MapboxMap.tsx` | Performance con muchos markers |
| 24 | **QueryProvider sin config** | `QueryProvider.tsx` | Sin retry, stale time, error handling custom |
| 25 | **Popup mapa 400px fijo** | `MapboxMap.tsx` | Width hardcoded |
| 26 | **Colores hardcoded** | Charts varios | Sin tema configurable |

---

## 7. COMPLIANCE FASE 1 MVP

El Documento Maestro define 4 entregables para Fase 1 MVP:

### Entregable 1: Integracion TINSA completa - ~70%

| Requisito | Estado |
|-----------|--------|
| Datos TINSA cargados | **SI** - 3,511 proyectos |
| Geocoding | **SI** - Coordenadas en BD |
| Tipologias por proyecto | **PARCIAL** - 325 de ~10,000+ esperados |
| Historico (metrics_history) | **NO** - Tabla vacia |
| Actualizacion periodica | **NO** - Import manual unico |

### Entregable 2: Dashboard con filtros - ~75%

| Requisito | Estado |
|-----------|--------|
| 4 KPIs principales | **SI** - Proyectos, stock, velocidad, ventas |
| Mapa interactivo | **SI** - Mapbox con color-coding |
| Charts de mercado | **SI** - 3 tipos (bar, pie, line) |
| Tabla proyectos con paginacion | **SI** - 50/pagina + search |
| Filtros basicos (comuna, region, texto) | **SI** - 7 implementados |
| Filtros avanzados (precio, tipologia, MAO) | **NO** - 8 filtros pendientes |
| Vista detalle proyecto | **SI** - 50+ campos |
| Vista analytics | **SI** - KPIs + charts + tabla |

### Entregable 3: Generador informe "Contexto de Mercado" - ~70%

| Requisito | Estado |
|-----------|--------|
| Reporte por comuna | **SI** - Con datos reales |
| Reporte por area (poligono) | **SI** - PostGIS |
| Reporte benchmark | **SI** - Comparativa |
| KPIs en reporte | **SI** - 6 metricas |
| Analisis IA narrativo | **SI** - GPT-4o-mini |
| Charts en reporte | **SI** - Bar + Scatter |
| Tabla proyectos en reporte | **SI** - Top 20 |
| Export CSV | **SI** |
| Export PDF (print) | **SI** |
| Export Excel | **NO** |
| Auto-refresh durante generacion | **SI** |

### Entregable 4: IA basica (explicacion tendencias) - ~40%

| Requisito | Estado |
|-----------|--------|
| Chat con agente IA | **SI** - GPT-4o-mini |
| Busqueda de proyectos | **SI** - tool search_projects |
| Estadisticas de mercado | **SI** - tool get_market_stats |
| Comparacion regiones | **NO** - Tool perdida |
| Top ventas | **NO** - Tool perdida |
| Resumen mercado | **NO** - Tool perdida |
| RAG con contexto historico | **NO** - Embeddings null |
| RAG con regulaciones | **NO** - Knowledge base minima |
| Sources en respuestas | **NO** - Siempre array vacio |
| Auth en endpoints | **NO** - Publicos |

---

## 8. TRABAJO PENDIENTE (Priorizado)

### CRITICO - Seguridad (hacer ANTES de seguir desarrollando)

- [ ] **Agregar auth a todos los `/api/brain/*`** - Verificar session Supabase en cada request
- [ ] **Proteger rutas admin** - `/api/brain/admin/*` solo para usuarios con is_admin()
- [ ] **Rate limiting** - Minimo: X requests/minuto por usuario autenticado
- [ ] **Ownership en reportes** - Asociar reportes a user_id, filtrar en queries

### ALTA PRIORIDAD - Funcionalidad core del MVP

- [ ] **Arreglar RAG** - Generar embeddings reales con OpenAI al ingestar en vector-store.ts
- [ ] **Integrar RAG en agente** - queryBrainWithRAG debe llamar searchKnowledge() y pasar contexto
- [ ] **Restaurar 3 tools** - Portar compare_regions, top_sales, market_summary de Python a TypeScript
- [ ] **Completar tipologias** - Re-importar con tinsa_importer.py que extrae tipologias
- [ ] **Importar metricas historicas** - Poblar project_metrics_history
- [ ] **Expandir knowledge base** - Leyes, regulaciones, hitos macro (con embeddings reales)

### MEDIA PRIORIDAD - Completar MVP

- [ ] **8 filtros faltantes** - Precio, tipologia, estado obra, MAO, radio, desarrollador, periodo, m2
- [ ] **Metadata layout** - Cambiar "Create Next App" a "NLACE Intelligence"
- [ ] **Pagina Brain dedicada** - Reemplazar redirect con interfaz de chat completa
- [ ] **Export Excel** - Agregar export .xlsx en reportes
- [ ] **Loading skeletons** - Feedback visual en todas las paginas
- [ ] **Navegacion mobile** - Menu hamburger para sidebar
- [ ] **Limpiar MarkdownRenderer duplicado** - Una sola implementacion
- [ ] **Limpiar backend Python** - Decidir: eliminar o documentar como referencia

### BAJA PRIORIDAD - Polish

- [ ] **Cluster en mapa** - Agrupar markers cercanos para performance
- [ ] **Sort en tablas** - Ordenar por columna al hacer click
- [ ] **QueryProvider config** - Retry, stale time, error boundaries
- [ ] **Validacion env vars** - Verificar MAPBOX_TOKEN, OPENAI_API_KEY al inicio
- [ ] **Markdown mejorado** - Soporte code blocks, links, tables en chat

---

## 9. COMPARATIVA BACKEND PYTHON vs TYPESCRIPT

Esta tabla documenta la regresion para facilitar la restauracion:

| Feature | Python (backend/) | TypeScript (frontend/src/) |
|---------|-------------------|---------------------------|
| Tools | 5 (search, stats, compare, top, summary) | 2 (search, stats) |
| Modelo IA | GPT-4 Turbo | GPT-4o-mini |
| RAG | pgvector + OpenAI embeddings (funcional) | textSearch (no semantico, embeddings null) |
| Cache | In-memory con ~10min TTL | Sin cache |
| Framework | LangChain Agent Executor (5 iterations) | OpenAI SDK directo |
| Agent loop | Automatico (LangChain decide) | Manual (1 ronda de tool calls) |
| Knowledge upload | CSV, Excel, DOCX, TXT | Solo texto plano |
| Report types | commune, polygon, benchmark | commune, polygon, benchmark |
| Report AI | GPT-4 Turbo JSON output | GPT-4o-mini texto libre |
| File processing | Pandas para CSV/Excel | No aplica |

**Recomendacion:** Portar la logica de Python a TypeScript (tools + RAG + cache), no reactivar el backend Python.

---

## 10. CONCLUSIONES

### Estado: ~68% MVP Fase 1, en produccion con riesgos criticos

**Lo positivo (avances reales):**
- 11 rutas funcionales con datos reales de 3,511 proyectos
- Reportes IA generan con datos reales + PostGIS + GPT-4o-mini
- 17+ reportes generados exitosamente
- Chat IA funciona con tool calling (2 tools reales)
- Mapa interactivo con color-coding por sell-through rate
- 5 tipos de charts con Recharts (bar, line, pie, scatter, stacked)
- Auth middleware protege paginas del dashboard
- Deploy unificado en Vercel (infraestructura simplificada)
- Pipeline ETL completo (TINSA + geocoding)
- Schema SQL robusto (13 migraciones, PostGIS, pgvector, RPC functions)

**Lo critico (riesgos en produccion):**
- **Endpoints IA sin auth** = costos OpenAI expuestos a cualquier persona
- **Admin routes publicas** = cualquiera puede alterar el sistema
- **RAG roto** = el diferenciador clave del producto no funciona
- **Solo 2 de 5 tools** = agente IA es un chatbot basico

**Prioridad #1: Seguridad.** Los endpoints sin auth son un riesgo financiero real (costos OpenAI). Esto debe resolverse antes de cualquier otra mejora funcional.

**Prioridad #2: RAG + Tools.** Sin RAG ni las 3 tools perdidas, el "Cerebro IA" es un wrapper de GPT-4o-mini que solo consulta una tabla SQL. El Documento Maestro define la IA como el diferenciador del producto - correlacion de datos con contexto historico, regulaciones, y macro.
