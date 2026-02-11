# CHECKLIST MVP - FASE 1 (4-6 SEMANAS)
## Plataforma Inmobiliaria NLACE

**Fecha Inicio:** 11 de Febrero 2026
**Fecha Target:** 25 de Marzo 2026
**Estado General:** 74% → Objetivo 95%

---

## SEMANA 1-2: REPORTERÍA Y VISUALIZACIÓN

### 📊 Instalar Tremor UI
- [ ] Instalar dependencia: `npm install @tremor/react`
- [ ] Actualizar `tailwind.config.ts` para incluir Tremor
- [ ] Crear componentes base Tremor (KPI cards, charts)
- [ ] Testing de integración

**Responsable:** Frontend Lead
**Estimación:** 1 día

---

### 📈 Gráficos de Reportes

#### Stacked Bar Chart (Participación por Rango UF)
- [ ] Crear función `prepareStackedBarData()` en `/lib/reports.ts`
- [ ] Implementar componente `StackedBarChart.tsx` con Tremor
- [ ] Integrar en generación de reportes
- [ ] Testing con datos reales

**Data esperada:**
```typescript
[
  { range: '0-2000 UF', oferta: 450, venta: 320 },
  { range: '2000-3000 UF', oferta: 680, venta: 510 },
  { range: '3000-4000 UF', oferta: 420, venta: 280 },
  { range: '4000-5000 UF', oferta: 180, venta: 95 },
  { range: '5000+ UF', oferta: 85, venta: 32 }
]
```

#### Line Chart (Evolución MAO y Stock)
- [ ] Crear función `prepareHistoricalData()` en `/lib/reports.ts`
- [ ] Query a `project_metrics_history` (últimos 6 meses)
- [ ] Implementar componente `HistoricalTrendsChart.tsx`
- [ ] Integrar en reportes

**Data esperada:**
```typescript
[
  { month: '2025-08', mao: 15.2, stock: 1240, precio: 3450 },
  { month: '2025-09', mao: 16.8, stock: 1310, precio: 3480 },
  { month: '2025-10', mao: 18.5, stock: 1405, precio: 3520 },
  { month: '2025-11', mao: 19.2, stock: 1480, precio: 3550 },
  { month: '2025-12', mao: 20.1, stock: 1520, precio: 3590 },
  { month: '2026-01', mao: 21.3, stock: 1590, precio: 3620 }
]
```

#### Donut Chart (Mix de Productos)
- [ ] Crear función `prepareTypologyData()` en `/lib/reports.ts`
- [ ] Implementar componente `TypologyDonutChart.tsx`
- [ ] Integrar en reportes

**Data esperada:**
```typescript
[
  { typology: '1D-1B', count: 245, percentage: 15 },
  { typology: '2D-1B', count: 380, percentage: 23 },
  { typology: '2D-2B', count: 520, percentage: 32 },
  { typology: '3D-2B', count: 340, percentage: 21 },
  { typology: '3D-3B', count: 145, percentage: 9 }
]
```

#### KPI Grid Mejorada
- [ ] Crear componente `KPIGrid.tsx` con Tremor `Metric` y `BadgeDelta`
- [ ] Implementar cálculo de deltas (% cambio vs periodo anterior)
- [ ] Diseño con 4 columnas

**Estimación Total Gráficos:** 3 días

---

### 📄 Template de Reporte Completo

- [ ] Crear tipo `ReportSection` con todas las variantes
  - `text`
  - `kpi_grid`
  - `bar_chart`
  - `stacked_bar`
  - `line_chart`
  - `donut_chart`
  - `table`
  - `map`

- [ ] Implementar `ReportSectionRenderer.tsx`
- [ ] Actualizar `/api/brain/reports/generate` para usar nuevas secciones
- [ ] Implementar función `generateCommuneReport()` completa
- [ ] Testing con comuna real (ej: Ñuñoa)

**Estructura de Informe de Contexto de Mercado:**
1. Texto: Resumen ejecutivo (AI generated)
2. KPI Grid: 4 métricas principales
3. Stacked Bar: Participación por rango UF
4. Line Chart: Evolución MAO y Stock (6 meses)
5. Donut Chart: Mix de productos
6. Table: Competencia primaria (top 10 proyectos)
7. Map: Ubicación de proyectos en la comuna

**Estimación:** 3 días

---

### 🎨 Diseño Visual de Reportes

- [ ] Crear archivo CSS/Tailwind para reportes
- [ ] Paleta de colores consistente (azul, verde, naranja)
- [ ] Tipografía clara (Inter, tamaños definidos)
- [ ] Espaciado consistente
- [ ] Responsive design

**Estimación:** 1 día

**TOTAL SEMANA 1-2:** 8 días

---

## SEMANA 3: KNOWLEDGE BASE

### 📚 Preparar Documentos

#### Leyes
- [ ] Investigar y redactar: Ley 21.442 (subsidios DS1/DS19)
  - Montos de subsidio
  - Requisitos
  - Rangos de precios
  - Impacto en mercado

- [ ] Investigar y redactar: Ley 21.210/2020 (IVA viviendas)
  - Umbrales (2000 UF, 140m²)
  - Cálculo de impacto
  - Datos históricos pre/post ley

- [ ] Investigar y redactar: Ley 20.780/2014 (reforma tributaria)
  - Cambios relevantes para inmobiliario

**Fuentes:**
- Diario Oficial
- Ministerio de Vivienda
- SII

**Estimación:** 1.5 días

#### Hitos Históricos
- [ ] Redactar: Estallido Social 2019
  - Fechas clave
  - Sectores afectados
  - Métricas de impacto (absorción, MAO, ventas)
  - Duración de efecto

- [ ] Redactar: Pandemia COVID-19 (2020-2021)
  - Fases (shock, adaptación, boom, normalización)
  - Métricas por fase
  - Cambios permanentes (digitalización, preferencias)

- [ ] Redactar: Terremoto 2010 (opcional, menor prioridad)

**Fuentes:**
- Informes CChC
- TINSA historical data
- Papers académicos

**Estimación:** 1.5 días

#### Macroeconomía
- [ ] Compilar: Series TPM 2019-2026
- [ ] Compilar: Series UF históricas
- [ ] Calcular: Impacto TPM en dividendo hipotecario
- [ ] Redactar: Correlaciones TPM vs ventas

**Fuentes:**
- Banco Central de Chile
- INE

**Estimación:** 1 día

---

### 🤖 Ingesta en Vector Store

- [ ] Crear script `/scripts/ingest-knowledge-base.ts`
- [ ] Estructurar cada documento con metadata
  - `source`
  - `type` (ley, hito_historico, macro, estudio)
  - `date`
  - `topic` (array de tags)

- [ ] Generar embeddings con OpenAI
- [ ] Insertar en `knowledge_docs` table
- [ ] Verificar con queries de prueba

**Queries de prueba:**
- "¿Qué pasó en el estallido social?"
- "¿Cuánto es el subsidio DS1?"
- "¿Cómo afecta la TPM alta a las ventas?"

**Estimación:** 1 día

**TOTAL SEMANA 3:** 5 días

---

## SEMANA 4: EXPORTACIÓN PDF

### 📥 Backend de Exportación

- [ ] Instalar dependencias:
  ```bash
  npm install puppeteer @sparticuz/chromium-min
  npm install -D @types/puppeteer
  ```

- [ ] Crear API route `/api/brain/reports/[id]/export/route.ts`
- [ ] Implementar función `generateReportHTML()`
- [ ] Implementar función `renderSectionsToHTML()`
- [ ] Configurar Puppeteer con Chromium

**Estimación:** 2 días

---

### 🎨 Diseño HTML/CSS para PDF

- [ ] Crear template HTML base
- [ ] Estilos CSS inline para PDF
  - Tipografía
  - Colores
  - Tablas
  - Gráficos (como imágenes)

- [ ] Testing de paginación (evitar cortes)
- [ ] Header/Footer con logo y fecha

**Estimación:** 1.5 días

---

### 📊 Renderizado de Gráficos en PDF

**Opción A: Screenshots (más simple)**
- [ ] Implementar función para capturar gráficos como PNG
- [ ] Insertar imágenes en HTML

**Opción B: SVG estático (mejor calidad)**
- [ ] Generar gráficos como SVG
- [ ] Inline SVG en HTML

**Estimación:** 1 día

---

### 🔗 Integración Frontend

- [ ] Botón "Descargar PDF" en `/dashboard/reports/[id]`
- [ ] Loading state durante generación
- [ ] Error handling
- [ ] Testing con diferentes tipos de reporte

**Estimación:** 0.5 días

**TOTAL SEMANA 4:** 5 días

---

## SEMANA 5: FILTROS AVANZADOS + ALERTAS

### 🔍 Componente de Filtros

- [ ] Crear `ProjectFilters.tsx`
- [ ] Implementar filtros:
  - Región (Select)
  - Comuna (Autocomplete)
  - Rango precio UF (min/max)
  - Tipología (Select)
  - Estado de obra (Select)
  - Desarrollador (Autocomplete)
  - MAO (min/max)

- [ ] Crear `CommuneAutocomplete.tsx`
- [ ] Crear `DeveloperAutocomplete.tsx`
- [ ] Botón "Limpiar filtros"

**Estimación:** 2 días

---

### 🔗 Integración con ProjectsTable

- [ ] Actualizar query Supabase con filtros dinámicos
- [ ] TanStack Query con `queryKey` incluyendo filtros
- [ ] Testing de todas las combinaciones
- [ ] Persistencia de filtros en URL params (opcional)

**Estimación:** 1 día

---

### 🚨 Sistema de Alertas

- [ ] Crear `/lib/alerts.ts`
- [ ] Implementar funciones de detección:
  - `detectHighMAOProjects()`
  - `detectLowAbsorption()`
  - `detectHighStockLowSales()`
  - `detectOverpricedProjects()`

- [ ] Crear componente `MarketAlerts.tsx`
- [ ] Integrar en `/dashboard` page
- [ ] Auto-refresh cada 5 minutos

**Estimación:** 1.5 días

---

### 📊 Dashboard Ejecutivo Mejorado

- [ ] Sección de alertas prominente
- [ ] KPIs con deltas (cambio vs periodo anterior)
- [ ] Links accionables desde alertas

**Estimación:** 0.5 días

**TOTAL SEMANA 5:** 5 días

---

## SEMANA 6: TESTING + SEGURIDAD + AJUSTES

### 🔒 Completar RLS

- [ ] Crear migration `20260212000000_complete_rls.sql`
- [ ] Habilitar RLS en `projects`
- [ ] Política básica de lectura
- [ ] Actualizar políticas en `generated_reports`
  - `users_view_own_reports`
  - `users_insert_own_reports`
  - `users_update_own_reports`
  - `admins_delete_reports`

- [ ] Crear tabla `user_plans` (para futuro)
- [ ] Función `user_can_access_project()`
- [ ] Testing de políticas

**Estimación:** 1.5 días

---

### 🧪 Testing Funcional

#### Reportería
- [ ] Generar reporte COMMUNE_MARKET (Ñuñoa)
- [ ] Generar reporte AREA_POLYGON (polígono custom)
- [ ] Generar reporte MULTI_COMMUNE_COMPARISON (3 comunas)
- [ ] Verificar todas las visualizaciones
- [ ] Exportar PDF de cada tipo
- [ ] Validar contenido y formato

#### IA
- [ ] Preguntas sobre leyes (subsidios, IVA)
- [ ] Preguntas sobre hitos (estallido, COVID)
- [ ] Preguntas sobre macroeconomía (TPM)
- [ ] Verificar sources correctas
- [ ] Timing de respuestas (<5 segundos)

#### Filtros
- [ ] Filtrar por cada campo individual
- [ ] Filtrar con múltiples campos simultáneos
- [ ] Limpiar filtros
- [ ] Verificar query performance

#### Alertas
- [ ] Verificar detección correcta de cada tipo
- [ ] Links accionables funcionando
- [ ] Auto-refresh

**Estimación:** 1.5 días

---

### 🐛 Bug Fixing

- [ ] Revisar lista de bugs conocidos
- [ ] Fix de issues encontrados en testing
- [ ] Optimización de queries lentas
- [ ] Error handling mejorado

**Estimación:** 1 día

---

### 📚 Documentación

- [ ] README actualizado
- [ ] Guía de uso para clientes (screenshots)
- [ ] Documentación de API (si aplica)
- [ ] Notas de release

**Estimación:** 1 día

**TOTAL SEMANA 6:** 5 días

---

## RESUMEN DE ESFUERZO

| Semana | Foco | Días Hábiles | Días Calendario |
|--------|------|--------------|-----------------|
| 1-2 | Reportería y Visualización | 8 | 14 |
| 3 | Knowledge Base | 5 | 7 |
| 4 | Exportación PDF | 5 | 7 |
| 5 | Filtros + Alertas | 5 | 7 |
| 6 | Testing + Seguridad | 5 | 7 |
| **TOTAL** | | **28 días** | **~6 semanas** |

---

## CRITERIOS DE ACEPTACIÓN (DEFINITION OF DONE)

### Reportería
- ✅ Informe de Contexto de Mercado completo con 7 secciones
- ✅ Todos los gráficos (stacked bar, line, donut) funcionales
- ✅ Exportación PDF profesional
- ✅ Exportación Excel de tablas
- ✅ Tiempo de generación < 2 minutos

### IA
- ✅ Knowledge base con 10+ documentos ingresados
- ✅ Respuestas incluyen contexto histórico relevante
- ✅ Sources citadas correctamente
- ✅ Precision > 85% en preguntas de prueba

### UX
- ✅ Filtros avanzados todos funcionales
- ✅ Alertas automáticas en dashboard
- ✅ Tremor UI integrado
- ✅ Responsive design en móviles/tablets

### Seguridad
- ✅ RLS completo en tablas sensibles
- ✅ Testing de políticas pasando
- ✅ No hay vulnerabilidades conocidas

### Testing
- ✅ Todas las funcionalidades críticas testeadas
- ✅ Bug list vacía
- ✅ Performance aceptable (<3s carga páginas)

---

## SEGUIMIENTO SEMANAL

### Template de Reporte Semanal

```markdown
## Reporte Semana X (DD/MM - DD/MM)

### ✅ Completado
- Tarea 1
- Tarea 2

### 🚧 En Progreso
- Tarea 3 (70% completo)

### ⚠️ Bloqueado
- Tarea 4 (esperando X)

### 📊 Métricas
- Tasks completadas: X/Y
- Bugs encontrados: Z
- Avance total: XX%

### 🎯 Plan Próxima Semana
- Prioridad 1
- Prioridad 2
```

---

## CONTACTOS Y RESPONSABLES

**Project Manager:** [Nombre]
**Frontend Lead:** [Nombre]
**Backend/IA Lead:** [Nombre]
**QA:** [Nombre]

**Stakeholders:**
- María José Suárez
- Matías D.R.

**Meetings:**
- Daily Standup: 10:00 AM (15 min)
- Weekly Review: Viernes 16:00 (1 hora)

---

**Fecha Creación:** 11 de Febrero 2026
**Última Actualización:** 11 de Febrero 2026
**Próxima Revisión:** 18 de Febrero 2026
