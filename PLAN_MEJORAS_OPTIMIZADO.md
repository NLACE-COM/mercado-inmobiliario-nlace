# PLAN DE MEJORAS TÉCNICO
## Estrategia: Quick Wins + Máximo Impacto

**Fecha:** 11 de Febrero 2026
**Objetivo:** Llevar MVP de 74% a 95%
**Método:** Priorización por Impacto/Esfuerzo

---

## 📊 MATRIZ DE PRIORIZACIÓN

```
        │ ALTO IMPACTO
        │
  QUICK │ 🟢 1. Instalar Tremor UI
  WINS  │ 🟢 2. Knowledge Base Inicial
        │ 🟢 3. KPI Cards Mejoradas
        │ 🟢 4. Alertas Automáticas
        │ 🟢 5. Gráficos Básicos Tremor
  ──────┼────────────────────────────────
  BAJO  │
  ESFUER│ 🟡 6. Exportación PDF Simple
  ZO    │ 🟡 7. Filtros UI Esenciales
        │ 🔵 8. Tabla Competencia
═══════════════════════════════════════════
        │
  MAJOR │ 🟠 9. Template Reporte Completo
  PROJE │ 🟠 10. Filtros Completos
  CTS   │
        │
  ──────┼────────────────────────────────
  ALTO  │
  ESFUER│ ⚫ Integración CBR (Fase 2)
  ZO    │ ⚫ Scraping Portales (Fase 2)
        │
        │ BAJO IMPACTO (corto plazo)
```

---

## 🎯 CRITERIOS DE IMPACTO

### Alto Impacto = Afecta directamente a:
1. **Funcionalidad core** del producto
2. **UX y visualización** de datos
3. **Calidad de insights** generados por IA
4. **Usabilidad** del sistema
5. **Rendimiento** y eficiencia

### Bajo Esfuerzo =
- Sin dependencias bloqueantes
- Código bien localizado
- Riesgo técnico bajo
- Librería/solución probada

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **FASE 1: QUICK WINS + MEJORAS VISUALES**

#### 🟢 Tarea 1: Tremor UI + KPI Cards Mejoradas
**Impacto:** ⭐⭐⭐⭐⭐ (Muy Alto)
**Esfuerzo:** ⚡ (Muy Bajo)

**Justificación técnica:**
- Actualización de librería de componentes UI
- Afecta todas las vistas (dashboard, analytics, reportes)
- Cero riesgo (solo cambio de dependencia)
- Mejora consistencia visual

**Tareas técnicas:**
```bash
# 1. Instalación de dependencia
npm install @tremor/react

# 2. Configuración de Tailwind
# Actualizar tailwind.config.ts
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
]

# 3. Actualizar KPI Cards en /dashboard/page.tsx
- Card → Tremor Card
- Agregar Metric, Text, BadgeDelta
- Implementar cálculo de deltas (% vs mes anterior)

# 4. Migrar MarketOverviewChart
- Recharts BarChart → Tremor BarChart
- Actualizar paleta de colores
- Implementar ValueFormatter

# 5. Migrar PriceDistributionChart
- Implementar con Tremor BarChart

# 6. Testing visual y funcional
```

**Output:**
- Dashboard con look premium inmediatamente
- KPIs con deltas (ej: +12% vs mes anterior)
- Gráficos más profesionales

**Archivos a modificar:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/MarketOverviewChart.tsx`
- `frontend/src/components/PriceDistributionChart.tsx`
- `frontend/tailwind.config.ts`

---

#### 🟢 Tarea 2: Knowledge Base Inicial
**Impacto:** ⭐⭐⭐⭐⭐ (Muy Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Implementación de RAG (Retrieval Augmented Generation)
- Mejora significativa de calidad de respuestas del LLM
- Sin conocimiento contextual, el modelo da respuestas genéricas
- Base de datos vectorial con embeddings

**Enfoque:** 5 documentos esenciales iniciales

**Subtarea 2.1: Preparación de contenido**
```markdown
Documento 1: Ley 21.210/2020 - IVA Viviendas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contenido clave:
- Vigencia: Enero 2021
- Umbral: >2000 UF Y >140m²
- IVA: 19% sobre precio
- Impacto: Vivienda 4000 UF → +760 UF
- Consecuencias: Caída 50% ventas segmento >4000 UF
- Fuente: Ley 21.210/2020 Diario Oficial

Documento 2: Ley 21.442 - Subsidios DS1/DS19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- DS1 (Clase Media): Hasta 50 UF (viviendas 2000-2400 UF)
- DS19 (Vulnerables): Hasta 600 UF (viviendas hasta 1200 UF)
- Impacto: Impulsa demanda en rango 2000-3500 UF
- Fuente: MINVU

Documento 3: Estallido Social 2019
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fecha: 18 octubre 2019
- Duración impacto: 18 meses
- Absorción: De 12.5% → 7.8% (caída 37%)
- MAO: De 9.2 → 18.3 meses
- Sectores afectados: Santiago Centro (-35%), Providencia (-28%)
- Fuente: CChC + TINSA

Documento 4: COVID-19 Pandemia (2020-2021)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fases:
- Shock (Mar-Jun 2020): Ventas -67%
- Boom (Ene-Jun 2021): Ventas +45% (TPM 0.5%, retiros AFP)
- Normalización (Jul 2021+): TPM sube, absorción baja
Cambios permanentes: Terrazas, home office, digitalización
Fuente: CChC + BCCh

Documento 5: TPM y Crédito Hipotecario
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Histórico TPM:
- 2020: 0.5% (mínimo histórico)
- Oct 2022: 11.25% (peak)
- Feb 2026: ~4.0% (actual)

Impacto en dividendo (crédito 3000 UF / 20 años):
- TPM 0.5%: ~9.5 UF/mes
- TPM 11.25%: ~19.2 UF/mes (+102%)

Elasticidad: +1% TPM → -8% ventas
Fuente: Banco Central Chile
```

**Subtarea 2.2: Ingesta en vector store**
```typescript
// scripts/ingest-knowledge-quick.ts
const documents = [
  {
    content: `[Contenido Ley IVA]`,
    metadata: {
      source: 'Ley 21.210/2020',
      type: 'ley',
      date: '2020-02-24',
      topic: ['iva', 'impuestos', 'vivienda_premium']
    }
  },
  // ... otros 4 documentos
]

// Generar embeddings e insertar
for (const doc of documents) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: doc.content
  })

  await supabase.from('knowledge_docs').insert({
    content: doc.content,
    metadata: doc.metadata,
    embedding: embedding.data[0].embedding
  })
}
```

**Subtarea 2.3: Testing y validación**
```
Queries de prueba:
1. "¿Por qué bajó la demanda en viviendas sobre 4000 UF en 2021?"
   → Debe mencionar Ley IVA

2. "¿Qué pasó durante el estallido social con las ventas?"
   → Debe citar caída 37%, MAO 18 meses

3. "¿Cómo afecta la TPM alta a las ventas?"
   → Debe explicar elasticidad -8%
```

**Resultado esperado:**
- Sistema RAG funcional con vector search
- Respuestas con contexto específico de mercado chileno
- Citations de fuentes correctas

---

#### 🟢 Tarea 3: Sistema de Alertas Automáticas
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Procesamiento automático de métricas
- Detección de anomalías y thresholds
- Sistema de notificaciones proactivas
- Lógica de negocio + componentes UI

**Implementación:**

```typescript
// frontend/src/lib/alerts.ts (2h)
export async function generateMarketAlerts(): Promise<Alert[]> {
  const { data: projects } = await supabase
    .from('projects')
    .select('*')

  const alerts: Alert[] = []

  // Alerta 1: MAO alto (>24 meses)
  const highMAO = projects.filter(p => p.months_to_sell_out > 24)
  if (highMAO.length > 0) {
    alerts.push({
      type: 'warning',
      title: `${highMAO.length} proyectos con MAO >24 meses`,
      description: 'Alto riesgo de sobresaturación',
      actionable: { label: 'Ver proyectos', href: '/dashboard/projects?mao=high' }
    })
  }

  // Alerta 2: Absorción baja (<5%)
  const avgAbsorption = calculateAvgAbsorption(projects)
  if (avgAbsorption < 5) {
    alerts.push({
      type: 'critical',
      title: 'Absorción bajo 5% - Mercado en contracción',
      description: `Actual: ${avgAbsorption.toFixed(1)}%. Normal: 8-12%`
    })
  }

  // Alerta 3: Stock alto + ventas bajas
  const stagnant = projects.filter(p =>
    p.available_units / p.total_units > 0.7 &&
    p.sales_speed_monthly < 2
  )
  if (stagnant.length > 0) {
    alerts.push({
      type: 'warning',
      title: `${stagnant.length} proyectos estancados`,
      description: '>70% stock + <2 ventas/mes'
    })
  }

  return alerts
}
```

```typescript
// frontend/src/components/MarketAlerts.tsx (2h)
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card } from '@tremor/react'

export function MarketAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['market-alerts'],
    queryFn: generateMarketAlerts,
    refetchInterval: 5 * 60 * 1000
  })

  if (!alerts?.length) {
    return <Card>✓ No hay alertas de mercado</Card>
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <Alert key={alert.id} variant={alert.type}>
          <AlertTriangle />
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>
            {alert.description}
            {alert.actionable && (
              <Button variant="link" onClick={() => router.push(alert.actionable.href)}>
                {alert.actionable.label} →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
```

```typescript
// Integrar en dashboard (30min)
// frontend/src/app/dashboard/page.tsx
<div className="mb-6">
  <h2 className="text-2xl font-bold mb-4">🚨 Alertas de Mercado</h2>
  <MarketAlerts />
</div>
```

**Resultado esperado:**
- Dashboard con sistema de alertas en tiempo real
- Detección automática de anomalías
- Links accionables a vistas detalladas

---

#### 🟢 Tarea 4: Gráficos Adicionales con Tremor
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Gráficos a implementar:**

**1. Donut Chart - Mix de Productos (3h)**
```typescript
// frontend/src/components/charts/ProductMixChart.tsx
import { DonutChart } from '@tremor/react'

export function ProductMixChart({ projects }: { projects: Project[] }) {
  const data = [
    { typology: '1D-1B', count: projects.filter(p => p.property_type?.includes('1D-1B')).length },
    { typology: '2D-1B', count: projects.filter(p => p.property_type?.includes('2D-1B')).length },
    { typology: '2D-2B', count: projects.filter(p => p.property_type?.includes('2D-2B')).length },
    { typology: '3D-2B', count: projects.filter(p => p.property_type?.includes('3D-2B')).length },
    { typology: '3D-3B', count: projects.filter(p => p.property_type?.includes('3D-3B')).length }
  ]

  return (
    <DonutChart
      data={data}
      category="count"
      index="typology"
      valueFormatter={v => `${v} proyectos`}
      colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
    />
  )
}
```

**2. Line Chart - Tendencias Históricas (4h)**
```typescript
// frontend/src/components/charts/HistoricalTrendsChart.tsx
import { LineChart } from '@tremor/react'

export function HistoricalTrendsChart({ commune }: { commune: string }) {
  const { data } = useQuery({
    queryKey: ['historical-trends', commune],
    queryFn: async () => {
      // Query a project_metrics_history
      const { data } = await supabase
        .from('project_metrics_history')
        .select('recorded_at, stock, sold_accumulated, months_to_sell_out, price_avg_uf')
        .eq('commune', commune)
        .gte('recorded_at', sixMonthsAgo)
        .order('recorded_at', { ascending: true })

      return data
    }
  })

  return (
    <LineChart
      data={data}
      index="recorded_at"
      categories={['stock', 'months_to_sell_out', 'price_avg_uf']}
      colors={['blue', 'orange', 'green']}
      valueFormatter={(value) => value.toLocaleString()}
      yAxisWidth={48}
    />
  )
}
```

**3. Stacked Bar - Participación por Rango UF (4h)**
```typescript
// frontend/src/components/charts/PriceRangeChart.tsx
import { BarChart } from '@tremor/react'

export function PriceRangeChart({ projects }: { projects: Project[] }) {
  const ranges = ['0-2000', '2000-3000', '3000-4000', '4000-5000', '5000+']

  const data = ranges.map(range => {
    const [min, max] = parseRange(range)
    const filtered = projects.filter(p =>
      p.avg_price_uf >= min && (max ? p.avg_price_uf < max : true)
    )

    return {
      range,
      oferta: filtered.reduce((sum, p) => sum + p.available_units, 0),
      vendidas: filtered.reduce((sum, p) => sum + p.sold_units, 0)
    }
  })

  return (
    <BarChart
      data={data}
      index="range"
      categories={['oferta', 'vendidas']}
      colors={['blue', 'green']}
      stack={true}
      valueFormatter={v => `${v} unidades`}
    />
  )
}
```

**Integración en Analytics:**
```typescript
// frontend/src/app/dashboard/analytics/page.tsx
<div className="grid grid-cols-2 gap-6">
  <Card>
    <Title>Mix de Productos</Title>
    <ProductMixChart projects={projects} />
  </Card>

  <Card>
    <Title>Participación por Rango de Precio</Title>
    <PriceRangeChart projects={projects} />
  </Card>

  <Card className="col-span-2">
    <Title>Evolución Histórica - Ñuñoa</Title>
    <HistoricalTrendsChart commune="ÑUÑOA" />
  </Card>
</div>
```

**Resultado esperado:**
- 3 nuevos tipos de gráficos (DonutChart, LineChart, BarChart stacked)
- Página de analytics mejorada
- Visualización de datos más clara

---

### **RESUMEN FASE 1:**
| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 1 | Tremor UI + KPI Cards | ⭐⭐⭐⭐⭐ | ⚡ |
| 2 | Knowledge Base (5 docs) | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| 3 | Alertas Automáticas | ⭐⭐⭐⭐ | ⚡⚡ |
| 4 | Gráficos Tremor (3 tipos) | ⭐⭐⭐⭐ | ⚡⚡ |

**Avance:** 74% → **82%** (+8%)

---

## **FASE 2: REPORTERÍA + EXPORTACIÓN**

#### 🟡 Tarea 5: Sistema de Exportación PDF
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Feature requerida para compartir reportes
- Solución client-side simple (jsPDF + html2canvas)
- Sin complejidad de servidor

**Opción SIMPLE: jsPDF + html2canvas (client-side)**
```typescript
// frontend/src/lib/pdf-export.ts (4h)
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportReportToPDF(reportId: string, title: string) {
  // 1. Obtener elemento HTML del reporte
  const reportElement = document.getElementById('report-content')

  // 2. Convertir a canvas
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    logging: false,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  // 3. Generar PDF
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')

  const pdfWidth = 210
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  // Si es muy largo, dividir en páginas
  let heightLeft = pdfHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
  heightLeft -= 297 // altura A4

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= 297
  }

  // 4. Descargar
  pdf.save(`reporte-${title}-${new Date().toISOString().split('T')[0]}.pdf`)
}
```

```typescript
// frontend/src/app/dashboard/reports/[id]/page.tsx (2h)
import { Download } from 'lucide-react'
import { exportReportToPDF } from '@/lib/pdf-export'

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { data: report } = useQuery({
    queryKey: ['report', params.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', params.id)
        .single()
      return data
    }
  })

  const handleExport = async () => {
    await exportReportToPDF(report.id, report.title)
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1>{report.title}</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      <div id="report-content" className="bg-white p-8">
        {/* Render sections */}
      </div>
    </div>
  )
}
```

**Instalación de dependencias:**
```bash
npm install jspdf html2canvas
npm install -D @types/jspdf
```

**Testing necesario:**
- Exportar reporte de múltiples páginas
- Verificar paginación automática
- Validar resolución de imágenes en PDF

**Resultado esperado:**
- Sistema de exportación PDF funcional
- Descarga client-side
- Manejo correcto de multi-página

---

#### 🟡 Tarea 6: Sistema de Filtros UI
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Mejora significativa de UX
- Queries filtradas en base de datos
- Reducción de carga de datos
- Componentes reutilizables

**Filtros a implementar:**

**1. Rango de Precio (2h)**
```typescript
// frontend/src/components/filters/PriceRangeFilter.tsx
export function PriceRangeFilter({ onChange }: { onChange: (min: number, max: number) => void }) {
  const [min, setMin] = useState<number>()
  const [max, setMax] = useState<number>()

  return (
    <div>
      <Label>Precio (UF)</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={e => {
            setMin(Number(e.target.value))
            onChange(Number(e.target.value), max)
          }}
        />
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={e => {
            setMax(Number(e.target.value))
            onChange(min, Number(e.target.value))
          }}
        />
      </div>
    </div>
  )
}
```

**2. Tipología (1.5h)**
```typescript
// frontend/src/components/filters/TypologyFilter.tsx
export function TypologyFilter({ onChange }: { onChange: (typ: string) => void }) {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Todas las tipologías" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todas</SelectItem>
        <SelectItem value="1D-1B">1D-1B</SelectItem>
        <SelectItem value="2D-1B">2D-1B</SelectItem>
        <SelectItem value="2D-2B">2D-2B</SelectItem>
        <SelectItem value="3D-2B">3D-2B</SelectItem>
        <SelectItem value="3D-3B">3D-3B</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

**3. Estado de Obra (1h)**
```typescript
export function ProjectStatusFilter({ onChange }: { onChange: (status: string) => void }) {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Todos los estados" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todos</SelectItem>
        <SelectItem value="En Blanco">En Blanco</SelectItem>
        <SelectItem value="En Verde">En Verde</SelectItem>
        <SelectItem value="Entrega Inmediata">Entrega Inmediata</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

**4. Panel de Filtros Integrado (4h)**
```typescript
// frontend/src/components/ProjectFiltersPanel.tsx
export function ProjectFiltersPanel({ onFiltersChange }: {
  onFiltersChange: (filters: ProjectFilters) => void
}) {
  const [filters, setFilters] = useState<ProjectFilters>({})

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Región</Label>
          <RegionFilter onChange={v => updateFilter('region', v)} />
        </div>
        <PriceRangeFilter onChange={(min, max) => {
          updateFilter('minPrice', min)
          updateFilter('maxPrice', max)
        }} />
        <TypologyFilter onChange={v => updateFilter('typology', v)} />
        <ProjectStatusFilter onChange={v => updateFilter('status', v)} />
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          setFilters({})
          onFiltersChange({})
        }}
      >
        Limpiar Filtros
      </Button>
    </Card>
  )
}
```

**5. Integrar en ProjectsTable (2h)**
```typescript
// frontend/src/app/dashboard/projects/page.tsx
export default function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({})

  const { data: projects } = useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase.from('projects').select('*')

      if (filters.region) query = query.eq('region', filters.region)
      if (filters.minPrice) query = query.gte('avg_price_uf', filters.minPrice)
      if (filters.maxPrice) query = query.lte('avg_price_uf', filters.maxPrice)
      if (filters.typology) query = query.ilike('property_type', `%${filters.typology}%`)
      if (filters.status) query = query.eq('project_status', filters.status)

      const { data } = await query
      return data
    }
  })

  return (
    <div>
      <ProjectFiltersPanel onFiltersChange={setFilters} />
      <ProjectsTable projects={projects} />
    </div>
  )
}
```

**Resultado esperado:**
- 4 filtros esenciales funcionando (Región, Precio, Tipología, Estado)
- Panel de filtros integrado
- Query optimization con filtros en DB
- Función de limpiar filtros

---

#### 🔵 Tarea 7: Tabla de Análisis Competitivo
**Impacto:** ⭐⭐⭐ (Medio-Alto)
**Esfuerzo:** ⚡ (Muy Bajo)

**Justificación técnica:**
- Componente de tabla avanzada con Tremor
- Sorting y badges condicionales
- Visualización comparativa de proyectos

```typescript
// frontend/src/components/reports/CompetitorTable.tsx (4h)
import { Table } from '@tremor/react'

export function CompetitorTable({ projects }: { projects: Project[] }) {
  // Top 10 competidores por stock
  const competitors = projects
    .sort((a, b) => b.available_units - a.available_units)
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      developer: p.developer,
      stock: p.available_units,
      sold: p.sold_units,
      price: p.avg_price_uf,
      priceM2: p.avg_price_m2_uf,
      mao: p.months_to_sell_out,
      salesSpeed: p.sales_speed_monthly,
      deliveryDate: p.delivery_date
    }))

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Proyecto</TableHeaderCell>
          <TableHeaderCell>Desarrollador</TableHeaderCell>
          <TableHeaderCell>Stock</TableHeaderCell>
          <TableHeaderCell>Vendidas</TableHeaderCell>
          <TableHeaderCell>Precio UF</TableHeaderCell>
          <TableHeaderCell>UF/m²</TableHeaderCell>
          <TableHeaderCell>MAO</TableHeaderCell>
          <TableHeaderCell>Velocidad</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {competitors.map(comp => (
          <TableRow key={comp.name}>
            <TableCell>{comp.name}</TableCell>
            <TableCell>{comp.developer}</TableCell>
            <TableCell>{comp.stock}</TableCell>
            <TableCell>
              <Badge color={comp.sold > 50 ? 'green' : 'orange'}>
                {comp.sold}
              </Badge>
            </TableCell>
            <TableCell>{comp.price?.toFixed(0)} UF</TableCell>
            <TableCell>{comp.priceM2?.toFixed(1)}</TableCell>
            <TableCell>
              <Badge color={comp.mao > 24 ? 'red' : comp.mao > 12 ? 'yellow' : 'green'}>
                {comp.mao?.toFixed(1)} meses
              </Badge>
            </TableCell>
            <TableCell>{comp.salesSpeed?.toFixed(1)} u/mes</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Integración en sistema de reportes:**
```typescript
// En generación de reporte
sections.push({
  type: 'custom',
  component: 'CompetitorTable',
  data: { projects: communeProjects }
})
```

**Resultado esperado:**
- Tabla con top 10 competidores
- Badges de colores según métricas (MAO, ventas)
- Sorting integrado

---

#### 🟠 Tarea 8: Template de Reportes Completo
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡⚡ (Medio)

**Justificación técnica:**
- Sistema de generación de reportes multi-sección
- Integración de LLM para resúmenes
- Queries complejas agregando datos históricos
- Componente renderer modular

```typescript
// frontend/src/app/api/brain/reports/generate/route.ts (8h)
async function generateCommuneMarketReport(commune: string) {
  // 1. Fetch datos
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('commune', commune)

  const { data: historical } = await supabase
    .from('project_metrics_history')
    .select('*')
    .in('project_id', projects.map(p => p.id))
    .gte('recorded_at', sixMonthsAgo)

  // 2. Calcular métricas
  const metrics = {
    totalProjects: projects.length,
    totalUnits: sum(projects, 'total_units'),
    availableUnits: sum(projects, 'available_units'),
    soldUnits: sum(projects, 'sold_units'),
    avgPrice: avg(projects, 'avg_price_uf'),
    avgPriceM2: avg(projects, 'avg_price_m2_uf'),
    avgMAO: avg(projects, 'months_to_sell_out'),
    avgSalesSpeed: avg(projects, 'sales_speed_monthly'),
    absorption: (sum(projects, 'sales_speed_monthly') / sum(projects, 'available_units')) * 100
  }

  // 3. Generar resumen con IA
  const aiSummary = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'Eres un analista inmobiliario experto en Chile.'
    }, {
      role: 'user',
      content: `
Genera un resumen ejecutivo de 3 párrafos sobre el mercado inmobiliario en ${commune}.

Datos:
- ${metrics.totalProjects} proyectos
- ${metrics.availableUnits} unidades disponibles
- Precio promedio: ${metrics.avgPrice} UF
- MAO promedio: ${metrics.avgMAO} meses
- Absorción: ${metrics.absorption.toFixed(1)}%

Incluye:
1. Estado general del mercado
2. Principales insights
3. Recomendaciones
      `
    }]
  })

  // 4. Construir reporte
  const sections: ReportSection[] = [
    {
      type: 'text',
      content: `# Análisis de Mercado: ${commune}\n\n${aiSummary.choices[0].message.content}`
    },
    {
      type: 'kpi_grid',
      kpis: [
        { label: 'Total Proyectos', value: metrics.totalProjects.toString() },
        { label: 'Stock Disponible', value: metrics.availableUnits.toString(), delta: '+12%', deltaType: 'increase' },
        { label: 'Precio Promedio', value: `${metrics.avgPrice.toFixed(0)} UF` },
        { label: 'Absorción', value: `${metrics.absorption.toFixed(1)}%`, delta: metrics.absorption > 8 ? 'Normal' : 'Bajo', deltaType: metrics.absorption > 8 ? 'neutral' : 'decrease' }
      ]
    },
    {
      type: 'chart',
      chartType: 'stacked_bar',
      title: 'Participación por Rango de Precio',
      data: preparePriceRangeData(projects)
    },
    {
      type: 'chart',
      chartType: 'line',
      title: 'Evolución Histórica (6 meses)',
      data: prepareHistoricalData(historical)
    },
    {
      type: 'chart',
      chartType: 'donut',
      title: 'Mix de Productos',
      data: prepareTypologyData(projects)
    },
    {
      type: 'table',
      title: 'Competencia Primaria (Top 10)',
      data: prepareCompetitorData(projects)
    },
    {
      type: 'map',
      title: 'Ubicación de Proyectos',
      projects: projects
    }
  ]

  // 5. Guardar en DB
  const { data: report } = await supabase
    .from('generated_reports')
    .insert({
      title: `Mercado ${commune} - ${new Date().toLocaleDateString()}`,
      report_type: 'COMMUNE_MARKET',
      parameters: { commune },
      content: { sections },
      status: 'completed',
      user_id: userId
    })
    .select()
    .single()

  return report
}
```

**Componente de Render (4h):**
```typescript
// frontend/src/components/reports/ReportRenderer.tsx
export function ReportRenderer({ sections }: { sections: ReportSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section, idx) => {
        switch (section.type) {
          case 'text':
            return <div key={idx} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(section.content) }} />

          case 'kpi_grid':
            return (
              <div key={idx} className="grid grid-cols-4 gap-4">
                {section.kpis.map(kpi => (
                  <Card key={kpi.label}>
                    <Text>{kpi.label}</Text>
                    <Metric>{kpi.value}</Metric>
                    {kpi.delta && <BadgeDelta deltaType={kpi.deltaType}>{kpi.delta}</BadgeDelta>}
                  </Card>
                ))}
              </div>
            )

          case 'chart':
            return <ChartRenderer key={idx} {...section} />

          case 'table':
            return <CompetitorTable key={idx} data={section.data} />

          case 'map':
            return <MapboxMap key={idx} projects={section.projects} />
        }
      })}
    </div>
  )
}
```

**Resultado esperado:**
- Template de reporte "Contexto de Mercado" con 7 secciones
- Resumen ejecutivo generado por LLM
- Integración de todos los componentes visuales

---

### **RESUMEN FASE 2:**
| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 5 | Exportación PDF | ⭐⭐⭐⭐ | ⚡⚡ |
| 6 | Filtros UI Esenciales | ⭐⭐⭐⭐ | ⚡⚡ |
| 7 | Tabla Competencia | ⭐⭐⭐ | ⚡ |
| 8 | Template Reporte Completo | ⭐⭐⭐⭐ | ⚡⚡⚡ |

**Avance:** 82% → **90%** (+8%)

---

## **FASE 3: SEGURIDAD + TESTING**

#### 🔒 Tarea 9: Row Level Security (RLS) Completo
**Impacto:** ⭐⭐⭐ (Medio-Alto - Seguridad)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Implementación de políticas de seguridad en base de datos
- Aislamiento de datos por usuario
- Prevención de acceso no autorizado

**Migration SQL (4h):**
```sql
-- Actualizar políticas en generated_reports
DROP POLICY IF EXISTS "Enable all for authenticated users" ON generated_reports;

CREATE POLICY "users_view_own_reports"
  ON generated_reports FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "users_insert_own_reports"
  ON generated_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_reports"
  ON generated_reports FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
```

**Testing necesario:**
- Crear múltiples usuarios de prueba
- Verificar aislamiento de datos entre usuarios
- Verificar permisos de admin
- Validar todas las políticas RLS

---

#### 🧪 Tarea 10: Testing Funcional Completo
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Validación de todas las funcionalidades implementadas
- Testing end-to-end de flujos principales
- Verificación de integridad de datos

**Checklist de testing:**

**Reportería:**
- [ ] Generar reporte COMMUNE_MARKET (Ñuñoa)
- [ ] Verificar 7 secciones
- [ ] Exportar PDF
- [ ] Validar contenido IA

**IA:**
- [ ] "¿Qué pasó con la Ley de IVA en 2021?"
- [ ] "¿Cómo afectó el estallido social?"
- [ ] "¿Cuál es el subsidio DS1?"
- [ ] Verificar sources citadas

**Filtros:**
- [ ] Filtrar por precio 2000-3000 UF
- [ ] Filtrar por tipología 2D-2B
- [ ] Combinar filtros
- [ ] Limpiar filtros

**Alertas:**
- [ ] Verificar detección MAO alto
- [ ] Verificar alertas visuales
- [ ] Click en links accionables

---

#### 🐛 Tarea 11: Bug Fixing + Optimización
**Impacto:** ⭐⭐⭐ (Medio-Alto)
**Esfuerzo:** ⚡⚡ (Bajo-Medio)

**Justificación técnica:**
- Resolución de issues encontrados en testing
- Optimización de queries de base de datos
- Mejora de error handling
- Implementación de loading states

**Áreas a revisar:**
- Queries N+1
- Manejo de errores en llamadas API
- Estados de carga en UI
- Validación de inputs

---

#### 📚 Tarea 12: Documentación Técnica
**Impacto:** ⭐⭐⭐ (Medio)
**Esfuerzo:** ⚡⚡ (Bajo)

**Justificación técnica:**
- Documentación de arquitectura
- Guías de setup y deployment
- Documentación de API endpoints
- README actualizado

**Documentos a actualizar:**
- `README.md` con instrucciones de setup
- `docs/ARCHITECTURE.md` con diagrama de sistema
- `docs/API.md` con endpoints disponibles
- Comentarios en código complejo

---

### **RESUMEN FASE 3:**
| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 9 | RLS Completo | ⭐⭐⭐ | ⚡⚡ |
| 10 | Testing Funcional | ⭐⭐⭐⭐ | ⚡⚡ |
| 11 | Bug Fixing | ⭐⭐⭐ | ⚡⚡ |
| 12 | Documentación | ⭐⭐⭐ | ⚡⚡ |

**Avance:** 90% → **95%** (+5%)

---

## 📊 RESUMEN TOTAL DEL PLAN

### Progresión por Fases
| Fase | Foco | Tareas | Avance |
|------|------|--------|--------|
| **Fase 1** | Quick Wins + UI/UX | 4 | 74% → 82% |
| **Fase 2** | Reportería + Filtros | 4 | 82% → 90% |
| **Fase 3** | Seguridad + Testing | 4 | 90% → 95% |
| **TOTAL** | | **12 tareas** | **+21%** |

### Distribución por Impacto/Esfuerzo
| Categoría | Cantidad | Impacto Promedio | Esfuerzo Promedio |
|-----------|----------|------------------|-------------------|
| Quick Wins (🟢) | 4 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| Medio Esfuerzo (🟡🔵) | 4 | ⭐⭐⭐⭐ | ⚡⚡ |
| Major Projects (🟠🔒) | 4 | ⭐⭐⭐ | ⚡⚡⚡ |

---

## 🎯 HITOS TÉCNICOS

### Después de Fase 1 (82%):
✅ **UI/UX MEJORADA**
- Librería Tremor UI integrada
- Sistema RAG funcional
- Alertas automáticas
- Visualizaciones avanzadas

### Después de Fase 2 (90%):
✅ **FUNCIONALIDAD COMPLETA**
- Sistema de reportes multi-sección
- Exportación PDF
- Filtros avanzados
- Análisis competitivo

### Después de Fase 3 (95%):
✅ **PRODUCCIÓN READY**
- RLS implementado
- Testing completo
- Bugs resueltos
- Documentación actualizada

---

## 💡 VENTAJAS TÉCNICAS DEL PLAN

### 1. Bajo Riesgo Técnico
- Sin refactors grandes de arquitectura
- Dependencias probadas y estables
- Sin integraciones de terceros complejas

### 2. Incremental y Modular
- Cada fase es independiente
- Rollback sencillo si hay problemas
- Testing continuo

### 3. Optimización de Recursos
- Priorización por impacto/esfuerzo
- Paralelización donde sea posible
- Reutilización de componentes

---

## 🚫 BACKLOG - FASE 2 (Futuro)

**Integraciones de terceros:**
- ❌ CBR - Conservador Bienes Raíces API
- ❌ Web scraping Portal Inmobiliario / Toc Toc
- ❌ Roles de Avalúo SII
- ❌ INE Segmentación demográfica

**Features avanzadas:**
- ❌ Template: Informe de Proyecto Específico
- ❌ Template: Informe de Oportunidad de Terreno
- ❌ Heatmap interactivo en mapa
- ❌ Sistema multi-tenant con planes

**Justificación técnica:**
- Alto esfuerzo de integración
- Dependencias externas con riesgo
- Complejidad de mantenimiento
- No bloqueantes para funcionalidad core

---

## 📋 CHECKLIST TÉCNICO DE EJECUCIÓN

### Pre-requisitos Técnicos
- [ ] Entorno de desarrollo configurado
- [ ] Variables de entorno (.env) configuradas
- [ ] Acceso a servicios: Supabase, OpenAI API
- [ ] Node.js y npm actualizados
- [ ] Git branch creado: `feature/mvp-improvements`

### Durante Desarrollo
- [ ] Tests unitarios para lógica de negocio
- [ ] Testing manual de cada feature
- [ ] Code review antes de merge
- [ ] Commits atómicos con mensajes descriptivos
- [ ] Documentar decisiones de arquitectura

### Post-Implementación
- [ ] Pull Request con changelog detallado
- [ ] Migrations de DB ejecutadas
- [ ] Testing end-to-end completo
- [ ] Documentación actualizada
- [ ] Plan de rollback definido

---

## 🔧 STACK TÉCNICO

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Tremor UI (nuevo)
- Recharts → Tremor Charts
- jsPDF + html2canvas

### Backend
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS)
- Supabase Edge Functions

### IA/ML
- OpenAI API (GPT-4o-mini)
- text-embedding-3-small
- Vector search (pgvector)

### DevOps
- Vercel (deployment)
- GitHub (version control)

---

## 🚀 INICIO RÁPIDO

```bash
# 1. Crear branch de trabajo
git checkout -b feature/mvp-improvements

# 2. Instalar nueva dependencia (Fase 1, Tarea 1)
cd frontend
npm install @tremor/react

# 3. Seguir implementación según plan
# Ver sección "FASE 1: QUICK WINS + MEJORAS VISUALES"
```

---

**Documento creado por:** Claude Code (Sonnet 4.5)
**Fecha:** 11 de Febrero 2026
**Versión:** 2.0 - Plan Técnico Optimizado
