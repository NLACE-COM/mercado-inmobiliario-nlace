# Gap Analysis: Proyecto Actual vs Documento Maestro

**Fecha:** 2026-02-10 (Actualizado - v2)
**Comparacion:** Codigo actual vs "WebApp Inmobiliaria NLACE - Documento Maestro"

---

## Resumen Ejecutivo

El proyecto ha avanzado significativamente respecto a la version anterior. Pasa de ser un esqueleto (~15%) a tener una **estructura funcional con paginas reales** (~30% del MVP). Se agregaron paginas de proyectos, mapa dedicado, cerebro IA con admin, ETL para BigQuery/CSV, TanStack Query, y documentacion de migracion. Sin embargo, los flujos core (ETL real, agente IA con tools, reporteria) siguen sin estar completos.

**Estado general por seccion del documento:**

| Seccion | Estado anterior | Estado actual | Completitud |
|---------|----------------|---------------|-------------|
| 2. Arquitectura de Datos | Parcial ~15% | Mejorado | **~25%** |
| 3. Cerebro IA | Esqueleto ~10% | Admin + prompts configurables | **~20%** |
| 4. Outputs y Reporteria | Placeholder ~5% | Tabla de proyectos | **~10%** |
| 5. Navegacion y Segmentacion | Basica ~15% | Paginas creadas + filtros basicos | **~25%** |
| 7. Arquitectura Tecnica | Estructura ~25% | TanStack Query + BigQuery prep | **~35%** |
| 8. Roadmap Fase 1 MVP | Incompleto ~15% | Avance parcial | **~25%** |

---

## Que cambio desde la version anterior

### Nuevos archivos (+19 archivos, +3100 lineas)

**Frontend (10 nuevos):**
- `dashboard/projects/page.tsx` - Pagina de proyectos con KPIs y tabla
- `dashboard/map/page.tsx` - Pagina dedicada de mapa con stats
- `dashboard/brain/page.tsx` - Pagina dedicada del Cerebro IA
- `dashboard/brain/settings/page.tsx` - Admin del cerebro (prompts + knowledge)
- `components/ProjectsTable.tsx` - Tabla de proyectos con busqueda, filtro comuna, ordenamiento
- `components/brain/SystemPromptEditor.tsx` - Editor de system prompts versionados
- `components/brain/KnowledgeBaseManager.tsx` - CRUD de knowledge base con TanStack Query
- `components/ui/select.tsx`, `tabs.tsx`, `textarea.tsx` - Nuevos UI components
- `providers/QueryProvider.tsx` - TanStack Query provider

**Backend (6 nuevos):**
- `brain/admin_router.py` - API CRUD para system prompts y knowledge base
- `etl/bigquery_to_supabase.py` - Pipeline BigQuery -> Supabase con dry-run
- `etl/csv_to_supabase.py` - Pipeline CSV (export BigQuery) -> Supabase
- `etl/confirm_emails.py` - Utilidad admin para confirmar emails
- `check_db.py`, `check_knowledge.py` - Scripts de verificacion
- `init_prompts.py` - Seed de prompts iniciales

**Docs y Config (3 nuevos):**
- `docs/MIGRATION_GUIDE.md` - Guia completa de migracion BigQuery -> Supabase
- `docs/EXPORT_FROM_BIGQUERY.md` - Guia de exportacion desde BigQuery UI
- `supabase/migrations/20260209000002_admin_brain.sql` - Tabla `system_prompts`
- `backend/credentials/README.md` - Instrucciones para credenciales GCP

### Mejoras en archivos existentes

- **`dashboard/page.tsx`** - Corregidos imports duplicados de iconos SVG (ahora usa lucide-react directamente), fix `createClient()` con `await`
- **`dashboard/layout.tsx`** - Nuevo link "Analista IA" con icono Bot, fix `createClient()` con `await`
- **`BrainChat.tsx`** - Reescrito: mejor estructura de mensajes, muestra fuentes RAG detalladas, mejor UX
- **`brain/router.py`** - Ahora carga system prompt desde BD (`system_prompts` table) o file fallback, con default template
- **`db.py`** - Agregado `load_dotenv` para cargar `.env` automaticamente
- **`main.py`** - Registra `admin_router`
- **`package.json`** - Nuevas deps: `@tanstack/react-query`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `mapbox-gl`, `react-map-gl`
- **`layout.tsx` (root)** - Envuelve app con `QueryProvider`

---

## 1. ARQUITECTURA DE DATOS (Seccion 2)

### 1.1 Fuentes de Datos

| Fuente | Doc. Maestro | Estado Actual | Gap |
|--------|-------------|---------------|-----|
| **TINSA** (Prioridad 1) | 47 campos, Nacional | ETL BigQuery + CSV creados, mapeo ~15 campos, requiere ajuste a campos reales | **EN PROGRESO** - Scripts listos, falta ejecutar con datos reales y completar mapeo 47 campos |
| **CBR** (Prioridad 2) | Ventas reales SII | No existe | Fase 2, OK |
| **Roles Avaluo** (Prioridad 3) | Tasaciones SII | No existe | Fase 2, OK |
| **INE** (Prioridad 3) | Segmentacion socioeconomica | No existe | Fase 3, OK |
| **Perfil Compradores** (Prioridad 4) | RUT, tipo cliente | No existe | Fase 3, OK |
| **Portales** (Prioridad 4) | Scraping | No existe | Fase 3, OK |

**Mejora vs anterior:** Se crearon 2 pipelines ETL (`bigquery_to_supabase.py` y `csv_to_supabase.py`) con dry-run, preview, batch insert, y guias de migracion. Sin embargo, los scripts tienen mapeos con nombres de campo placeholder (`nombre_proyecto`, `comuna`, etc.) que necesitan ajustarse a los nombres reales de la tabla BigQuery.

### 1.2 Modelo de Base de Datos

**Lo que existe:**
- `projects` - Tabla maestra (~25 campos vs 47 requeridos)
- `project_typologies` - Tipologias
- `project_metrics_history` - Series temporales
- `market_insights` - Insights IA
- `knowledge_docs` - Vector store RAG
- `profiles` - Autenticacion
- `system_prompts` - **NUEVO** - Prompts versionados para el Cerebro IA

**Campos faltantes criticos en `projects` (para mapeo completo TINSA):**
- `tinsa_key` / `periodo` (identificacion TINSA por periodo)
- `zona` (nivel geografico intermedio)
- `estacionamientos`, `bodegas`
- `subsidio` (DS1, DS19)
- `descuento_porcentaje`
- `velocidad_proyectada` vs `velocidad_actual`
- `meses_en_venta`
- Campos de estado obra granulado

### 1.3 Pipeline ETL

| Requisito | Estado anterior | Estado actual |
|-----------|----------------|---------------|
| Extraccion Excel/CSV TINSA | Skeleton 3 campos | **csv_to_supabase.py** con ~15 campos, dry-run, batch |
| Extraccion BigQuery | No existia | **bigquery_to_supabase.py** listo (requiere credenciales GCP) |
| Limpieza y normalizacion Pandas | No | **PARCIAL** - Manejo de NaN, encoding multiple |
| Georreferenciacion unificada | Solo mock | **PARCIAL** - Lee lat/long si existen en fuente |
| Validacion de consistencia | No | **BASICA** - Valida name + commune obligatorios |
| Carga batch a Supabase | Basico | **MEJORADO** - Batches de 100 con error handling |
| Celery jobs scheduling | No | **NO** |
| Google Drive API | No | **NO** |
| BigQuery API | No | **SI** - Script listo (requiere `requirements-bigquery.txt`) |

---

## 2. CEREBRO INMOBILIARIO / IA (Seccion 3)

### 2.1 Arquitectura Multi-Agente

| Requisito | Estado anterior | Estado actual |
|-----------|----------------|---------------|
| Agente Analista con tools | No | **NO** - Sigue siendo endpoint simple |
| `tool_consultar_sql` (Text-to-SQL) | No | **NO** - Query sigue hardcodeada (top 5 projects) |
| `tool_consultar_historia` (RAG) | Parcial | **IGUAL** - similarity_search basico |
| `tool_calcular_estadisticas` | No | **NO** |
| System Prompt dinamico | Basico | **MEJORADO** - Prompts versionados en BD con CRUD admin |
| Multi-LLM | No | **NO** |
| Streaming responses | No | **NO** |
| Function calling LLM | No | **NO** |

**Mejora clave:** El system prompt ahora es **configurable desde UI** (admin panel). Se puede crear, versionar, y activar prompts diferentes sin tocar codigo. Esto es un buen avance para iteracion rapida, pero el core del agente (tools, Text-to-SQL, estadisticas) sigue sin implementar.

### 2.2 Admin del Cerebro (NUEVO)

| Feature | Estado |
|---------|--------|
| CRUD System Prompts (API + UI) | **SI** - Crear, listar, activar versiones |
| CRUD Knowledge Base (API + UI) | **SI** - Agregar, listar, eliminar documentos |
| Versionamiento de prompts | **SI** - Multiples versiones, activar una |
| File fallback (sin BD) | **SI** - `system_prompts.json` como fallback |
| UI de admin con Tabs | **SI** - `brain/settings` con SystemPromptEditor + KnowledgeBaseManager |

### 2.3 Knowledge Base (RAG)

| Contenido Requerido | Estado |
|---------------------|--------|
| Marco regulatorio (leyes) | **NO** - Solo 4 chunks genericos de seed |
| Hitos historicos estructurados | **NO** |
| Base macroeconomica (UF, TPM, PIB) | **NO** |
| Informes previos | **NO** |
| Papers y estudios | **NO** |

**Nota:** Ahora existe la UI para agregar documentos al knowledge base manualmente. La infraestructura esta lista, falta poblar con contenido real.

---

## 3. OUTPUTS Y REPORTERIA (Seccion 4)

### 3.1 Tipos de Informes

| Informe | Estado |
|---------|--------|
| Contexto de Mercado | **NO EXISTE** |
| Proyecto Especifico | **NO EXISTE** |
| Oportunidad de Terreno | **NO EXISTE** |
| Dashboard Ejecutivo | **MEJORADO** - KPIs en dashboard, projects, y map pages |

### 3.2 Elementos Visuales

| Elemento Visual | Estado anterior | Estado actual |
|----------------|----------------|---------------|
| Graficos barras/linea/torta | Placeholder gris | **Sigue placeholder** - Tremor no instalado |
| Mapas georreferenciados | SI | **SI** - Ahora con pagina dedicada `/dashboard/map` |
| Tablas comparativas | No | **SI** - `ProjectsTable` con busqueda, filtro, sort |
| Indicadores KPI | 4 basicos | **MEJORADO** - KPIs en 3 paginas (dashboard, projects, map) |
| Mapa de calor precios | No | **NO** |
| Boton Download | No | **UI EXISTE** pero sin funcionalidad |

### 3.3 Exportacion

| Formato | Estado |
|---------|--------|
| PDF | **NO** |
| PPT | **NO** |
| Excel (.xlsx) | **NO** (boton existe pero no funciona) |

---

## 4. NAVEGACION Y SEGMENTACION (Seccion 5)

### 4.1 Vistas del Sistema

| Vista | Estado anterior | Estado actual |
|-------|----------------|---------------|
| Dashboard | 4 KPIs + mapa | **IGUAL** - Chart sigue placeholder |
| Mapa | 404 | **SI** - Pagina dedicada con KPIs + mapa full |
| Proyectos | 404 | **SI** - Tabla con busqueda, filtro comuna, sort |
| Analista IA | En analytics | **SI** - Pagina dedicada + admin settings |
| Comparador | No | **NO** |
| Generador Informes | No | **NO** |

### 4.2 Filtros y Segmentaciones

| Filtro | Estado anterior | Estado actual |
|--------|----------------|---------------|
| Busqueda texto (nombre/comuna) | No | **SI** - En ProjectsTable |
| Filtro por Comuna | No | **SI** - Select en ProjectsTable |
| Ordenar por campo | No | **SI** - nombre, precio, velocidad, disponibilidad |
| Por Region | No | **NO** |
| Radio desde punto | No | **NO** |
| Poligono dibujado | No | **NO** |
| Rango precio UF | No | **NO** |
| Tipologia | No | **NO** |
| Estado obra | No | **NO** |
| Desarrollador | No | **NO** |

**Resultado: 3 de 15 filtros implementados** (busqueda, comuna, ordenamiento).

---

## 5. ARQUITECTURA TECNICA (Seccion 7)

### 5.1 Stack Tecnologico

| Tecnologia | Estado anterior | Estado actual |
|-----------|----------------|---------------|
| Supabase (PostgreSQL + PostGIS + Auth) | SI | **SI** |
| Next.js (App Router, Server Components) | SI | **SI** |
| Shadcn/UI | SI basicos | **SI** - +3 components (select, tabs, textarea) |
| Tremor (charts) | No instalado | **NO INSTALADO** |
| Mapbox GL JS | SI | **SI** - Ahora en `package.json` explicitamente |
| TailwindCSS | SI | **SI** |
| TanStack Query | No instalado | **SI** - Instalado y usado en KnowledgeBaseManager |
| Vercel AI SDK | No | **NO** |
| FastAPI | SI | **SI** |
| LangChain | Parcial | **IGUAL** |
| BigQuery client | No | **PREPARADO** - `requirements-bigquery.txt` separado |
| Celery | No | **NO** |
| ExcelJS | No | **NO** |
| Puppeteer/Playwright | No | **NO** |

### 5.2 Seguridad y Permisos

| Requisito | Estado anterior | Estado actual |
|-----------|----------------|---------------|
| RLS por region/plan | No | **NO** |
| Roles (Admin, Regional, Viewer) | is_admin() sin uso | **PARCIAL** - system_prompts tiene RLS autenticado |
| JWT Next.js <-> Supabase | SI | **SI** |
| Rate limiting | No | **NO** |
| Auth en endpoint Brain | No | **NO** - Endpoints brain y admin siguen publicos |

---

## 6. BUGS Y PROBLEMAS TECNICOS

### Resueltos
- ~~**Paginas 404**~~ - `/dashboard/projects` y `/dashboard/map` ahora existen
- ~~**Imports duplicados**~~ - Dashboard ahora importa iconos de lucide-react correctamente
- ~~**createClient sin await**~~ - Corregido en layout y server utils
- ~~**Typo RELAVANTE**~~ - Corregido en `get_default_template()` de router.py

### Persisten
1. **Logout roto** - `/auth/signout` sigue sin route handler
2. **Brain endpoint sin auth** - `/brain/ask` y `/brain/admin/*` publicos (costos OpenAI)
3. **Backend URL hardcodeada** - `http://localhost:8000` en BrainChat, SystemPromptEditor, KnowledgeBaseManager (4+ lugares)
4. **Error details expuestos** - `str(e)` en HTTP 500 (router.py:103, admin_router.py:157)
5. **knowledge_docs sin RLS** - Vector store accesible sin restriccion
6. **Chart placeholder** - "Ventas por Comuna" sigue siendo div gris
7. **totalStock calculo** - Sigue usando `total_units - sold_units` en vez de `available_units`
8. **Brain page KPIs hardcodeados** - "128 documentos" y "94% precision" son valores falsos (brain/page.tsx:37-48)
9. **Metadata de layout** - `title: "Create Next App"` no actualizado (layout.tsx:16)
10. **Bare except** - `admin_router.py:23` usa `except:` sin tipo de excepcion

### Nuevos problemas introducidos
11. **`confirm_emails.py`** - Contiene emails personales hardcodeados (cristian@nlace.com, mjsuarez.h@gmail.com, matiasdonas@gmail.com). No deberia estar en el repo.
12. **BigQuery project ID hardcodeado** - `my-project-wap-486916` en bigquery_to_supabase.py deberia ser env var
13. **system_prompts.json como fallback** - El admin_router lee/escribe archivos JSON en el filesystem del backend, lo que no funciona en deploys serverless
14. **ETL mapeo con nombres placeholder** - Ambos ETL scripts usan `nombre_proyecto`, `inmobiliaria`, etc. que probablemente no coinciden con los campos reales de BigQuery

---

## 7. COMPLIANCE FASE 1 MVP (Roadmap)

| Entregable MVP | Estado anterior | Estado actual | Completitud |
|---------------|----------------|---------------|-------------|
| Integracion TINSA completa | ETL skeleton | ETL BigQuery+CSV listos, falta mapeo real | **~30%** |
| Dashboard basico con filtros | Sin filtros | Busqueda + filtro comuna + sort | **~35%** |
| Generador informe "Contexto de Mercado" | No existe | No existe | **0%** |
| IA basica (explicacion tendencias) | Chat basico | Chat + admin prompts + knowledge CRUD | **~25%** |

---

## 8. PRIORIZACION ACTUALIZADA

### Bloqueantes para MVP:

**Sprint 1 - Data Real (alta prioridad):**
- [ ] Ejecutar ETL con datos reales de BigQuery / obtener CSV real
- [ ] Ajustar mapeo de campos en `csv_to_supabase.py` a nombres reales TINSA
- [ ] Agregar campos faltantes al schema `projects` si TINSA tiene mas de 25
- [ ] Fix backend URL hardcodeada (usar `NEXT_PUBLIC_API_URL` env var)
- [ ] Fix logout (crear route handler `/auth/signout`)
- [ ] Agregar auth a endpoints `/brain/*`

**Sprint 2 - Charts y Visualizacion:**
- [ ] Instalar Tremor (o Recharts) y reemplazar chart placeholders
- [ ] Implementar grafico "Ventas por Comuna" real en dashboard
- [ ] Agregar mapa de calor / clusters en pagina mapa
- [ ] Mas filtros en ProjectsTable (rango precio, tipo, estado obra, desarrollador)
- [ ] Vista detalle de proyecto individual

**Sprint 3 - Cerebro IA Real:**
- [ ] Implementar LangChain Agent con function calling (tool_consultar_sql)
- [ ] Text-to-SQL dinamico basado en pregunta del usuario
- [ ] tool_calcular_estadisticas con Pandas
- [ ] Mejorar RAG: threshold, metadata, mas contenido
- [ ] Streaming responses
- [ ] Poblar knowledge base con contenido real (leyes, macro, hitos)

**Sprint 4 - Reporteria:**
- [ ] Generador de informe "Contexto de Mercado" (5 secciones)
- [ ] Exportacion PDF
- [ ] Exportacion Excel (funcionalidad al boton Download existente)

**Sprint 5 - Deploy y Polish:**
- [ ] CORS configurable via env var
- [ ] docker-compose
- [ ] Deploy Vercel + Railway
- [ ] Limpiar KPIs hardcodeados en brain page
- [ ] Actualizar metadata del layout
- [ ] .env.example

---

## 9. CONCLUSIONES

### Progreso desde la version anterior

El proyecto avanzo de ~15% a ~30% del MVP. Los avances principales son:

1. **Paginas completas** - Projects, Map, Brain ahora existen con contenido real
2. **Tabla de proyectos funcional** - Con busqueda, filtro por comuna, ordenamiento
3. **Admin del Cerebro IA** - Editor de prompts versionados + gestor de knowledge base
4. **ETL preparados** - Scripts para BigQuery y CSV con dry-run y documentacion
5. **TanStack Query integrado** - Base para manejo de estado servidor
6. **Documentacion de migracion** - Guias claras para ETL

### Los 3 gaps mas criticos siguen siendo:

1. **No hay datos reales** - Los ETL estan listos pero con mapeos placeholder. Sin datos TINSA reales cargados, todo el sistema sigue mostrando mock data o nada.

2. **Cerebro IA sin herramientas reales** - Ahora tiene prompts configurables (buen avance), pero sigue haciendo la misma query SQL fija sin importar la pregunta. El core del valor (Text-to-SQL, estadisticas, correlaciones) no existe.

3. **Zero reporteria y charts** - Tremor no esta instalado. No hay un solo grafico real. El generador de informes no existe.

### Lo que esta bien hecho:
- Estructura de paginas completa y navegable
- Admin del Cerebro IA bien diseñado (versionamiento de prompts, CRUD knowledge)
- ProjectsTable con UX profesional (busqueda, filtros, badges de velocidad)
- ETL con patron dry-run y buena documentacion
- TanStack Query correctamente integrado
- Pagina de mapa dedicada con stats contextuales
