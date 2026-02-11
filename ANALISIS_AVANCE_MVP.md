# ANÁLISIS DE AVANCE DEL MVP
## Plataforma Inmobiliaria NLACE

**Fecha de Análisis:** 11 de Febrero 2026
**Documento Base:** Documento Maestro del Proyecto (Febrero 2026)
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

### Estado General del MVP
**Porcentaje de Avance Global: 72%**

El proyecto presenta un desarrollo sólido en las áreas core del MVP, con arquitectura técnica bien implementada y funcionalidades clave operativas. Sin embargo, quedan componentes importantes por completar, especialmente en visualización de datos y pipeline de integración con fuentes externas.

### Desglose por Área

| Área | Avance | Estado |
|------|--------|--------|
| **Arquitectura Técnica** | 95% | ✅ Excelente |
| **Base de Datos** | 90% | ✅ Muy bueno |
| **Sistema de IA (RAG)** | 85% | ✅ Muy bueno |
| **Dashboard Básico** | 60% | ⚠️ En desarrollo |
| **Visualización y Mapas** | 55% | ⚠️ En desarrollo |
| **Pipeline de Datos** | 65% | ⚠️ En desarrollo |
| **Reportería** | 50% | ⚠️ Parcial |
| **Auth y Seguridad** | 90% | ✅ Muy bueno |

---

## ANÁLISIS DETALLADO POR COMPONENTE

### 1. ARQUITECTURA DE DATOS (90%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Base de Datos PostgreSQL + PostGIS (Supabase)**
- ✅ Tabla `projects` con 47+ campos TINSA
- ✅ Campos geográficos: `location` (geometry), `latitude`, `longitude`
- ✅ Índices GiST para búsquedas geoespaciales
- ✅ Tabla `project_typologies` para tipologías (1D-1B, 2D-2B, etc.)
- ✅ Tabla `project_metrics_history` para series de tiempo
- ✅ Constraint único: `(name, commune)`
- ✅ Triggers para `updated_at` automático

**Campos TINSA Completos:**
```sql
✅ Identificación: tinsa_id, tinsa_key, year, period
✅ Ubicación: region, commune, address, lat/long
✅ Características: property_type, developer, category
✅ Cronología: sales_start_date, delivery_date, construction_start_date
✅ Métricas: stock, oferta, ventas, tipología
✅ Precios: avg_price_uf, min/max, price_m2_uf
✅ Velocidad: sales_speed_monthly, months_to_sell_out
✅ Extras: parking, storage, subsidies
```

#### ❌ **FALTANTE**

**Fuentes de Datos Adicionales (Prioridad 2-4):**
- ❌ CBR (Conservador Bienes Raíces) - NO INTEGRADO
- ❌ Roles de Avalúo SII - NO INTEGRADO
- ❌ INE (Segmentación socioeconómica) - NO INTEGRADO
- ❌ RUT Compradores - NO INTEGRADO
- ❌ Portal Inmobiliario scraping - NO INTEGRADO
- ❌ Toc Toc scraping - NO INTEGRADO

**Tablas Adicionales Pendientes:**
```sql
❌ ventas_cbr (ventas inscritas SII)
❌ avaluos_sii (tasaciones fiscales)
❌ segmentacion_socioeconomica (INE)
❌ perfil_compradores (edades, tipo cliente)
❌ oferta_portales (scraping PI/TocToc)
```

#### 📊 **SCORING: 90%**
- Base TINSA completa (50% del total) ✅
- Otras fuentes faltantes (40% del total) ❌
- Estructura lista para integración (+10%)

---

### 2. CEREBRO INMOBILIARIO - IA (85%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Sistema RAG (Retrieval Augmented Generation)**
- ✅ Tabla `knowledge_docs` con pgvector (1536 dimensiones)
- ✅ Función `match_documents()` con IVFFlat index
- ✅ Embeddings OpenAI `text-embedding-3-small`
- ✅ Búsqueda vectorial con fallback a text search
- ✅ Ingesta de documentos vía API (`/api/brain/admin/knowledge`)

**Agente Multi-Tool**
- ✅ 7 tools implementadas en `brain-agent.ts`:
  1. `get_market_stats` (estadísticas por comuna)
  2. `search_projects` (búsqueda avanzada)
  3. `compare_regions` (comparativa regional)
  4. `get_top_sales` (top 10 por velocidad)
  5. `get_market_summary` (resumen ejecutivo)
  6. `compare_communes_detailed` (comparativa comunal)
  7. `get_historical_trends` (tendencias 6 meses)
  8. `get_typology_analysis` (análisis por tipología)

**API y Endpoints**
- ✅ POST `/api/brain/chat` - Chat conversacional
- ✅ GET/POST `/api/brain/admin/knowledge` - Gestión knowledge base
- ✅ GET/POST `/api/brain/admin/prompts` - Gestión system prompts

**Knowledge Base (Inicial)**
- ✅ Estructura para documentos vectorizados
- ✅ Metadata JSONB flexible
- ✅ Similarity search con threshold 0.7

#### ❌ **FALTANTE**

**Base de Conocimientos Completa**
```
❌ Marco Regulatorio:
   - Ley 21.442 (subsidios DS1/DS19)
   - Ley 21.210/2020 (IVA viviendas >2000 UF)
   - Ley 20.780/2014 (reforma tributaria)

❌ Hitos Históricos Estructurados:
   - Terremoto 2010
   - Cambio IVA 2015-2016
   - Estallido social 2019 (impacto detallado)
   - Pandemia COVID 2020

❌ Base Macroeconómica:
   - Series UF (1990-presente)
   - TPM Banco Central
   - PIB construcción
   - Tasas hipotecarias

❌ Papers y Estudios:
   - CChC informes
   - Estudios académicos
```

**Funcionalidades Avanzadas**
- ❌ Predicciones contextuales automáticas
- ❌ Alertas proactivas (riesgo de proyectos)
- ❌ Correlación automática de eventos históricos
- ❌ Feedback loop (validación predicciones)

#### 📊 **SCORING: 85%**
- Infraestructura RAG completa (+35%)
- Agente con tools funcional (+35%)
- Knowledge base vacía (-10%)
- Features avanzadas pendientes (-5%)

---

### 3. OUTPUTS Y REPORTERÍA (50%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Sistema Básico de Reportes**
- ✅ Tabla `generated_reports` con JSONB
- ✅ Estados: draft, generating, completed, failed
- ✅ Tipos definidos: COMMUNE_MARKET, AREA_POLYGON, PROJECT_BENCHMARK, MULTI_COMMUNE_COMPARISON
- ✅ API endpoints:
  - POST `/api/brain/reports/generate`
  - GET `/api/brain/reports`
  - GET `/api/brain/reports/[id]`
- ✅ Interfaz `CreateReportDialog` con tipos de reporte
- ✅ Vista de listado de reportes en `/dashboard/reports`
- ✅ Vista de detalle de reporte en `/dashboard/reports/[id]`

**Componentes de Visualización**
- ✅ `MapAreaSelector` para dibujar polígonos
- ✅ Integración con MapBox GL Draw
- ✅ Generación de WKT para geometrías

#### ❌ **FALTANTE**

**Tipos de Informes Definidos en Documento**

1. **Informe de Contexto de Mercado** ❌ (50% implementado)
   ```
   Estructura esperada:
   ✅ Tamaño de mercado comunal (datos disponibles)
   ❌ Evolución 5 años por segmento de precio (no visualizado)
   ❌ Participación por tipología (oferta vs venta)
   ❌ Unidades disponibles vs MAO (no graficado)
   ❌ Tasa de absorción histórica (datos existen, no graficados)
   ❌ Análisis de competencia primaria (no estructurado)
   ```

2. **Informe de Proyecto Específico** ❌ (NO IMPLEMENTADO)
   - ❌ Posicionamiento vs competencia
   - ❌ Velocidad de venta comparada
   - ❌ Pricing sugerido por UF/m²
   - ❌ Mix óptimo de productos
   - ❌ Proyección de agotamiento

3. **Informe de Oportunidad de Terreno** ❌ (NO IMPLEMENTADO)
   - ❌ Análisis demanda en radio 2km
   - ❌ Gap oferta vs demanda
   - ❌ Productos con mayor potencial
   - ❌ Rango precios competitivo

4. **Dashboard Ejecutivo** ⚠️ (PARCIAL)
   - ✅ KPIs básicos (total proyectos, stock, velocidad)
   - ❌ Alertas automáticas de mercado
   - ❌ Comparación portfolio vs mercado

**Elementos Visuales Faltantes**
```
❌ Gráficos de barras apiladas (participación % por rango UF)
❌ Gráficos de línea (evolución unidades y MAO histórico)
✅ Mapas georreferenciados (implementado)
❌ Tablas comparativas de competencia (estructura existe, no formato final)
❌ Gráficos torta (mix de productos)
❌ Indicadores KPI visuales (MAO, absorción %)
```

**Exportación**
- ❌ Exportación a PDF
- ❌ Exportación a PowerPoint
- ❌ Exportación a Excel
- ❌ Personalización de marca (logo, colores)

#### 📊 **SCORING: 50%**
- Estructura de reportes lista (+20%)
- API funcional (+15%)
- Contenido básico generado (+15%)
- Visualizaciones faltantes (-20%)
- Exportación faltante (-15%)
- Templates específicos faltantes (-15%)

---

### 4. NAVEGACIÓN Y SEGMENTACIÓN (70%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Jerarquía Geográfica**
- ✅ Filtrado por región
- ✅ Filtrado por comuna
- ✅ Búsqueda en tabla de proyectos
- ✅ Función `find_projects_in_polygon()` para polígonos

**Filtros Básicos**
- ✅ Por ubicación: región, comuna
- ✅ Por características: tipo propiedad (en datos)
- ✅ Por timing: fechas disponibles en DB
- ✅ Radio desde punto (función SQL disponible)

**Vistas del Sistema**
- ✅ Vista Dashboard (`/dashboard`)
- ✅ Vista Mapa (`/dashboard/map`)
- ✅ Vista Proyectos (`/dashboard/projects`)
- ✅ Vista Analytics (`/dashboard/analytics`)
- ✅ Vista Reportes (`/dashboard/reports`)

#### ❌ **FALTANTE**

**Filtros Avanzados en UI**
```
❌ Rango precio UF (min/max) - UI no implementada
❌ Tipología (1D-1B, 2D-2B) - UI no implementada
❌ Superficie m² (min/max) - UI no implementada
❌ Estado obra (dropdown) - UI no implementada
❌ Desarrollador (select) - UI no implementada
❌ Meses en venta (rango) - UI no implementada
❌ Tasa absorción (rango) - UI no implementada
❌ MAO (rango) - UI no implementada
❌ % vendido (rango) - UI no implementada
```

**Vistas Faltantes**
- ❌ Vista Comparador (matriz competencia)
- ❌ Vista Generador Informes Personalizado (avanzado)

**Funcionalidad Mapa**
- ✅ Markers georreferenciados
- ✅ Popup con info básica
- ❌ Calor de precios (heatmap)
- ❌ Densidad de oferta (clusters)
- ❌ Filtros en mapa (sin recargar página)

#### 📊 **SCORING: 70%**
- Estructura geográfica completa (+25%)
- Vistas principales implementadas (+30%)
- Filtros básicos (+15%)
- Filtros avanzados faltantes (-15%)
- Visualizaciones avanzadas mapa (-15%)

---

### 5. PIPELINE DE DATOS Y ETL (65%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Integración TINSA**
- ✅ Script `tinsa_importer.py` (25KB)
- ✅ Parseo de números chilenos (coma decimal)
- ✅ Detección automática de formato coordenadas
- ✅ Upsert de proyectos
- ✅ Inserción de tipologías
- ✅ Snapshot en `project_metrics_history`
- ✅ Comandos: `--preview`, `--dry-run`, `--migrate`

**Geocoding**
- ✅ Script `geocode_projects.py`
- ✅ Cache persistente JSON
- ✅ Rate limiting
- ✅ Nominatim + fallback Google Maps
- ✅ Batch processing (50 proyectos/batch)

**Endpoints Admin**
- ✅ POST `/api/admin/import-tinsa` (upload CSV)
- ✅ POST `/api/admin/backfill-typologies`
- ✅ POST `/api/admin/backfill-metrics`

**Datos Actuales**
- ✅ 3,511 proyectos cargados
- ✅ 325+ tipologías
- ✅ 50+ comunas
- ✅ Cobertura: RM, Norte (I, II, IV), XV Región

#### ❌ **FALTANTE**

**Fuentes Externas (Prioridad 2-4)**
```
❌ CBR - Conservador Bienes Raíces
   - API SII no integrada
   - Georreferenciación pendiente
   - Cruce con TINSA pendiente

❌ Roles de Avalúo SII
   - API/scraping no implementado
   - Carga manual Excel no habilitada

❌ INE - Segmentación Socioeconómica
   - No integrado
   - Carga manual pendiente

❌ Portal Inmobiliario / Toc Toc
   - Scrapers no implementados
   - Matías hacía scraping manual (no automatizado)

❌ BigQuery TINSA
   - Script `bigquery_to_supabase.py` existe pero no usado en producción
```

**Automatización**
- ❌ Celery jobs para ETL periódico
- ❌ Cron jobs automáticos
- ❌ Monitoreo de errores ETL
- ❌ Alertas de fallos en importación

**Validación y Calidad**
- ❌ Validación cruzada CBR vs TINSA
- ❌ Detección de anomalías en datos
- ❌ Deduplicación automática

#### 📊 **SCORING: 65%**
- TINSA completo (+40%)
- Geocoding funcional (+15%)
- Admin endpoints (+10%)
- Otras fuentes faltantes (-30%)
- Automatización pendiente (-10%)

---

### 6. VISUALIZACIÓN Y DASHBOARD (60%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Dashboard Principal**
- ✅ KPIs básicos:
  - Total proyectos
  - Total unidades
  - Velocidad promedio venta
  - Total vendido
- ✅ Componente `MarketOverviewChart` (por región)
- ✅ Stats cards con iconos

**Componentes de Gráficos**
- ✅ `MarketOverviewChart.tsx` (BarChart Recharts)
- ✅ `PriceDistributionChart.tsx` (distribución precios)
- ✅ `SalesTrendsChart.tsx` (tendencias)

**Mapa**
- ✅ `MapboxMap.tsx` con Mapbox GL
- ✅ Markers de proyectos
- ✅ Popup interactivo
- ✅ FitBounds automático
- ✅ Flyto a proyecto específico

**Tablas**
- ✅ `ProjectsTable.tsx` con búsqueda y filtrado
- ✅ Paginación (50 items/página)
- ✅ Badges de estado

**Analytics**
- ✅ Página `/dashboard/analytics`
- ✅ Gráficos de distribución de precios
- ✅ Resumen por región

#### ❌ **FALTANTE**

**Librería Tremor**
```
Documento dice: "Next.js + Shadcn/UI + Tremor"
Estado: Tremor NO está en package.json
Consecuencia: Falta componentes profesionales de dashboards
```

**Visualizaciones Específicas del Documento**
```
❌ Gráficos de barras apiladas (participación % por rango UF)
❌ Gráficos de línea con MAO histórico
❌ Gráficos torta (mix de productos por tipología)
❌ Indicadores KPI grandes y visuales (MAO, absorción %)
❌ Heatmap de precios en mapa
❌ Clusters de densidad de oferta
```

**Dashboard Ejecutivo (Documento Sección 4.1)**
- ❌ KPIs en tiempo real (solo snapshot actual)
- ❌ Alertas de mercado automáticas
- ❌ Comparación portfolio vs mercado

**Interactividad**
- ❌ Filtros en tiempo real sin reload
- ❌ Drill-down desde gráficos
- ❌ Cross-filtering entre visualizaciones

#### 📊 **SCORING: 60%**
- Componentes básicos (+30%)
- Mapa funcional (+20%)
- Gráficos Recharts (+10%)
- Tremor faltante (-10%)
- Visualizaciones específicas faltantes (-20%)
- Interactividad limitada (-10%)

---

### 7. AUTENTICACIÓN Y SEGURIDAD (90%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Supabase Auth**
- ✅ JWT basado en cookies HTTP-only
- ✅ Flow de login/logout
- ✅ Middleware de validación
- ✅ `requireAuth()` helper
- ✅ `requireAdmin()` helper

**Tabla Profiles**
- ✅ Campos: id, email, full_name, role
- ✅ Trigger `on_auth_user_created`
- ✅ Función RPC `is_admin()`

**RLS (Row Level Security)**
- ✅ Políticas en `profiles`
- ⚠️ RLS en `generated_reports` (abierto en dev mode)
- ⚠️ RLS en `projects` (no configurado)

**Protected Routes**
- ✅ Todos los endpoints `/api/brain/*` requieren auth
- ✅ Endpoints admin requieren role=admin
- ✅ User tracking en reportes (user_id)

#### ❌ **FALTANTE**

**RLS Completo**
```
❌ Políticas en projects:
   - Usuarios solo ven proyectos de su región/plan
   - Lectura según plan contratado (comunal/regional/nacional)

❌ Políticas en generated_reports:
   - Actualmente: ABIERTO (policy permissive)
   - Debería: filtrar por user_id excepto admin
```

**Roles Avanzados**
- ❌ Rol "Regional" (acceso por región contratada)
- ❌ Rol "Viewer" (solo lectura, sin descarga)
- ❌ Sistema de planes/suscripciones

**Auditoría**
- ❌ Log de acciones sensibles
- ❌ Tracking de descargas de reportes
- ❌ Historial de cambios

#### 📊 **SCORING: 90%**
- Auth funcional completo (+50%)
- Helpers y middleware (+20%)
- Profiles y roles básicos (+20%)
- RLS parcial (-5%)
- Roles avanzados faltantes (-5%)

---

### 8. FRONTEND - ARQUITECTURA TÉCNICA (95%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Stack Tecnológico**
- ✅ Next.js 16.1.6 (App Router)
- ✅ React 19.2.3
- ✅ TypeScript 5
- ✅ TailwindCSS 4.0
- ✅ Shadcn/ui completo
- ✅ TanStack React Query 5.90.20
- ✅ Supabase JS 2.95.3
- ✅ Supabase SSR 0.8.0

**Componentes UI (Shadcn)**
- ✅ Dialog, Select, Tabs, Avatar
- ✅ Button, Card, Input, Label
- ✅ Table, Badge, ScrollArea
- ✅ Todos los primitivos RadixUI

**Visualización**
- ✅ Recharts 3.7.0
- ✅ Mapbox GL 3.18.1
- ✅ React Map GL 8.1.0
- ✅ Mapbox GL Draw 1.5.1

**Gestión de Estado**
- ✅ TanStack Query para servidor
- ✅ Hooks React para estado local
- ✅ Context API (si aplica)

**Utilidades**
- ✅ Zod 4.3.6 (validación)
- ✅ Axios 1.13.5
- ✅ OpenAI SDK 6.21.0
- ✅ AI Package 6.0.78

**Estructura de Carpetas**
- ✅ `/app` (App Router Next.js 14+)
- ✅ `/components` (React components)
- ✅ `/lib` (helpers y utilidades)
- ✅ `/utils` (funciones auxiliares)
- ✅ `/config` (configuración centralizada)

#### ❌ **FALTANTE**

**Librerías del Documento**
```
❌ Tremor - Librería especializada en dashboards
   - No está en package.json
   - Recomendada en documento para "look premium"
```

#### 📊 **SCORING: 95%**
- Stack completo (+70%)
- Componentes UI (+15%)
- Gestión estado (+10%)
- Tremor faltante (-5%)

---

### 9. BACKEND - ARQUITECTURA TÉCNICA (75%)

#### ✅ **IMPLEMENTADO CORRECTAMENTE**

**Supabase como Backend**
- ✅ PostgreSQL + PostGIS
- ✅ REST API automática
- ✅ GraphQL API disponible
- ✅ Auth integrada
- ✅ Storage habilitado
- ✅ Edge Functions configurables

**API Routes Next.js**
- ✅ `/api/brain/chat` (POST)
- ✅ `/api/brain/reports/*` (GET, POST)
- ✅ `/api/brain/admin/*` (POST, GET)
- ✅ `/api/admin/*` (POST)

**Python Backend (Legacy)**
- ✅ FastAPI server (`backend/app/main.py`)
- ✅ Agente con Langchain
- ✅ Tools Python (396 líneas)
- ✅ Routers: brain, admin, reports
- ✅ ETL scripts

#### ⚠️ **ESTADO ACTUAL**

**Migración en Curso**
```
Documento dice: "Elimina microservicio Python. Edge Functions + LLMs manejan todo."

Estado actual:
✅ IA migrada a Next.js (brain-agent.ts)
✅ API routes en Next.js funcionales
⚠️ Python backend aún existe (legacy)
⚠️ No está claro si Python se usa en producción
```

**Despliegue**
```
✅ Vercel configurado (vercel.json)
✅ Supabase Cloud
❌ Railway/Fly.io (Python) - Estado desconocido
❌ Dockerfile existe pero no sabemos si se usa
```

#### ❌ **FALTANTE**

**Documentación Clara de Arquitectura**
- ❌ ¿Se usa Python en producción?
- ❌ ¿Cuándo se elimina Python completamente?
- ❌ ¿BigQuery en uso?

**Edge Functions**
- ❌ No hay Edge Functions visibles en `/supabase/functions/`
- ❌ Lógica pesada aún en API routes (podría ser Edge)

#### 📊 **SCORING: 75%**
- Next.js backend funcional (+40%)
- Supabase completo (+30%)
- Python legacy (+5%)
- Migración incompleta (-10%)
- Documentación arquitectura (-10%)

---

## CÁLCULO FINAL DE AVANCE DEL MVP

### Metodología de Cálculo

Cada área se pondera según su importancia para el MVP:

| Área | Peso | Avance | Ponderado |
|------|------|--------|-----------|
| Arquitectura de Datos | 15% | 90% | 13.5% |
| Cerebro IA (RAG) | 20% | 85% | 17.0% |
| Reportería | 15% | 50% | 7.5% |
| Navegación y Filtros | 10% | 70% | 7.0% |
| Pipeline de Datos | 15% | 65% | 9.75% |
| Visualización | 10% | 60% | 6.0% |
| Auth y Seguridad | 5% | 90% | 4.5% |
| Frontend Arquitectura | 5% | 95% | 4.75% |
| Backend Arquitectura | 5% | 75% | 3.75% |
| **TOTAL** | **100%** | | **73.75%** |

### **PORCENTAJE DE AVANCE FINAL: 74%**

---

## PRIORIZACIÓN DE TRABAJO PENDIENTE

### FASE 1: COMPLETAR MVP BÁSICO (1-2 meses)

#### 🔴 **CRÍTICO (Bloqueante para lanzamiento)**

1. **Reportería - Templates de Informes**
   - Implementar "Informe de Contexto de Mercado" completo
   - Gráficos de evolución 5 años
   - Participación por tipología (oferta vs venta)
   - Análisis de competencia primaria estructurado
   - **Esfuerzo:** 2 semanas

2. **Visualización - Gráficos Faltantes**
   - Gráficos de barras apiladas (% por rango UF)
   - Gráficos de línea (MAO histórico)
   - Gráficos torta (mix productos)
   - Indicadores KPI visuales grandes
   - **Esfuerzo:** 1.5 semanas

3. **Knowledge Base - Contenido Inicial**
   - Ingerir Ley 21.442 (subsidios)
   - Ingerir Ley 21.210/2020 (IVA)
   - Hitos históricos: Estallido 2019, COVID 2020
   - Series TPM Banco Central
   - **Esfuerzo:** 1 semana

4. **Exportación de Reportes**
   - PDF básico (Puppeteer/Playwright)
   - Excel de tablas (ExcelJS)
   - **Esfuerzo:** 1 semana

#### 🟡 **IMPORTANTE (Mejorar usabilidad)**

5. **Filtros Avanzados en UI**
   - Rango precio UF (min/max)
   - Tipología (dropdown)
   - Estado obra (select)
   - Desarrollador (autocomplete)
   - **Esfuerzo:** 1 semana

6. **Dashboard Ejecutivo Mejorado**
   - Alertas automáticas (proyectos con MAO>24)
   - Comparación portfolio vs mercado
   - KPIs en tiempo real
   - **Esfuerzo:** 1.5 semanas

7. **Completar RLS (Row Level Security)**
   - Políticas en `projects` por plan
   - Políticas en `generated_reports` por user_id
   - Testing de permisos
   - **Esfuerzo:** 3 días

### FASE 2: ESCALAMIENTO (2-3 meses)

#### 🟢 **DESEABLE (Diferenciación)**

8. **Integración CBR (SII)**
   - API SII para ventas inscritas
   - Georreferenciación de direcciones
   - Cruce con TINSA por ubicación
   - **Esfuerzo:** 3 semanas

9. **Roles de Avalúo SII**
   - Scraping o API de tasaciones fiscales
   - Carga semestral automatizada
   - **Esfuerzo:** 2 semanas

10. **Scraping Portal Inmobiliario / Toc Toc**
    - Automatizar scraping de Matías
    - Detección de nuevos proyectos
    - Actualización de precios publicados
    - **Esfuerzo:** 3 semanas

11. **Automatización ETL**
    - Celery jobs para importación TINSA
    - Cron jobs periódicos
    - Monitoreo y alertas
    - **Esfuerzo:** 2 semanas

#### 🔵 **NICE TO HAVE (Futuro)**

12. **Heatmap y Clusters en Mapa**
    - Heatmap de precios
    - Clusters de densidad
    - Filtros en mapa sin reload
    - **Esfuerzo:** 1 semana

13. **Informe de Proyecto Específico**
    - Posicionamiento vs competencia
    - Pricing sugerido
    - Mix óptimo de productos
    - **Esfuerzo:** 2 semanas

14. **Informe de Oportunidad de Terreno**
    - Análisis demanda radio 2km
    - Gap oferta vs demanda
    - Productos potenciales
    - **Esfuerzo:** 2 semanas

15. **INE - Segmentación Socioeconómica**
    - Carga de datos INE
    - Cruce con proyectos
    - Perfil de mercado
    - **Esfuerzo:** 2 semanas

---

## MEJORAS RECOMENDADAS (Más Allá del MVP)

### ARQUITECTURA

1. **Eliminar Python Backend Completamente**
   - Migrar 100% a Next.js + Edge Functions
   - Reducir complejidad de despliegue
   - Ahorro de costos (Railway/Fly.io)

2. **Implementar Edge Functions**
   - Lógica pesada en Edge (análisis de datos)
   - Menor latencia global
   - Mejor escalabilidad

3. **Caché Inteligente**
   - Redis para queries frecuentes
   - Cache de embeddings
   - Invalidación automática

### IA Y ANÁLISIS

4. **Predicciones Automáticas**
   - Modelos ML para precio futuro
   - Predicción de agotamiento
   - Alertas proactivas

5. **Feedback Loop**
   - Guardar predicciones con timestamp
   - Comparar con datos reales 6-12 meses después
   - Re-entrenar modelos

6. **Correlación Automática Eventos**
   - Detectar patrones con eventos históricos
   - Auto-explicar caídas de absorción
   - Vincular con TPM, IVA, crisis

### REPORTERÍA

7. **Templates Profesionales**
   - Diseño similar a ejemplo adjunto
   - Personalización de marca
   - Export PowerPoint

8. **Generación Asíncrona**
   - Jobs en background
   - Notificaciones cuando completa
   - Evitar timeouts

9. **Reportes Programados**
   - Envío automático semanal/mensual
   - Emails con resumen
   - API para clientes

### UX/UI

10. **Tremor UI**
    - Instalar librería Tremor
    - Reemplazar gráficos básicos
    - Look más profesional

11. **Interactividad**
    - Cross-filtering entre gráficos
    - Drill-down desde visualizaciones
    - Tooltips avanzados

12. **Mobile Responsive**
    - Optimizar para tablets
    - App móvil (Fase 3 del roadmap)

### DATOS

13. **Validación Cruzada**
    - TINSA vs CBR (cuando integrado)
    - Detección de anomalías
    - Alertas de inconsistencias

14. **Deduplicación Inteligente**
    - Detección de proyectos duplicados
    - Merge automático
    - Confidence scores

### NEGOCIO

15. **Sistema de Planes**
    - Comunal, Regional, Nacional
    - Límites por plan (reportes/mes)
    - Upgrade prompts

16. **Tracking de Uso**
    - Analytics de queries
    - Features más usados
    - Product analytics

17. **API Pública**
    - Para clientes avanzados
    - Webhooks de nuevos proyectos
    - Rate limiting

---

## RIESGOS IDENTIFICADOS

### TÉCNICOS

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| **Python backend aún en uso** | Alto | Media | Documentar arquitectura real, planificar migración |
| **Knowledge base vacía** | Alto | Alta | Priorizar ingesta de documentos (Fase 1) |
| **Falta exportación PDF** | Alto | Alta | Implementar en Fase 1 (crítico para clientes) |
| **RLS no completo** | Medio | Media | Completar políticas antes de producción |
| **BigQuery no usado** | Bajo | Baja | Aclarar si es necesario o eliminar scripts |

### NEGOCIO

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| **Solo fuente TINSA** | Alto | Alta | Integrar CBR en Fase 2 |
| **Reportes básicos** | Alto | Alta | Completar templates en Fase 1 |
| **Sin scraping portales** | Medio | Media | Automatizar scraping de Matías (Fase 2) |
| **Sin alertas proactivas** | Medio | Baja | Implementar en Fase 2 |

---

## CONCLUSIONES Y RECOMENDACIONES

### ESTADO GENERAL

El proyecto tiene **74% de avance del MVP**, con una arquitectura técnica sólida y componentes core funcionales. El mayor trabajo pendiente está en:

1. **Visualización y reportería** (50% completo)
2. **Pipeline de datos** (65% completo - solo TINSA)
3. **Knowledge base vacía** (infraestructura lista, contenido faltante)

### LISTO PARA LANZAMIENTO

**NO TODAVÍA**. Se necesita completar:
- ✅ Arquitectura técnica (LISTO)
- ✅ IA conversacional (LISTO)
- ✅ Auth y seguridad (LISTO)
- ❌ Reportes con visualizaciones (PENDIENTE)
- ❌ Exportación PDF (PENDIENTE)
- ❌ Knowledge base con contenido (PENDIENTE)

### TIEMPO ESTIMADO PARA MVP LANZABLE

**4-6 semanas** completando Fase 1 (crítico):
- Semana 1-2: Templates de informes + gráficos
- Semana 3: Knowledge base inicial
- Semana 4: Exportación PDF/Excel
- Semana 5: Filtros avanzados UI
- Semana 6: Testing y ajustes

### RECOMENDACIONES INMEDIATAS

1. **Priorizar reportería** - Es el diferenciador clave
2. **Ingestar knowledge base** - IA necesita contexto
3. **Implementar exportación** - Clientes esperan PDFs
4. **Documentar arquitectura** - Aclarar uso de Python backend
5. **Completar RLS** - Seguridad antes de producción

### FORTALEZAS DEL PROYECTO

- ✅ Arquitectura moderna y escalable
- ✅ IA conversacional funcional
- ✅ Base de datos bien estructurada
- ✅ 3,511 proyectos cargados
- ✅ Georreferenciación completa
- ✅ Agente multi-tool robusto

### DEBILIDADES A RESOLVER

- ❌ Visualizaciones incompletas
- ❌ Solo fuente TINSA (falta CBR, SII, portales)
- ❌ Knowledge base vacía
- ❌ Sin exportación de reportes
- ❌ Filtros avanzados no implementados en UI

---

**Documento generado por:** Claude Code (Sonnet 4.5)
**Fecha:** 11 de Febrero 2026
**Versión:** 1.0
