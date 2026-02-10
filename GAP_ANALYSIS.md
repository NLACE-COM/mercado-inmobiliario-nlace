# Gap Analysis: Proyecto Actual vs Documento Maestro

**Fecha:** 2026-02-10
**Comparacion:** Codigo actual vs "WebApp Inmobiliaria NLACE - Documento Maestro"

---

## Resumen Ejecutivo

El proyecto actual implementa un **esqueleto funcional** (~20% del MVP definido en el documento). Tiene la estructura correcta (monorepo Next.js + FastAPI + Supabase) pero la mayoria de las funcionalidades estan como placeholders o con implementacion minima. Ningun flujo end-to-end esta completo para produccion.

**Estado general por seccion del documento:**

| Seccion | Estado | Completitud |
|---------|--------|-------------|
| 2. Arquitectura de Datos | Parcial | ~15% |
| 3. Cerebro IA | Esqueleto | ~10% |
| 4. Outputs y Reporteria | Placeholder | ~5% |
| 5. Navegacion y Segmentacion | Basica | ~15% |
| 7. Arquitectura Tecnica | Estructura OK | ~25% |
| 8. Roadmap Fase 1 MVP | Incompleto | ~15% |

---

## 1. ARQUITECTURA DE DATOS (Seccion 2)

### 1.1 Fuentes de Datos

| Fuente | Doc. Maestro | Estado Actual | Gap |
|--------|-------------|---------------|-----|
| **TINSA** (Prioridad 1) | 47 campos estructurados, Nacional | Schema simplificado (~25 campos), ETL skeleton | **CRITICO** - Falta mapeo completo de los 47 campos TINSA. `importer.py` solo mapea 3 campos (name, commune, region). No hay integracion real con archivos TINSA |
| **CBR** (Prioridad 2) | Ventas reales inscritas SII | No existe | Fase 2 segun roadmap, OK por ahora |
| **Roles Avaluo** (Prioridad 3) | Tasaciones fiscales SII | No existe | Fase 2, OK |
| **INE** (Prioridad 3) | Segmentacion socioeconomica | No existe | Fase 3, OK |
| **Perfil Compradores** (Prioridad 4) | RUT, edad, tipo cliente | No existe | Fase 3, OK |
| **Portales** (Prioridad 4) | Scraping Portal Inmobiliario, TocToc | No existe | Fase 3, OK |

**Gap critico para MVP:** El ETL de TINSA (`importer.py`) es un skeleton que no funciona realmente. Solo mapea 3 de 47 campos. No hay pipeline real de ingesta.

### 1.2 Modelo de Base de Datos

**Lo que existe:**
- `projects` - Tabla maestra (~25 campos vs 47 requeridos)
- `project_typologies` - Tipologias basicas
- `project_metrics_history` - Series temporales
- `market_insights` - Insights IA
- `knowledge_docs` - Vector store RAG
- `profiles` - Autenticacion

**Lo que falta (para MVP):**

| Tabla/Campo Requerido | Estado |
|----------------------|--------|
| Campos TINSA completos (47) en `projects` | **FALTA** - Faltan ~22 campos: KEY, periodo, zona, tipologia detallada, estacionamientos, bodegas, subsidios, categoria, % descuento, velocidad proyectada vs actual, meses en venta |
| `ventas_cbr` | No aplica para MVP (Fase 2) |
| `avaluos_sii` | No aplica para MVP (Fase 2) |
| `segmentacion_socioeconomica` | No aplica para MVP (Fase 3) |
| `perfil_compradores` | No aplica para MVP (Fase 3) |
| `oferta_portales` | No aplica para MVP (Fase 3) |

**Campos faltantes criticos en `projects` (necesarios para MVP):**
- `key` / `periodo` (identificacion TINSA)
- `zona` (nivel geografico intermedio entre region y comuna)
- `tipologia_detalle` (1D-1B, 2D-2B granulado)
- `estacionamientos`, `bodegas`
- `subsidio` (DS1, DS19, etc.)
- `descuento_porcentaje`
- `velocidad_proyectada` vs `velocidad_actual`
- `meses_en_venta`
- `estado_obra` granulado (faenas, obra gruesa, terminaciones, entregado)

### 1.3 Pipeline ETL

| Requisito | Estado |
|-----------|--------|
| Extraccion Excel/CSV TINSA | Skeleton en `importer.py` (lee archivo pero mapea 3 campos) |
| Limpieza y normalizacion Pandas | No implementado |
| Georreferenciacion unificada | Solo en mock_data (random jitter) |
| Validacion de consistencia | No existe |
| Carga batch a Supabase | Basico (upsert sin validacion) |
| Celery jobs para scheduling | **NO EXISTE** |
| Pipeline automatizado | **NO EXISTE** |
| Google Drive API (sheets TINSA) | **NO EXISTE** |
| BigQuery API (historico masivo) | **NO EXISTE** |

---

## 2. CEREBRO INMOBILIARIO / IA (Seccion 3)

### 2.1 Arquitectura Multi-Agente

| Requisito | Estado | Gap |
|-----------|--------|-----|
| Agente Analista con tools | **NO** - Endpoint simple sin agente | Necesita LangChain Agent con tool calling |
| `tool_consultar_sql` (Text-to-SQL dinamico) | **NO** - Query hardcodeada (SELECT top 5 projects) | Necesita SQL generation basada en pregunta |
| `tool_consultar_historia` (RAG pgvector) | **PARCIAL** - `similarity_search` basico funciona | Falta threshold, metadata filtering, scores |
| `tool_calcular_estadisticas` (Pandas) | **NO EXISTE** | Necesita calculo de absorcion, MAO, tendencia, percentiles |
| System Prompt dinamico con context injection | **BASICO** - Prompt estatico con slots | Necesita auto-deteccion de intent y query dinamica |
| Multi-LLM (OpenAI + Claude + Google) | **NO** - Solo GPT-4-turbo | Doc sugiere Vercel AI SDK para orquestacion |
| Streaming responses | **NO** - Respuesta completa sincrona | Necesita streaming para UX |
| Function calling LLM | **NO** | Core de la arquitectura multi-agente |

### 2.2 Knowledge Base (RAG)

| Contenido Requerido | Estado |
|---------------------|--------|
| Marco regulatorio (Ley 21.442, 21.210, 20.780, SII) | **NO** - Solo 4 chunks genericos |
| Hitos historicos estructurados (JSON con metricas) | **NO** - Texto plano sin estructura |
| Base macroeconomica (UF, TPM, PIB, tasas, IPV) | **NO EXISTE** |
| Informes previos y insights validados | **NO EXISTE** |
| Papers y estudios (CChC, universidades) | **NO EXISTE** |
| Formato vectorizacion: chunks 500-1000 tokens | **PARCIAL** - Sin control de chunk size |
| Embeddings `text-embedding-3-small` | **NO** - Usa default OpenAI embeddings (no especifica modelo) |
| Metadata: fecha, fuente, tipo_documento, relevancia_geografica | **MINIMO** - Solo topic, year, event |

**Estado actual de la Knowledge Base:** 4 textos cortos hardcodeados como seed data. El documento maestro requiere una base de conocimientos extensa con regulaciones, datos macro, papers, e informes previos.

### 2.3 System Prompt

| Requisito | Estado |
|-----------|--------|
| Prompt dinamico construido por funcion | **NO** - Template estatico en `router.py` |
| Auto-deteccion de queries SQL necesarias | **NO** - Query fija (top 5 projects) |
| Correlacion automatica eventos + datos | **NO** - El LLM lo intenta pero sin datos suficientes |
| Cita fuentes especificas (Leyes, BCCh) | **NO** - Sin fuentes en knowledge base |
| Formato de respuesta estructurado (4 secciones) | **NO** - Texto libre |
| Predicciones contextuales | **NO** |
| Alertas proactivas | **NO** |

### 2.4 Mejora Continua

| Requisito | Estado |
|-----------|--------|
| Guardar predicciones con timestamp | **NO** |
| Comparar con datos reales 6-12 meses | **NO** |
| Re-entrenar embeddings | **NO** |
| Metricas de calidad (accuracy, recall, NPS) | **NO** |

---

## 3. OUTPUTS Y REPORTERIA (Seccion 4)

### 3.1 Tipos de Informes

| Informe | Estado | Gap |
|---------|--------|-----|
| Contexto de Mercado | **NO EXISTE** | MVP critico |
| Proyecto Especifico | **NO EXISTE** | |
| Oportunidad de Terreno | **NO EXISTE** | |
| Dashboard Ejecutivo | **BASICO** - 4 KPIs + mapa | Falta alertas, comparacion portfolio |

### 3.2 Estructura de Informe

El documento maestro define 5 secciones detalladas para cada informe (Contexto, Segmento, Competencia, Analisis Detallado, Conclusiones IA). **Nada de esto existe.** No hay generador de informes.

### 3.3 Elementos Visuales

| Elemento Visual | Estado |
|----------------|--------|
| Graficos de barras apiladas | **NO** - Placeholder "Chart Component" |
| Graficos de linea (evolucion) | **NO** |
| Mapas georreferenciados | **SI** - MapboxMap funcional |
| Tablas comparativas | **NO** |
| Graficos torta (mix productos) | **NO** |
| Indicadores KPI | **BASICO** - 4 KPIs simples |
| Mapa de calor precios | **NO** |
| Densidad de oferta | **NO** |

### 3.4 Exportacion

| Formato | Estado |
|---------|--------|
| PDF (Puppeteer/Playwright) | **NO EXISTE** |
| PPT | **NO EXISTE** |
| Excel (.xlsx con ExcelJS) | **NO EXISTE** |

---

## 4. NAVEGACION Y SEGMENTACION (Seccion 5)

### 4.1 Jerarquia Geografica

| Nivel | Estado |
|-------|--------|
| Nacional | No implementado |
| Region | No implementado como filtro |
| Provincia | No existe |
| Comuna | Existe como campo pero sin filtro UI |
| Sector/Barrio | No existe |
| Proyecto especifico | No existe vista detalle |

### 4.2 Filtros y Segmentaciones

| Filtro | Estado |
|--------|--------|
| Por Region | **NO** |
| Por Comuna | **NO** (dato existe, filtro no) |
| Radio desde punto (1km, 2km, 5km) | **NO** |
| Poligono dibujado | **NO** |
| Tipo propiedad | **NO** |
| Rango precio UF | **NO** |
| Tipologia (1D-1B, etc.) | **NO** |
| Superficie m2 | **NO** |
| Estado obra | **NO** |
| Desarrollador | **NO** |
| Periodo | **NO** |
| Tasa absorcion | **NO** |
| MAO | **NO** |
| Velocidad venta | **NO** |
| % vendido | **NO** |

**Resultado: 0 de 15 filtros implementados.**

### 4.3 Vistas del Sistema

| Vista | Estado | Gap |
|-------|--------|-----|
| Dashboard | **BASICA** - 4 KPIs + mapa + chart placeholder | Falta alertas automaticas, graficos resumen reales |
| Mapa | **PARCIAL** - Markers con popup | Falta calor de precios, densidad oferta, filtros geograficos |
| Comparador | **NO EXISTE** | Pagina no creada |
| Generador de Informes | **NO EXISTE** | Feature completa faltante |
| Vista Proyectos | **NO EXISTE** | Link en sidebar lleva a 404 |

---

## 5. ARQUITECTURA TECNICA (Seccion 7)

### 5.1 Stack Tecnologico

| Tecnologia Requerida | Estado |
|---------------------|--------|
| **Supabase** (PostgreSQL + PostGIS + Auth + RLS) | **SI** - Configurado y con migraciones |
| **Next.js** (App Router, Server Components) | **SI** - v16.1.6 (doc dice 14, pero 16 es mejor) |
| **Shadcn/UI** | **SI** - Componentes basicos instalados |
| **Tremor** (dashboards, charts, KPIs) | **NO INSTALADO** - Charts son placeholders |
| **Mapbox GL JS** | **SI** - react-map-gl funcionando |
| **TailwindCSS** | **SI** |
| **TanStack Query (React Query)** | **NO INSTALADO** - Se usa fetch directo/axios |
| **Vercel AI SDK** | **NO INSTALADO** - Para multi-LLM y streaming |
| **FastAPI** (Python service) | **SI** |
| **LangChain** | **PARCIAL** - Instalado pero usado minimamente |
| **Celery** (job scheduling) | **NO INSTALADO** |
| **ExcelJS** | **NO INSTALADO** |
| **Puppeteer/Playwright** (PDF) | **NO INSTALADO** |
| **BigQuery** client | **NO INSTALADO** |
| **Faker** | SI (solo para mock data) |

### 5.2 Dependencias Faltantes en `package.json`

```
Faltantes (frontend):
- @tremor/react (o alternativa charts)
- @tanstack/react-query
- @ai-sdk/react (Vercel AI SDK)
- exceljs
- react-pdf o similar

Faltantes (backend requirements.txt):
- celery
- redis (broker para celery)
- google-cloud-bigquery
- playwright o puppeteer-python
- faker (esta en mock pero no en requirements)
```

### 5.3 Seguridad y Permisos

| Requisito | Estado |
|-----------|--------|
| RLS por region/plan del usuario | **NO** - Solo lectura publica |
| Roles (Admin, Regional, Viewer) | **PARCIAL** - `is_admin()` existe pero no se usa |
| JWT automatico Next.js <-> Supabase | **SI** - Middleware funciona |
| Rate limiting | **NO** |
| Auth en endpoint Brain | **NO** - Endpoint publico |

### 5.4 Infraestructura

| Requisito | Estado |
|-----------|--------|
| Supabase Cloud | Config local, no cloud |
| Vercel deployment | **NO** - Sin vercel.json |
| Railway/Fly.io (Python) | **NO** - Solo Dockerfile |
| docker-compose | **NO EXISTE** |
| CI/CD | **NO EXISTE** |
| Env vars documentadas | **NO** - Sin .env.example |

---

## 6. COMPLIANCE FASE 1 MVP (Roadmap Seccion 8)

El documento define Fase 1 MVP (3-4 meses) con estos entregables:

| Entregable MVP | Estado | Completitud |
|---------------|--------|-------------|
| Integracion TINSA completa (ambas bases) | ETL skeleton, 3/47 campos | ~5% |
| Dashboard basico con filtros geograficos | Dashboard sin filtros | ~20% |
| Generador informe "Contexto de Mercado" | No existe | 0% |
| IA basica (explicacion de tendencias) | Chat basico, sin tools reales | ~10% |

---

## 7. BUGS Y PROBLEMAS TECNICOS EXISTENTES

### Criticos
1. **Logout roto** - `/auth/signout` no tiene route handler
2. **Brain endpoint sin auth** - Costos OpenAI expuestos
3. **Backend URL hardcodeada** - `localhost:8000` en BrainChat
4. **Error details expuestos** - `str(e)` en HTTP 500
5. **knowledge_docs sin RLS**

### Funcionales
6. **Paginas 404** - `/dashboard/projects` y `/dashboard/map` linkeadas pero no existen
7. **Chart placeholder** - "Ventas por Comuna" es solo un div gris
8. **Imports duplicados** - TrendingUp, Users importados y redefinidos
9. **totalStock calculo** - Usa `total_units - sold_units` en vez de `available_units`
10. **Typo** - "RELAVANTE" en prompt del Brain

---

## 8. PRIORIZACION DE TRABAJO PENDIENTE

### Para completar MVP (Fase 1):

**Sprint 1 - Fundacion (2 semanas):**
- [ ] Completar schema BD con 47 campos TINSA
- [ ] Implementar ETL real de TINSA (Excel -> BD con todos los campos)
- [ ] Instalar dependencias faltantes (Tremor, TanStack Query)
- [ ] Fix bugs criticos (logout, auth brain, env vars)
- [ ] Crear .env.example

**Sprint 2 - Dashboard Real (2 semanas):**
- [ ] Implementar filtros geograficos (region, comuna, tipo)
- [ ] Implementar charts reales con Tremor (barras, lineas, torta)
- [ ] Crear pagina `/dashboard/projects` con tabla de proyectos
- [ ] Crear pagina `/dashboard/map` con filtros y layers
- [ ] Implementar RLS por roles

**Sprint 3 - Cerebro IA (2 semanas):**
- [ ] Implementar LangChain Agent con tool calling
- [ ] Crear `tool_consultar_sql` (Text-to-SQL dinamico)
- [ ] Mejorar `tool_consultar_historia` (threshold, metadata)
- [ ] Crear `tool_calcular_estadisticas` (Pandas)
- [ ] Expandir Knowledge Base (regulaciones, macro, hitos)
- [ ] Implementar streaming responses

**Sprint 4 - Reporteria (2 semanas):**
- [ ] Generador de informe "Contexto de Mercado"
- [ ] Estructura 5 secciones (contexto, segmento, competencia, analisis, IA)
- [ ] Exportacion PDF
- [ ] Exportacion Excel

**Sprint 5 - Polish y Deploy (1 semana):**
- [ ] docker-compose completo
- [ ] Deploy Vercel (frontend) + Railway (backend)
- [ ] Supabase Cloud migration
- [ ] Testing E2E basico
- [ ] CI/CD pipeline

---

## 9. CONCLUSIONES

El proyecto tiene **la arquitectura correcta** alineada con el documento maestro (Next.js + FastAPI + Supabase + LangChain + Mapbox). Sin embargo, la implementacion actual es un **proof-of-concept** con ~15% de lo necesario para el MVP.

**Los 3 gaps mas criticos son:**

1. **ETL de TINSA no funcional** - Sin datos reales, todo el sistema es inutil. El importer solo mapea 3 de 47 campos y no hay pipeline automatizado.

2. **Cerebro IA es un endpoint basico, no un agente** - El documento requiere un sistema multi-agente con tools (SQL dinamico, RAG avanzado, estadisticas). Actualmente es un prompt estatico con una query SQL hardcodeada.

3. **Zero reporteria** - El diferenciador del producto (generar informes de contexto de mercado automatizados) no existe. No hay generador de informes, no hay exportacion.

**Lo que esta bien hecho:**
- Estructura del monorepo limpia
- Schema de BD bien diseñado (aunque incompleto)
- Middleware de auth con Supabase SSR correcto
- Mapa Mapbox funcional
- Landing page y login funcionales
- Migraciones SQL con PostGIS y pgvector
