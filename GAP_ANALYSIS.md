# Gap Analysis: Proyecto Actual vs Documento Maestro

**Fecha:** 2026-02-10 (Actualizado - v3 / Post-produccion)
**Comparacion:** Codigo actual vs "WebApp Inmobiliaria NLACE - Documento Maestro"

---

## Resumen Ejecutivo

El proyecto ha avanzado drasticamente. Esta **en produccion en Vercel** con datos reales de TINSA (3,511 proyectos), un agente IA con 5 herramientas funcionales, sistema de reportes con generacion IA, charts reales con Recharts, y geocoding. La estimacion de completitud del MVP pasa de ~30% a **~65%**.

**Estado general por seccion del documento:**

| Seccion | v2 anterior | v3 actual | Completitud |
|---------|------------|-----------|-------------|
| 2. Arquitectura de Datos | ~25% | Datos TINSA cargados | **~60%** |
| 3. Cerebro IA | ~20% | Agente con 5 tools + RAG | **~55%** |
| 4. Outputs y Reporteria | ~10% | Generador con IA + charts | **~50%** |
| 5. Navegacion y Segmentacion | ~25% | Filtros, detalle, polygon | **~55%** |
| 7. Arquitectura Tecnica | ~35% | Deploy Vercel, Recharts | **~70%** |
| 8. Roadmap Fase 1 MVP | ~25% | Avance significativo | **~65%** |

---

## Cambios desde v2 (+8,967 lineas, 68 archivos)

### Backend - Nuevos

| Archivo | Descripcion | Estado |
|---------|-------------|--------|
| `brain/agent.py` | Agente LangChain con GPT-4 Turbo y function calling | **FUNCIONAL** |
| `brain/tools.py` | 5 tools reales: search_projects, get_stats, compare_regions, top_sales, market_summary | **FUNCIONAL** |
| `brain/reports_router.py` | Generacion de reportes con IA, 3 tipos (comuna, benchmark, polygon) | **FUNCIONAL** |
| `etl/import_tinsa.py` | ETL completo TINSA → Supabase con transformacion y dedup | **EJECUTADO** (3,511 proyectos) |
| `etl/geocode_projects.py` | Geocoding con Nominatim + Google fallback + cache | **FUNCIONAL** |
| `utils/cache.py` | Cache in-memory con TTL para stats y projects | **FUNCIONAL** |

### Frontend - Nuevos

| Archivo | Descripcion | Estado |
|---------|-------------|--------|
| `projects/[id]/page.tsx` | Vista detalle de proyecto individual | **FUNCIONAL** |
| `reports/page.tsx` | Listado de reportes generados | **FUNCIONAL** |
| `reports/[id]/page.tsx` | Vista de reporte individual | **FUNCIONAL** |
| `charts/MarketOverviewChart.tsx` | BarChart Recharts (unidades por region) | **FUNCIONAL** |
| `charts/PriceDistributionChart.tsx` | PieChart Recharts (distribucion precios) | **FUNCIONAL** |
| `charts/SalesTrendsChart.tsx` | LineChart Recharts (tendencias) | **FUNCIONAL** |
| `reports/CreateReportDialog.tsx` | Dialog para crear reportes (3 tipos) | **FUNCIONAL** |
| `reports/ReportView.tsx` | Render de reporte con ScatterChart + BarChart + tabla + export CSV/PDF | **FUNCIONAL** |
| `reports/MapAreaSelector.tsx` | Selector de area poligonal en mapa (WKT) | **FUNCIONAL** |
| `components/KPICard.tsx` | Componente reutilizable de KPI | **FUNCIONAL** |
| `actions/auth.ts` | Server action para logout | **FIX APLICADO** |
| `config/index.ts` | Configuracion centralizada de API URLs | **FUNCIONAL** |

### Migraciones SQL nuevas

| Migracion | Descripcion |
|-----------|-------------|
| `optimize_performance.sql` | 9 indices nuevos + full-text search (pg_trgm) |
| `enable_vector_store.sql` | Tabla `knowledge_docs` + funcion `match_documents()` + indice IVFFlat |
| `reporting_engine.sql` | Tabla `generated_reports` con status tracking |
| `reporting_functions.sql` | `get_market_matrix()` + `get_project_benchmark()` |
| `spatial_reports.sql` | `get_projects_in_polygon()` con PostGIS |

### Infraestructura

| Item | Estado |
|------|--------|
| `vercel.json` | Deploy unificado: frontend Next.js + backend FastAPI en un proyecto |
| Produccion | **EN VIVO** en Vercel |

---

## 1. ARQUITECTURA DE DATOS (Seccion 2)

### 1.1 Fuentes de Datos

| Fuente | Requerido | Estado | Completitud |
|--------|-----------|--------|-------------|
| **TINSA** (Prioridad 1) | 47 campos, Nacional | **3,511 proyectos cargados**, ETL ejecutado, geocoding aplicado | **~70%** |
| **CBR** (Prioridad 2) | Ventas reales SII | No existe | Fase 2 |
| **Roles Avaluo** (Prioridad 3) | Tasaciones SII | No existe | Fase 2 |
| **INE** (Prioridad 3) | Segmentacion socioeconomica | No existe | Fase 3 |
| **Perfil Compradores** (Prioridad 4) | RUT, tipo cliente | No existe | Fase 3 |
| **Portales** (Prioridad 4) | Scraping | No existe | Fase 3 |

### 1.2 Base de Datos en Produccion

| Tabla | Registros | Estado |
|-------|-----------|--------|
| `projects` | 3,511 | Datos reales TINSA |
| `project_typologies` | 325 | Parcial (deberian ser mas) |
| `generated_reports` | 10 | Reportes generados con IA |
| `knowledge_docs` | 11 | Base de conocimiento RAG |
| `system_prompts` | Existe | Prompts configurables |
| `profiles` | Existe | Auth de usuarios |

### 1.3 Pipeline ETL

| Requisito | Estado |
|-----------|--------|
| Extraccion CSV TINSA | **COMPLETADO** - import_tinsa.py ejecutado |
| Geocoding | **COMPLETADO** - geocode_projects.py con cache (1,686 entradas) |
| Limpieza y normalizacion | **COMPLETADO** - Manejo numeros chilenos, coordenadas |
| Carga batch a Supabase | **COMPLETADO** - 3,511 proyectos insertados |
| Celery jobs scheduling | **NO** |
| Actualizacion automatica | **NO** - Import manual |

---

## 2. CEREBRO IA (Seccion 3)

### 2.1 Agente con Tools

| Requisito | Estado |
|-----------|--------|
| Agente LangChain con function calling | **SI** - `create_openai_functions_agent()` con GPT-4 Turbo |
| `tool_consultar_sql` | **SI** - `search_projects()` con filtros dinamicos (comuna, region, precio, tipo) |
| `tool_consultar_historia` (RAG) | **SI** - `match_documents()` con pgvector + threshold |
| `tool_calcular_estadisticas` | **SI** - `get_project_stats()` con sell-through, promedios, agregados |
| Comparacion regiones | **SI** - `compare_regions()` con metricas cruzadas |
| Top proyectos | **SI** - `get_top_projects_by_sales()` ordenado por velocidad |
| Resumen de mercado | **SI** - `get_market_summary()` panorama ejecutivo |
| System prompt dinamico | **SI** - Cargado desde BD con versionamiento |
| Streaming responses | **NO** |
| Multi-LLM (Claude + Google) | **NO** - Solo GPT-4 Turbo |

### 2.2 Knowledge Base (RAG)

| Contenido | Estado |
|-----------|--------|
| Documentos indexados | 11 documentos vectorizados |
| Funcion match_documents() | **SI** - Busqueda semantica con pgvector |
| Indice IVFFlat | **SI** - Optimizado para cosine similarity |
| Marco regulatorio completo | **PARCIAL** - Falta expandir significativamente |
| Base macroeconomica | **NO** |
| Papers y estudios | **NO** |

### 2.3 Admin del Cerebro

| Feature | Estado |
|---------|--------|
| CRUD System Prompts | **SI** |
| CRUD Knowledge Base | **SI** - Agregar texto, CSV, Excel, Word, Markdown |
| Versionamiento prompts | **SI** |
| Upload de archivos | **SI** - Procesamiento multi-formato |

---

## 3. OUTPUTS Y REPORTERIA (Seccion 4)

### 3.1 Tipos de Informes

| Informe | Estado |
|---------|--------|
| Contexto de Mercado por Comuna | **SI** - `COMMUNE_MARKET` con IA |
| Benchmark de Proyecto | **SI** - `PROJECT_BENCHMARK` con comparativa |
| Area por Poligono | **SI** - `AREA_POLYGON` con seleccion en mapa |
| Dashboard Ejecutivo | **SI** - KPIs reales + charts + mapa |

### 3.2 Elementos Visuales

| Elemento | v2 anterior | v3 actual |
|----------|------------|-----------|
| Graficos de barras | Placeholder gris | **SI** - Recharts BarChart (mercado, stock por developer) |
| Graficos de linea | No | **SI** - Recharts LineChart (tendencias ventas) |
| Graficos torta | No | **SI** - Recharts PieChart (distribucion precios) |
| Graficos scatter | No | **SI** - Recharts ScatterChart (precio vs velocidad) |
| Mapas georreferenciados | SI basico | **MEJORADO** - Markers por color segun sell-through, popups, highlight |
| Tablas comparativas | Basica | **MEJORADO** - Paginacion, filtros, progress bars, badges |
| KPI Cards | 4 basicos | **MEJORADO** - Componente reutilizable, formatos (UF, %, numero) |
| Selector poligono mapa | No | **SI** - MapAreaSelector con WKT |

### 3.3 Exportacion

| Formato | Estado |
|---------|--------|
| CSV | **SI** - Export desde ReportView |
| PDF | **SI** - Via window.print() con estilos |
| Excel (.xlsx) | **NO** |
| PPT | **NO** |

---

## 4. NAVEGACION Y SEGMENTACION (Seccion 5)

### 4.1 Vistas del Sistema

| Vista | Estado |
|-------|--------|
| Dashboard | **SI** - KPIs + mapa + chart overview |
| Mapa | **SI** - Pagina dedicada con markers color-coded |
| Proyectos (lista) | **SI** - Tabla con filtros, busqueda, paginacion |
| Proyecto (detalle) | **SI** - Vista individual con todas las metricas |
| Analista IA | **SI** - Chat con agente + admin settings |
| Analytics | **SI** - Charts Recharts con datos reales |
| Reportes (lista) | **SI** - Status badges, crear nuevo |
| Reporte (detalle) | **SI** - Charts + tabla + IA + export |

### 4.2 Filtros Implementados

| Filtro | Estado |
|--------|--------|
| Busqueda texto | **SI** - nombre, developer, comuna |
| Filtro por Comuna | **SI** |
| Filtro por Region | **SI** |
| Ordenar por campo | **SI** - nombre, precio, velocidad, disponibilidad |
| Paginacion | **SI** - 50 items/pagina |
| Poligono en mapa | **SI** - MapAreaSelector para reportes |
| Rango precio UF | **NO** |
| Tipologia (1D-1B) | **NO** |
| Estado obra | **NO** |
| MAO / Absorcion | **NO** |
| Radio desde punto | **NO** |

**Resultado: 7 de 15 filtros implementados.**

---

## 5. ARQUITECTURA TECNICA (Seccion 7)

### 5.1 Stack

| Tecnologia | Estado |
|-----------|--------|
| Supabase (PostgreSQL + PostGIS + Auth + RLS) | **SI** - En produccion |
| Next.js App Router | **SI** - v16 desplegado en Vercel |
| Shadcn/UI | **SI** - Extendido (dialog, toast, tabs, select) |
| Recharts (reemplazo de Tremor) | **SI** - 5 tipos de charts |
| Mapbox GL JS | **SI** - Con markers, popups, polygon draw |
| TailwindCSS | **SI** |
| TanStack Query | **SI** - Usado en admin components |
| FastAPI | **SI** - Desplegado en Vercel via @vercel/python |
| LangChain Agent | **SI** - Con 5 tools y function calling |
| pgvector RAG | **SI** - match_documents() + IVFFlat index |
| Vercel deployment | **SI** - Frontend + Backend unificados |

### 5.2 Seguridad

| Requisito | Estado |
|-----------|--------|
| Auth en endpoints Brain | **NO** - Endpoints publicos |
| CORS | **ABIERTO** - `allow_origins=["*"]` |
| RLS por region/plan | **PARCIAL** - Lectura publica, reports para todos |
| Rate limiting | **NO** |

---

## 6. BUGS Y PROBLEMAS

### Resueltos desde v2
- ~~Logout roto~~ → **RESUELTO** - Server action `signOut()` en `actions/auth.ts`
- ~~Paginas 404 (projects, map)~~ → **RESUELTO**
- ~~Chart placeholders~~ → **RESUELTO** - Recharts reales
- ~~Dashboard sin datos~~ → **RESUELTO** - 3,511 proyectos reales
- ~~Brain sin tools~~ → **RESUELTO** - 5 herramientas funcionales
- ~~Zero reporteria~~ → **RESUELTO** - 3 tipos de reportes con IA

### Persisten
1. **Brain endpoints sin auth** - `/brain/ask` y `/brain/admin/*` publicos (costos OpenAI)
2. **Backend URL fallback a localhost** - `config/index.ts` usa `localhost:8000` si falta env var
3. **CORS abierto** - `allow_origins=["*"]` en produccion
4. **Error details expuestos** - `str(e)` en HTTP 500 en router.py y admin_router.py
5. **Metadata layout** - Sigue diciendo `"Create Next App"`
6. **Brain page KPIs hardcodeados** - "128 documentos" y "94% precision" (deberian ser dinamicos)
7. **knowledge_docs** - Solo 11 documentos (deberian ser muchos mas para RAG efectivo)
8. **Typologies escasas** - Solo 325 vs 3,511 proyectos (deberia haber multiples por proyecto)

---

## 7. COMPLIANCE FASE 1 MVP

| Entregable MVP | Estado | Completitud |
|---------------|--------|-------------|
| Integracion TINSA completa | 3,511 proyectos cargados + geocoding | **~75%** |
| Dashboard basico con filtros geograficos | KPIs + charts + mapa + filtros | **~70%** |
| Generador informe "Contexto de Mercado" | 3 tipos de reportes con IA + charts + export | **~60%** |
| IA basica (explicacion tendencias) | Agente con 5 tools + RAG | **~65%** |

---

## 8. TRABAJO PENDIENTE (Priorizado)

### Alta prioridad (seguridad/produccion)
- [ ] Agregar auth JWT a endpoints `/brain/*` y `/brain/admin/*`
- [ ] Configurar CORS con dominios especificos (no `*`)
- [ ] Asegurar `NEXT_PUBLIC_API_URL` en Vercel (quitar fallback localhost)
- [ ] No exponer `str(e)` en errores HTTP

### Media prioridad (funcionalidad)
- [ ] Expandir knowledge base (regulaciones, macro, hitos historicos)
- [ ] Filtros faltantes: rango precio, tipologia, estado obra, MAO
- [ ] Corregir typologies (325 es muy poco para 3,511 proyectos)
- [ ] Streaming responses en el chat IA
- [ ] KPIs dinamicos en pagina Brain (contar docs reales)
- [ ] Actualizar metadata del layout ("NLACE Intelligence")

### Baja prioridad (mejoras)
- [ ] Export Excel (.xlsx)
- [ ] Rate limiting
- [ ] Cache thread-safe
- [ ] Mas contenido RAG (papers CChC, datos BCCh, leyes)
- [ ] Mapa de calor de precios
- [ ] Comparador de proyectos lado a lado

---

## 9. CONCLUSIONES

### Progreso: de ~30% a ~65% del MVP

El salto es enorme. El proyecto paso de ser un esqueleto con placeholders a una **aplicacion funcional en produccion** con:

- **3,511 proyectos reales** de TINSA cargados y geocodificados
- **Agente IA con 5 herramientas** que consulta datos reales (no query hardcodeada)
- **3 tipos de reportes** generados por IA con charts y export CSV/PDF
- **5 tipos de charts reales** (Recharts: bar, line, pie, scatter, stacked)
- **Deploy en Vercel** con frontend + backend unificados
- **Logout funcionando**, auth middleware, pages completas

### Lo que falta para MVP completo:
1. **Seguridad** - Auth en API del Brain (prioridad critica)
2. **Contenido RAG** - Solo 11 docs, necesita regulaciones, macro, hitos
3. **Filtros avanzados** - Rango precio, tipologia, estado obra
4. **Typologies completas** - Importar todas las tipologias de TINSA (no solo 325)
