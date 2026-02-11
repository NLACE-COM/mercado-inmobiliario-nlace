# PLAN DE MEJORAS OPTIMIZADO
## Estrategia: Quick Wins + Máximo Impacto

**Fecha:** 11 de Febrero 2026
**Objetivo:** Llevar MVP de 74% a 95% en **3 semanas** (vs 6 semanas plan original)
**Método:** Priorización por Impacto/Esfuerzo

---

## 📊 MATRIZ DE PRIORIZACIÓN

```
        │ ALTO IMPACTO
        │
  QUICK │ 🟢 1. Instalar Tremor UI (1d)
  WINS  │ 🟢 2. Knowledge Base Inicial (2d)
        │ 🟢 3. KPI Cards Mejoradas (1d)
        │ 🟢 4. Alertas Automáticas (1.5d)
        │ 🟢 5. Gráficos Básicos Tremor (2d)
  ──────┼────────────────────────────────
  BAJO  │
  ESFUER│ 🟡 6. Exportación PDF Simple (2d)
  ZO    │ 🟡 7. Filtros UI Esenciales (2d)
        │ 🔵 8. Tabla Competencia (1d)
═══════════════════════════════════════════
        │
  MAJOR │ 🟠 9. Template Reporte Completo (3d)
  PROJE │ 🟠 10. Exportación PDF Pro (3d)
  CTS   │ 🟠 11. Filtros Completos (4d)
        │
  ──────┼────────────────────────────────
  ALTO  │
  ESFUER│ ⚫ Integración CBR (3sem)
  ZO    │ ⚫ Scraping Portales (3sem)
        │
        │ BAJO IMPACTO (corto plazo)
```

---

## 🎯 CRITERIOS DE IMPACTO

### Alto Impacto = Afecta directamente a:
1. **Demostración de valor** en demos a clientes
2. **Diferenciación** vs TINSA y competencia
3. **Percepción de calidad** (look premium)
4. **Funcionalidad core** del producto
5. **Time-to-insight** del usuario

### Bajo Esfuerzo =
- ≤ 2 días de implementación
- Sin dependencias bloqueantes
- Código bien localizado
- Riesgo bajo

---

## 🚀 PLAN DE 3 SEMANAS (OPTIMIZADO)

### **SEMANA 1: QUICK WINS + IMPRESIÓN VISUAL** (7 días)

#### 🟢 DÍA 1: Tremor UI + KPI Cards Mejoradas
**Tiempo:** 1 día
**Impacto:** ⭐⭐⭐⭐⭐ (Muy Alto)
**Esfuerzo:** ⚡ (Muy Bajo)

**¿Por qué primero?**
- Transforma visual de toda la app en 1 día
- Afecta todas las vistas (dashboard, analytics, reportes)
- Cero riesgo (solo cambio de librería de gráficos)
- Impacto inmediato en demos

**Tareas:**
```bash
# 1. Instalación (10 min)
npm install @tremor/react

# 2. Actualizar tailwind.config.ts (5 min)
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
]

# 3. Reemplazar KPI Cards en /dashboard/page.tsx (2h)
- Card → Tremor Card
- Agregar Metric, Text, BadgeDelta
- Calcular deltas (% vs mes anterior)

# 4. Reemplazar MarketOverviewChart (2h)
- Recharts BarChart → Tremor BarChart
- Mejor paleta de colores
- ValueFormatter automático

# 5. Reemplazar PriceDistributionChart (1h)
- → Tremor BarChart con mejor diseño

# 6. Testing visual (1h)
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

#### 🟢 DÍA 2-3: Knowledge Base Inicial (2 días)
**Tiempo:** 2 días
**Impacto:** ⭐⭐⭐⭐⭐ (Muy Alto - Diferenciador clave)
**Esfuerzo:** ⚡⚡ (Bajo)

**¿Por qué segundo?**
- **DIFERENCIADOR #1** del producto (Super Cerebro)
- Permite demos mostrando IA con contexto real
- Sin esto, IA da respuestas genéricas
- Bloqueante para credibilidad

**Enfoque:** 5 documentos esenciales (no 20+)

**DÍA 2: Preparar contenido (4-6h)**
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

**DÍA 3: Ingestar en vector store (2-4h)**
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

**Testing (1h):**
```
Queries de prueba:
1. "¿Por qué bajó la demanda en viviendas sobre 4000 UF en 2021?"
   → Debe mencionar Ley IVA

2. "¿Qué pasó durante el estallido social con las ventas?"
   → Debe citar caída 37%, MAO 18 meses

3. "¿Cómo afecta la TPM alta a las ventas?"
   → Debe explicar elasticidad -8%
```

**Output:**
- IA ahora responde con contexto chileno específico
- Cita leyes y eventos históricos
- Diferenciación real vs competencia

---

#### 🟢 DÍA 4: Alertas Automáticas (1.5 días)
**Tiempo:** 1.5 días
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**¿Por qué tercero?**
- Funcionalidad única (competencia no tiene)
- Demuestra valor proactivo
- Implementación simple (solo lógica + UI)

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

**Output:**
- Dashboard muestra alertas en tiempo real
- Usuarios ven insights proactivos
- Links accionables a análisis detallado

---

#### 🟢 DÍA 5: Gráficos Adicionales Tremor (2 días)
**Tiempo:** 2 días
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

**Integración en Analytics (2h):**
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

**Output:**
- 3 nuevos gráficos profesionales
- Analytics page muy mejorada
- Data storytelling visual

---

### **RESUMEN SEMANA 1:**
| Día | Tarea | Tiempo | Impacto |
|-----|-------|--------|---------|
| 1 | Tremor UI + KPI Cards | 1d | ⭐⭐⭐⭐⭐ |
| 2-3 | Knowledge Base (5 docs) | 2d | ⭐⭐⭐⭐⭐ |
| 4 | Alertas Automáticas | 1.5d | ⭐⭐⭐⭐ |
| 5-6 | Gráficos Tremor (3 tipos) | 2d | ⭐⭐⭐⭐ |
| **TOTAL** | | **6.5 días** | **Muy Alto** |

**Avance:** 74% → **82%** (+8%)

---

## **SEMANA 2: REPORTERÍA + EXPORTACIÓN** (7 días)

#### 🟡 DÍA 1-2: Exportación PDF Simple (2 días)
**Tiempo:** 2 días
**Impacto:** ⭐⭐⭐⭐ (Alto - Requerido por clientes)
**Esfuerzo:** ⚡⚡ (Bajo con enfoque simple)

**Enfoque:** PDF básico funcional (no perfecto)

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

**Instalación (30min):**
```bash
npm install jspdf html2canvas
npm install -D @types/jspdf
```

**Testing (2h):**
- Exportar reporte simple
- Verificar paginación
- Probar con diferentes tamaños

**Output:**
- PDF funcional descargable
- No perfecto pero 100% funcional
- Mejora posterior en Semana 3 (opcional)

---

#### 🟡 DÍA 3-4: Filtros UI Esenciales (2 días)
**Tiempo:** 2 días
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡ (Bajo)

**Filtros prioritarios (no todos):**

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

**Output:**
- 4 filtros esenciales funcionando
- UX mejorada significativamente
- Búsqueda precisa de proyectos

---

#### 🔵 DÍA 5: Tabla de Competencia (1 día)
**Tiempo:** 1 día
**Impacto:** ⭐⭐⭐ (Medio-Alto)
**Esfuerzo:** ⚡ (Muy Bajo)

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

**Integración en Reportes (2h):**
```typescript
// En generación de reporte
sections.push({
  type: 'custom',
  component: 'CompetitorTable',
  data: { projects: communeProjects }
})
```

**Output:**
- Tabla profesional de competencia
- Badges de colores según métricas
- Sorting y visual claro

---

#### 🟠 DÍA 6-7: Template Reporte Mejorado (2 días)
**Tiempo:** 2 días
**Impacto:** ⭐⭐⭐⭐ (Alto)
**Esfuerzo:** ⚡⚡⚡ (Medio)

**Objetivo:** Reporte "Contexto de Mercado" completo

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

**Output:**
- Reporte completo de 7 secciones
- Resumen ejecutivo generado por IA
- Todas las visualizaciones integradas

---

### **RESUMEN SEMANA 2:**
| Día | Tarea | Tiempo | Impacto |
|-----|-------|--------|---------|
| 1-2 | Exportación PDF Simple | 2d | ⭐⭐⭐⭐ |
| 3-4 | Filtros UI Esenciales | 2d | ⭐⭐⭐⭐ |
| 5 | Tabla Competencia | 1d | ⭐⭐⭐ |
| 6-7 | Template Reporte Completo | 2d | ⭐⭐⭐⭐ |
| **TOTAL** | | **7 días** | **Alto** |

**Avance:** 82% → **90%** (+8%)

---

## **SEMANA 3: POLISH + SEGURIDAD** (5 días)

#### 🔒 DÍA 1-2: Completar RLS + Testing (2 días)
**Tiempo:** 2 días
**Impacto:** ⭐⭐⭐ (Medio - Seguridad)
**Esfuerzo:** ⚡⚡ (Bajo)

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

**Testing (4h):**
- Crear 2 usuarios de prueba
- Verificar que Usuario A no ve reportes de Usuario B
- Verificar que Admin ve todos
- Testing de cada política

---

#### 🧪 DÍA 3: Testing Funcional Completo (1 día)
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

#### 🐛 DÍA 4: Bug Fixing + Optimización (1 día)
- Fix de issues encontrados
- Optimización de queries lentas
- Error handling mejorado
- Loading states

---

#### 📚 DÍA 5: Documentación + Demo Prep (1 día)
**Documentación:**
- README actualizado
- Guía de usuario con screenshots
- Documentación de API

**Demo Preparation:**
- Datos de prueba limpios
- Scenarios de demo preparados
- Scripts de presentación

---

### **RESUMEN SEMANA 3:**
| Día | Tarea | Tiempo | Impacto |
|-----|-------|--------|---------|
| 1-2 | RLS + Testing Seguridad | 2d | ⭐⭐⭐ |
| 3 | Testing Funcional | 1d | ⭐⭐⭐ |
| 4 | Bug Fixing | 1d | ⭐⭐⭐ |
| 5 | Documentación | 1d | ⭐⭐ |
| **TOTAL** | | **5 días** | **Medio** |

**Avance:** 90% → **95%** (+5%)

---

## 📊 RESUMEN TOTAL DEL PLAN

### Timeline Optimizado
| Semana | Foco | Días | Avance |
|--------|------|------|--------|
| **Semana 1** | Quick Wins Visual + IA | 6.5d | 74% → 82% |
| **Semana 2** | Reportería + Export | 7d | 82% → 90% |
| **Semana 3** | Polish + Seguridad | 5d | 90% → 95% |
| **TOTAL** | | **18.5 días** | **+21%** |

### Comparación con Plan Original
| Métrica | Plan Original | Plan Optimizado | Mejora |
|---------|---------------|-----------------|---------|
| **Duración** | 6 semanas (28d) | 3 semanas (18.5d) | **-34%** |
| **Avance final** | 95% | 95% | Igual |
| **Quick wins** | 0 | 5 | +5 |
| **Impacto demos** | Medio | Alto | +50% |

---

## 🎯 IMPACTO EN OBJETIVOS DEL PROYECTO

### Después de Semana 1 (82%):
✅ **LISTO PARA DEMOS**
- Look premium (Tremor UI)
- IA con contexto real
- Alertas proactivas
- Gráficos profesionales

### Después de Semana 2 (90%):
✅ **LISTO PARA CLIENTES BETA**
- Reportes completos
- Exportación PDF
- Filtros avanzados
- Funcionalidad completa

### Después de Semana 3 (95%):
✅ **LISTO PARA LANZAMIENTO**
- Seguridad completa
- Testing exhaustivo
- Documentación
- Demos preparados

---

## 💡 VENTAJAS DE ESTE PLAN

### 1. Time-to-Value Rápido
- **Semana 1:** Ya puedes hacer demos impresionantes
- **Semana 2:** Clientes beta pueden usar el producto
- **Semana 3:** Lanzamiento público

### 2. Riesgo Minimizado
- Solo features de bajo riesgo técnico
- Sin refactors grandes
- Sin integraciones complejas (CBR, scraping quedan Fase 2)

### 3. ROI Máximo
- Cada tarea tiene impacto visible inmediato
- No hay "thankless tasks"
- Ratio impacto/esfuerzo optimizado

### 4. Momentum del Equipo
- Wins rápidos motivan
- Progreso visible diario
- Feedback loop corto

---

## 🚫 LO QUE DEJAMOS PARA FASE 2

**Integraciones complejas (3-4 semanas c/u):**
- ❌ CBR - Conservador Bienes Raíces
- ❌ Scraping Portal Inmobiliario / Toc Toc
- ❌ Roles de Avalúo SII
- ❌ INE Segmentación

**Features avanzadas (1-2 semanas c/u):**
- ❌ Informe de Proyecto Específico
- ❌ Informe de Oportunidad de Terreno
- ❌ Heatmap en mapa
- ❌ Sistema de planes por suscripción

**Justificación:**
- No son bloqueantes para MVP
- Alto esfuerzo, impacto diferido
- Mejor validar producto primero con clientes

---

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-requisitos
- [ ] Equipo disponible 100% (no multitasking)
- [ ] Entorno de desarrollo listo
- [ ] Acceso a todas las cuentas (Supabase, OpenAI, etc.)
- [ ] Branch creado: `feature/quick-wins-sprint`

### Durante Ejecución
- [ ] Daily standup 10 min (9:00 AM)
- [ ] Commits diarios al branch
- [ ] Testing inmediato de cada feature
- [ ] Documentar decisiones importantes

### Post-Ejecución
- [ ] Pull Request con changelog completo
- [ ] Demo interno (stakeholders)
- [ ] Preparar primeras demos a clientes
- [ ] Planificar Fase 2

---

## 🎬 PRÓXIMO PASO

**AHORA MISMO:**
```bash
# 1. Crear branch
git checkout -b feature/quick-wins-sprint

# 2. Comenzar DÍA 1
npm install @tremor/react

# 3. Actualizar tailwind.config.ts
# ... (seguir checklist Día 1)
```

**ESTIMACIÓN REALISTA:**
- Con 1 developer full-time: **3 semanas**
- Con 2 developers: **2 semanas**
- Con 3 developers (paralelo): **1.5 semanas**

---

**¿Comenzamos con el Día 1?**

Puedo ayudarte a:
1. Implementar Tremor UI ahora mismo
2. Preparar contenido para Knowledge Base
3. Crear cualquiera de los componentes
4. Revisar/ajustar el plan según recursos

---

**Documento creado por:** Claude Code (Sonnet 4.5)
**Fecha:** 11 de Febrero 2026
**Versión:** 1.0 - Plan Optimizado
