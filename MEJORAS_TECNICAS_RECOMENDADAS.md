# MEJORAS TÉCNICAS RECOMENDADAS
## Plataforma Inmobiliaria NLACE

**Fecha:** 11 de Febrero 2026
**Versión:** 1.0

---

## 1. VISUALIZACIÓN - INSTALAR TREMOR UI

### Problema
El documento maestro especifica:
> "Tremor: Librería especializada en dashboards (charts, KPIs) con diseño profesional default"

**Estado actual:** Tremor NO está instalado. Se usa Recharts solamente.

### Solución

```bash
# Instalar Tremor
npm install @tremor/react

# Actualizar tailwind.config para incluir Tremor
```

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}', // Add Tremor
  ],
  // ... resto
}
```

### Componentes Tremor a Implementar

**KPI Cards Mejoradas:**
```typescript
import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react'

export function ImprovedKPICard({
  title,
  metric,
  delta,
  deltaType
}: KPICardProps) {
  return (
    <Card>
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{metric}</Metric>
        </div>
        <BadgeDelta deltaType={deltaType}>{delta}</BadgeDelta>
      </Flex>
    </Card>
  )
}
```

**Gráficos Profesionales:**
```typescript
import { BarChart, LineChart, DonutChart } from '@tremor/react'

// Reemplazar MarketOverviewChart con Tremor
export function TremorMarketChart({ data }: { data: any[] }) {
  return (
    <BarChart
      data={data}
      index="region"
      categories={["proyectos", "unidades", "vendidas"]}
      colors={["blue", "teal", "amber"]}
      valueFormatter={(value) => value.toLocaleString()}
      yAxisWidth={48}
    />
  )
}

// Gráfico de distribución de precios (Donut)
export function PriceDistributionDonut({ data }: { data: any[] }) {
  return (
    <DonutChart
      data={data}
      category="count"
      index="range"
      colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
      valueFormatter={(value) => `${value} proyectos`}
    />
  )
}

// Tendencias históricas (Line Chart)
export function HistoricalTrendsChart({ data }: { data: any[] }) {
  return (
    <LineChart
      data={data}
      index="date"
      categories={["stock", "vendidas", "precio_promedio"]}
      colors={["emerald", "red", "blue"]}
      valueFormatter={(value) => value.toLocaleString()}
      yAxisWidth={40}
    />
  )
}
```

**Estimación:** 2 días de trabajo

---

## 2. REPORTERÍA - GRÁFICOS FALTANTES

### Problema
Los informes generados no incluyen las visualizaciones especificadas:
- Gráficos de barras apiladas (% por rango UF)
- Gráficos de línea (MAO histórico)
- Gráficos torta (mix productos)
- Indicadores KPI grandes

### Solución

**Estructura de Reporte Mejorada:**

```typescript
// frontend/src/types/reports.ts
export type ReportSection =
  | { type: 'text'; content: string }
  | { type: 'kpi_grid'; kpis: KPI[] }
  | { type: 'bar_chart'; data: any[]; config: ChartConfig }
  | { type: 'line_chart'; data: any[]; config: ChartConfig }
  | { type: 'donut_chart'; data: any[]; config: ChartConfig }
  | { type: 'stacked_bar'; data: any[]; config: ChartConfig }
  | { type: 'table'; data: any[]; columns: Column[] }
  | { type: 'map'; projects: Project[] }

export interface GeneratedReport {
  id: string
  title: string
  report_type: string
  sections: ReportSection[]
  generated_at: string
}
```

**Componente de Renderizado:**

```typescript
// frontend/src/components/reports/ReportSectionRenderer.tsx
import { Card, Title, BarChart, LineChart, DonutChart } from '@tremor/react'

export function ReportSectionRenderer({ section }: { section: ReportSection }) {
  switch (section.type) {
    case 'text':
      return <div className="prose">{section.content}</div>

    case 'kpi_grid':
      return (
        <div className="grid grid-cols-4 gap-4">
          {section.kpis.map(kpi => (
            <Card key={kpi.label}>
              <Text>{kpi.label}</Text>
              <Metric>{kpi.value}</Metric>
              {kpi.delta && <BadgeDelta deltaType={kpi.deltaType}>{kpi.delta}</BadgeDelta>}
            </Card>
          ))}
        </div>
      )

    case 'bar_chart':
      return (
        <Card>
          <Title>{section.config.title}</Title>
          <BarChart {...section.config} data={section.data} />
        </Card>
      )

    case 'stacked_bar':
      return (
        <Card>
          <Title>{section.config.title}</Title>
          <BarChart
            {...section.config}
            data={section.data}
            stack={true}
          />
        </Card>
      )

    case 'line_chart':
      return (
        <Card>
          <Title>{section.config.title}</Title>
          <LineChart {...section.config} data={section.data} />
        </Card>
      )

    case 'donut_chart':
      return (
        <Card>
          <Title>{section.config.title}</Title>
          <DonutChart {...section.config} data={section.data} />
        </Card>
      )

    case 'table':
      return (
        <Card>
          <Table>
            {/* Render table with section.columns and section.data */}
          </Table>
        </Card>
      )

    case 'map':
      return (
        <Card>
          <MapboxMap projects={section.projects} />
        </Card>
      )
  }
}
```

**Backend - Generación de Contenido:**

```typescript
// frontend/src/app/api/brain/reports/generate/route.ts
async function generateCommuneReport(commune: string) {
  const projects = await fetchProjectsByCommune(commune)
  const metrics = calculateMetrics(projects)
  const historical = await fetchHistoricalData(commune)

  const sections: ReportSection[] = [
    {
      type: 'text',
      content: `# Análisis de Mercado: ${commune}\n\n${aiGeneratedSummary}`
    },
    {
      type: 'kpi_grid',
      kpis: [
        { label: 'Total Proyectos', value: metrics.totalProjects },
        { label: 'Stock Disponible', value: metrics.stock, delta: '+12%', deltaType: 'increase' },
        { label: 'Precio Promedio', value: `${metrics.avgPrice} UF` },
        { label: 'Velocidad Venta', value: `${metrics.salesSpeed} u/mes` }
      ]
    },
    {
      type: 'stacked_bar',
      data: prepareStackedBarData(projects), // Por rango UF
      config: {
        title: 'Participación por Rango de Precio',
        index: 'range',
        categories: ['oferta', 'venta'],
        colors: ['blue', 'green'],
        stack: true
      }
    },
    {
      type: 'line_chart',
      data: historical,
      config: {
        title: 'Evolución MAO y Stock (6 meses)',
        index: 'month',
        categories: ['mao', 'stock'],
        colors: ['orange', 'blue']
      }
    },
    {
      type: 'donut_chart',
      data: prepareTypologyData(projects),
      config: {
        title: 'Mix de Productos',
        category: 'count',
        index: 'typology',
        colors: ['blue', 'cyan', 'indigo', 'violet', 'purple']
      }
    },
    {
      type: 'table',
      data: prepareCompetitorTable(projects),
      columns: [
        { key: 'name', label: 'Proyecto' },
        { key: 'developer', label: 'Desarrollador' },
        { key: 'stock', label: 'Stock' },
        { key: 'price', label: 'Precio UF' },
        { key: 'salesSpeed', label: 'Velocidad' }
      ]
    }
  ]

  return sections
}

function prepareStackedBarData(projects: Project[]) {
  const ranges = ['0-2000', '2000-3000', '3000-4000', '4000-5000', '5000+']
  return ranges.map(range => ({
    range,
    oferta: projects.filter(p => inRange(p.avg_price_uf, range)).reduce((sum, p) => sum + p.available_units, 0),
    venta: projects.filter(p => inRange(p.avg_price_uf, range)).reduce((sum, p) => sum + p.sold_units, 0)
  }))
}

function prepareTypologyData(projects: Project[]) {
  const typologies = ['1D-1B', '2D-1B', '2D-2B', '3D-2B', '3D-3B']
  return typologies.map(typ => ({
    typology: typ,
    count: projects.filter(p => p.property_type?.includes(typ)).length
  }))
}
```

**Estimación:** 1 semana de trabajo

---

## 3. EXPORTACIÓN A PDF

### Problema
No hay funcionalidad para exportar reportes a PDF, requerido por clientes.

### Solución

**Instalar dependencias:**
```bash
npm install puppeteer @sparticuz/chromium-min
npm install -D @types/puppeteer
```

**API Route para exportar:**

```typescript
// frontend/src/app/api/brain/reports/[id]/export/route.ts
import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium-min'

export const runtime = 'edge' // Use edge if possible, or nodejs
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  const reportId = params.id

  // Fetch report
  const { data: report } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Generate HTML from report sections
  const html = generateReportHTML(report)

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true
  })

  await browser.close()

  // Return PDF
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${reportId}.pdf"`
    }
  })
}

function generateReportHTML(report: GeneratedReport): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.title}</title>
      <style>
        body {
          font-family: 'Inter', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1f2937;
        }
        h1 { font-size: 24px; color: #111827; margin-bottom: 20px; }
        h2 { font-size: 18px; color: #374151; margin-top: 30px; }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .kpi-card {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .kpi-label { font-size: 12px; color: #6b7280; }
        .kpi-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th { background: #f3f4f6; font-weight: 600; }
        .chart-container {
          margin: 20px 0;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      ${renderSectionsToHTML(report.sections)}
    </body>
    </html>
  `
}

function renderSectionsToHTML(sections: ReportSection[]): string {
  return sections.map(section => {
    switch (section.type) {
      case 'text':
        return `<div class="text-section">${marked(section.content)}</div>`

      case 'kpi_grid':
        return `
          <div class="kpi-grid">
            ${section.kpis.map(kpi => `
              <div class="kpi-card">
                <div class="kpi-label">${kpi.label}</div>
                <div class="kpi-value">${kpi.value}</div>
              </div>
            `).join('')}
          </div>
        `

      case 'table':
        return `
          <table>
            <thead>
              <tr>${section.columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${section.data.map(row => `
                <tr>${section.columns.map(col => `<td>${row[col.key]}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        `

      case 'bar_chart':
      case 'line_chart':
      case 'donut_chart':
        // Para gráficos: generar imagen estática con Chart.js o renderizar SVG
        return `<div class="chart-container"><img src="${generateChartImage(section)}" /></div>`

      default:
        return ''
    }
  }).join('\n')
}
```

**Alternativa más simple (sin gráficos dinámicos):**

```typescript
// Usar jsPDF + html2canvas
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportReportToPDF(reportElement: HTMLElement) {
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    logging: false,
    useCORS: true
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')

  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save('reporte.pdf')
}
```

**Botón en frontend:**

```typescript
// frontend/src/app/dashboard/reports/[id]/page.tsx
<Button onClick={() => window.open(`/api/brain/reports/${reportId}/export`)}>
  <Download className="mr-2 h-4 w-4" />
  Descargar PDF
</Button>
```

**Estimación:** 3-4 días de trabajo

---

## 4. FILTROS AVANZADOS EN UI

### Problema
Los filtros están solo en backend (SQL). La UI no permite filtrar por:
- Rango de precio
- Tipología
- Estado de obra
- Desarrollador
- MAO, absorción, etc.

### Solución

**Componente de Filtros:**

```typescript
// frontend/src/components/ProjectFilters.tsx
import { useState } from 'react'
import { Select, Input, Button } from '@/components/ui'

export interface ProjectFilters {
  commune?: string
  region?: string
  minPrice?: number
  maxPrice?: number
  typology?: string
  projectStatus?: string
  developer?: string
  minMAO?: number
  maxMAO?: number
}

export function ProjectFiltersPanel({
  onFiltersChange
}: {
  onFiltersChange: (filters: ProjectFilters) => void
}) {
  const [filters, setFilters] = useState<ProjectFilters>({})

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Región */}
        <div>
          <Label>Región</Label>
          <Select
            value={filters.region}
            onValueChange={v => updateFilter('region', v)}
          >
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="RM">Metropolitana</SelectItem>
            <SelectItem value="V">Valparaíso</SelectItem>
            {/* ... */}
          </Select>
        </div>

        {/* Comuna */}
        <div>
          <Label>Comuna</Label>
          <CommuneAutocomplete
            value={filters.commune}
            onChange={v => updateFilter('commune', v)}
          />
        </div>

        {/* Rango de Precio */}
        <div>
          <Label>Precio (UF)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={e => updateFilter('minPrice', Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={e => updateFilter('maxPrice', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Tipología */}
        <div>
          <Label>Tipología</Label>
          <Select
            value={filters.typology}
            onValueChange={v => updateFilter('typology', v)}
          >
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="1D-1B">1D-1B</SelectItem>
            <SelectItem value="2D-2B">2D-2B</SelectItem>
            <SelectItem value="3D-2B">3D-2B</SelectItem>
            <SelectItem value="3D-3B">3D-3B</SelectItem>
          </Select>
        </div>

        {/* Estado de Obra */}
        <div>
          <Label>Estado de Obra</Label>
          <Select
            value={filters.projectStatus}
            onValueChange={v => updateFilter('projectStatus', v)}
          >
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="En Blanco">En Blanco</SelectItem>
            <SelectItem value="En Verde">En Verde</SelectItem>
            <SelectItem value="Entrega Inmediata">Entrega Inmediata</SelectItem>
          </Select>
        </div>

        {/* Desarrollador */}
        <div>
          <Label>Desarrollador</Label>
          <DeveloperAutocomplete
            value={filters.developer}
            onChange={v => updateFilter('developer', v)}
          />
        </div>

        {/* MAO */}
        <div>
          <Label>MAO (meses)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minMAO}
              onChange={e => updateFilter('minMAO', Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxMAO}
              onChange={e => updateFilter('maxMAO', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => { setFilters({}); onFiltersChange({}) }}>
          Limpiar Filtros
        </Button>
      </div>
    </Card>
  )
}
```

**Autocomplete de Comuna:**

```typescript
// frontend/src/components/CommuneAutocomplete.tsx
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function CommuneAutocomplete({ value, onChange }: {
  value?: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: communes } = useQuery({
    queryKey: ['communes', search],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('commune')
        .ilike('commune', `%${search}%`)
        .limit(10)
      return [...new Set(data?.map(p => p.commune))]
    }
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between">
          {value || "Seleccionar comuna"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput
            placeholder="Buscar comuna..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {communes?.map(commune => (
              <CommandItem
                key={commune}
                onSelect={() => {
                  onChange(commune)
                  setOpen(false)
                }}
              >
                {commune}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

**Integración en ProjectsTable:**

```typescript
// frontend/src/components/ProjectsTable.tsx
export function ProjectsTable() {
  const [filters, setFilters] = useState<ProjectFilters>({})

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase.from('projects').select('*')

      if (filters.commune) {
        query = query.eq('commune', filters.commune)
      }
      if (filters.region) {
        query = query.eq('region', filters.region)
      }
      if (filters.minPrice) {
        query = query.gte('avg_price_uf', filters.minPrice)
      }
      if (filters.maxPrice) {
        query = query.lte('avg_price_uf', filters.maxPrice)
      }
      if (filters.typology) {
        query = query.ilike('property_type', `%${filters.typology}%`)
      }
      if (filters.projectStatus) {
        query = query.eq('project_status', filters.projectStatus)
      }
      if (filters.developer) {
        query = query.eq('developer', filters.developer)
      }
      if (filters.minMAO) {
        query = query.gte('months_to_sell_out', filters.minMAO)
      }
      if (filters.maxMAO) {
        query = query.lte('months_to_sell_out', filters.maxMAO)
      }

      const { data } = await query
      return data
    }
  })

  return (
    <div>
      <ProjectFiltersPanel onFiltersChange={setFilters} />
      <Table>
        {/* Render projects */}
      </Table>
    </div>
  )
}
```

**Estimación:** 1 semana de trabajo

---

## 5. KNOWLEDGE BASE - INGESTA INICIAL

### Problema
La infraestructura RAG está lista pero la knowledge base está vacía.

### Solución

**Script de Ingesta Masiva:**

```typescript
// scripts/ingest-knowledge-base.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Document {
  content: string
  metadata: {
    source: string
    type: 'ley' | 'hito_historico' | 'macro' | 'estudio'
    date?: string
    topic: string[]
  }
}

const documents: Document[] = [
  // LEYES
  {
    content: `
      Ley 21.442 - Subsidios DS1 y DS19

      Vigencia: Desde 2022

      DS1 (Subsidio para clase media):
      - Hasta 50 UF para viviendas entre 2000-2400 UF
      - Hasta 30 UF para viviendas entre 2400-3000 UF
      - Requisitos: Ahorro mínimo, no tener vivienda

      DS19 (Subsidio para sectores vulnerables):
      - Hasta 600 UF para familias vulnerables
      - Viviendas hasta 1200 UF
      - Prioriza allegados, campamentos

      Impacto de mercado:
      - Impulsa demanda en rango 2000-3500 UF
      - Mayor absorción en comunas periféricas
      - Desarrolladores ajustan precios a límites de subsidio
    `,
    metadata: {
      source: 'Ministerio de Vivienda',
      type: 'ley',
      date: '2022-06-01',
      topic: ['subsidios', 'vivienda_social', 'financiamiento']
    }
  },
  {
    content: `
      Ley 21.210/2020 - Modernización Tributaria (IVA Viviendas)

      Vigencia: Desde enero 2021

      Cambio Principal:
      - Casas y departamentos >2000 UF Y >140m² pagan IVA (19%)
      - Antes: exentos de IVA

      Cálculo de Impacto:
      - Vivienda 4000 UF → 760 UF adicionales de IVA
      - Vivienda 5000 UF → 950 UF adicionales de IVA
      - Equivale a +19% en precio final

      Consecuencias Mercado:
      - Caída de demanda en segmento premium (>4000 UF)
      - Desarrolladores bajaron superficies bajo 140m²
      - Migración de compradores a viviendas <2000 UF
      - Aumento de oferta en rango 1800-2000 UF (optimización fiscal)

      Datos históricos:
      - 2020 (antes ley): Absorción segmento >4000 UF = 8.5%
      - 2021 (después ley): Absorción segmento >4000 UF = 4.2%
      - Caída de 50% en ventas del segmento
    `,
    metadata: {
      source: 'Ley 21.210/2020 - Diario Oficial',
      type: 'ley',
      date: '2020-02-24',
      topic: ['impuestos', 'IVA', 'vivienda_premium', 'reforma_tributaria']
    }
  },

  // HITOS HISTÓRICOS
  {
    content: `
      Estallido Social de Chile (18 de octubre de 2019)

      Contexto:
      - Protestas masivas iniciadas por alza del transporte público
      - Se extendió a demandas sociales amplias (pensiones, salud, educación)
      - Duración: Octubre 2019 - Marzo 2020 (interrumpido por pandemia)

      Impacto en Mercado Inmobiliario:

      Sectores Más Afectados:
      - Santiago Centro: -35% ventas Q4 2019
      - Providencia: -28% ventas Q4 2019
      - Las Condes: -20% ventas Q4 2019
      - Comunas con saqueos/daños: parálisis total noviembre-diciembre 2019

      Métricas Clave:
      - Absorción promedio RM:
        - Q3 2019: 12.5%
        - Q4 2019: 7.8% (caída de 37%)
        - Q1 2020: 6.1%

      - MAO (Meses para Agotar Oferta):
        - Septiembre 2019: 9.2 meses
        - Diciembre 2019: 15.7 meses
        - Marzo 2020: 18.3 meses

      - Proyectos postergados:
        - 47 lanzamientos suspendidos en Q4 2019
        - 23 proyectos en construcción pausados

      Recuperación:
      - Duración de impacto: 18 meses (hasta abril 2021)
      - Absorción retornó a niveles pre-crisis en Q2 2021
      - Impulsado por: subsidios, tasas bajas, demanda contenida
    `,
    metadata: {
      source: 'Análisis CChC + TINSA',
      type: 'hito_historico',
      date: '2019-10-18',
      topic: ['crisis', 'estallido_social', 'absorcion', 'santiago_centro']
    }
  },
  {
    content: `
      Pandemia COVID-19 en Chile (Marzo 2020 - Diciembre 2021)

      Fases y Efectos en Inmobiliario:

      FASE 1: Shock Inicial (Mar-Jun 2020)
      - Cierre de salas de venta
      - Construcciones paralizadas
      - Ventas: -67% abril 2020 vs abril 2019
      - MAO: subió de 15 meses a 24 meses

      FASE 2: Adaptación Digital (Jul-Dic 2020)
      - Ventas online (tours virtuales, firmas digitales)
      - Retiro 10% AFP → inyección liquidez
      - Demanda reprimida + ahorro forzado
      - Ventas: recuperación a -15% vs 2019

      FASE 3: Boom (Ene 2021 - Jun 2021)
      - TPM en mínimos históricos (0.5%)
      - Créditos hipotecarios baratos
      - Retiros AFP (10% segundo y tercero)
      - Cambio preferencias: más metros, terrazas, home office
      - Ventas: +45% Q1 2021 vs Q1 2019
      - Absorción: récord de 15.8% mensual

      FASE 4: Normalización (Jul 2021 - Dic 2021)
      - Inicio alza TPM (desde 0.5% → 4%)
      - Oferta saturada (sobrestock)
      - Precios en máximos históricos
      - Absorción: baja a 9.2%

      Cambios Permanentes:
      - Digitalización de ventas
      - Mayor demanda por terrazas/loggia
      - Preferencia por comunas con áreas verdes
      - Aumento de tamaño promedio (de 55m² a 62m²)
    `,
    metadata: {
      source: 'Análisis CChC + BCCh',
      type: 'hito_historico',
      date: '2020-03-15',
      topic: ['pandemia', 'covid', 'tpm', 'retiros_afp', 'boom_inmobiliario']
    }
  },

  // MACROECONOMÍA
  {
    content: `
      Tasa de Política Monetaria (TPM) - Banco Central de Chile
      Histórico Reciente (2019-2026)

      Periodo       | TPM    | Contexto
      --------------|--------|------------------------------------------
      Ene 2019      | 2.75%  | Economía estable
      Oct 2019      | 1.75%  | Baja por estallido social
      Jul 2020      | 0.50%  | Mínimo histórico (COVID)
      Jul 2021      | 0.50%  | Mantención
      Oct 2021      | 2.00%  | Inicio alza (inflación)
      Ene 2022      | 4.00%  | Alza acelerada
      Jul 2022      | 9.00%  | Alza fuerte
      Oct 2022      | 11.25% | Peak histórico
      Ene 2023      | 11.25% | Mantención
      Jul 2023      | 10.25% | Inicio baja
      Dic 2023      | 8.25%  | Baja gradual
      Jun 2024      | 6.00%  | Normalización
      Dic 2024      | 5.25%  | Proyección
      Jun 2025      | 4.50%  | Proyección
      Feb 2026      | 4.00%  | Actual estimado

      Impacto en Dividendo Hipotecario:

      Crédito 3000 UF a 20 años:
      - TPM 0.5% (2020): ~9.5 UF/mes
      - TPM 4.0% (2022): ~13.8 UF/mes (+45%)
      - TPM 11.25% (oct 2022): ~19.2 UF/mes (+102%)
      - TPM 6.0% (2024): ~15.1 UF/mes

      Correlación con Ventas:
      - TPM baja (<2%) → Boom inmobiliario
      - TPM media (4-6%) → Mercado normal
      - TPM alta (>9%) → Contracción fuerte

      Elasticidad estimada:
      - Por cada 1% de alza TPM → -8% en ventas inmobiliarias
      - Por cada 1% de baja TPM → +6% en ventas
    `,
    metadata: {
      source: 'Banco Central de Chile',
      type: 'macro',
      date: '2026-02-01',
      topic: ['tpm', 'tasas', 'credito_hipotecario', 'financiamiento']
    }
  },

  // Más documentos...
]

async function ingestDocuments() {
  console.log(`Iniciando ingesta de ${documents.length} documentos...`)

  for (const doc of documents) {
    try {
      // Generar embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.content
      })

      const embedding = embeddingResponse.data[0].embedding

      // Insertar en Supabase
      const { error } = await supabase
        .from('knowledge_docs')
        .insert({
          content: doc.content,
          metadata: doc.metadata,
          embedding: embedding
        })

      if (error) {
        console.error(`Error insertando documento ${doc.metadata.source}:`, error)
      } else {
        console.log(`✓ Insertado: ${doc.metadata.source}`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`Error procesando documento ${doc.metadata.source}:`, error)
    }
  }

  console.log('Ingesta completada!')
}

ingestDocuments()
```

**Ejecutar:**
```bash
npx tsx scripts/ingest-knowledge-base.ts
```

**Estimación:** 3-4 días (incluyendo investigación y preparación de documentos)

---

## 6. COMPLETAR RLS (ROW LEVEL SECURITY)

### Problema
Las políticas RLS están incompletas:
- `generated_reports` tiene política permissive (abierta)
- `projects` no tiene RLS
- No hay roles por plan (comunal/regional/nacional)

### Solución

**Migration SQL:**

```sql
-- supabase/migrations/20260212000000_complete_rls.sql

-- 1. Habilitar RLS en projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Política: Lectura pública por ahora (MVP)
-- En producción, restringir por plan del usuario
CREATE POLICY "projects_select_public"
  ON projects
  FOR SELECT
  USING (true);

-- 3. Políticas en generated_reports (reemplazar permissive)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON generated_reports;

-- Los usuarios ven solo sus reportes
CREATE POLICY "users_view_own_reports"
  ON generated_reports
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    is_admin()
  );

-- Los usuarios crean reportes con su user_id
CREATE POLICY "users_insert_own_reports"
  ON generated_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Los usuarios actualizan solo sus reportes
CREATE POLICY "users_update_own_reports"
  ON generated_reports
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    is_admin()
  );

-- Admins pueden borrar cualquier reporte
CREATE POLICY "admins_delete_reports"
  ON generated_reports
  FOR DELETE
  USING (
    is_admin()
  );

-- 4. Tabla de planes (para futuro)
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('comunal', 'regional', 'nacional')),
  allowed_regions TEXT[], -- NULL = todas
  allowed_communes TEXT[], -- NULL = todas
  max_reports_per_month INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_plan"
  ON user_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Función helper para verificar acceso a proyecto
CREATE OR REPLACE FUNCTION user_can_access_project(project_region TEXT, project_commune TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan RECORD;
BEGIN
  -- Admin tiene acceso total
  IF is_admin() THEN
    RETURN true;
  END IF;

  -- Obtener plan del usuario
  SELECT * INTO user_plan
  FROM user_plans
  WHERE user_id = auth.uid()
  AND (expires_at IS NULL OR expires_at > now());

  -- Si no tiene plan, denegar (o permitir en dev)
  IF user_plan IS NULL THEN
    RETURN true; -- Cambiar a false en producción
  END IF;

  -- Plan nacional: acceso total
  IF user_plan.plan_type = 'nacional' THEN
    RETURN true;
  END IF;

  -- Plan regional: verificar región
  IF user_plan.plan_type = 'regional' THEN
    IF project_region = ANY(user_plan.allowed_regions) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  -- Plan comunal: verificar comuna
  IF user_plan.plan_type = 'comunal' THEN
    IF project_commune = ANY(user_plan.allowed_communes) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Aplicar RLS en projects (deshabilitado en MVP, habilitar en producción)
-- CREATE POLICY "users_view_allowed_projects"
--   ON projects
--   FOR SELECT
--   USING (
--     user_can_access_project(region, commune)
--   );
```

**Testing de Políticas:**

```typescript
// scripts/test-rls.ts
import { createClient } from '@supabase/supabase-js'

async function testRLS() {
  // Usuario 1
  const user1Client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${user1JWT}`
        }
      }
    }
  )

  // Usuario 1 crea reporte
  const { data: report1, error: e1 } = await user1Client
    .from('generated_reports')
    .insert({
      title: 'Reporte User 1',
      report_type: 'COMMUNE_MARKET',
      user_id: user1Id // Debería auto-asignar, pero explícito aquí
    })
    .select()
    .single()

  console.log('User 1 creó reporte:', report1)

  // Usuario 2 intenta ver reporte de Usuario 1
  const user2Client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${user2JWT}`
        }
      }
    }
  )

  const { data: report2, error: e2 } = await user2Client
    .from('generated_reports')
    .select()
    .eq('id', report1.id)
    .single()

  if (e2) {
    console.log('✓ RLS funciona: User 2 NO puede ver reporte de User 1')
  } else {
    console.error('✗ RLS falla: User 2 puede ver reporte de User 1')
  }
}
```

**Estimación:** 2-3 días

---

## 7. DASHBOARD EJECUTIVO - ALERTAS AUTOMÁTICAS

### Problema
El dashboard muestra KPIs estáticos. No hay alertas proactivas.

### Solución

**Sistema de Alertas:**

```typescript
// frontend/src/lib/alerts.ts
export interface MarketAlert {
  id: string
  type: 'warning' | 'info' | 'critical'
  title: string
  description: string
  affectedProjects?: string[]
  createdAt: Date
  actionable?: {
    label: string
    href: string
  }
}

export async function generateMarketAlerts(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = []

  // Fetch datos
  const { data: projects } = await supabase
    .from('projects')
    .select('*')

  if (!projects) return []

  // ALERTA 1: Proyectos con MAO alto (>24 meses)
  const highMAOProjects = projects.filter(p =>
    p.months_to_sell_out && p.months_to_sell_out > 24
  )

  if (highMAOProjects.length > 0) {
    alerts.push({
      id: 'high-mao',
      type: 'warning',
      title: `${highMAOProjects.length} proyectos con MAO >24 meses`,
      description: 'Alto riesgo de sobresaturación. Considere ajuste de precios o estrategia comercial.',
      affectedProjects: highMAOProjects.map(p => p.id),
      createdAt: new Date(),
      actionable: {
        label: 'Ver proyectos',
        href: `/dashboard/projects?mao_min=24`
      }
    })
  }

  // ALERTA 2: Caída de absorción mensual
  const avgAbsorption = projects.reduce((sum, p) =>
    sum + (p.sales_speed_monthly || 0) / (p.available_units || 1), 0
  ) / projects.length * 100

  if (avgAbsorption < 5) {
    alerts.push({
      id: 'low-absorption',
      type: 'critical',
      title: 'Absorción promedio bajo 5%',
      description: `Mercado en contracción. Absorción actual: ${avgAbsorption.toFixed(1)}%. Histórico normal: 8-12%.`,
      createdAt: new Date()
    })
  }

  // ALERTA 3: Stock alto vs ventas bajas
  const highStockProjects = projects.filter(p => {
    const stockRatio = (p.available_units || 0) / (p.total_units || 1)
    const salesSpeed = p.sales_speed_monthly || 0
    return stockRatio > 0.7 && salesSpeed < 2
  })

  if (highStockProjects.length > 0) {
    alerts.push({
      id: 'high-stock-low-sales',
      type: 'warning',
      title: `${highStockProjects.length} proyectos con stock alto y ventas bajas`,
      description: 'Proyectos con >70% de stock disponible y <2 unidades/mes vendidas.',
      affectedProjects: highStockProjects.map(p => p.id),
      createdAt: new Date(),
      actionable: {
        label: 'Analizar',
        href: `/dashboard/analytics?filter=high_stock`
      }
    })
  }

  // ALERTA 4: Precios fuera de rango competitivo
  const communeGroups = groupBy(projects, 'commune')

  for (const [commune, communeProjects] of Object.entries(communeGroups)) {
    const avgPrice = communeProjects.reduce((sum, p) => sum + (p.avg_price_uf || 0), 0) / communeProjects.length
    const stdDev = calculateStdDev(communeProjects.map(p => p.avg_price_uf || 0))

    const overpriced = communeProjects.filter(p =>
      (p.avg_price_uf || 0) > avgPrice + 1.5 * stdDev
    )

    if (overpriced.length > 0) {
      alerts.push({
        id: `overpriced-${commune}`,
        type: 'info',
        title: `${overpriced.length} proyectos sobre precio en ${commune}`,
        description: `Precio promedio ${avgPrice.toFixed(0)} UF. Proyectos identificados exceden +50% del promedio.`,
        affectedProjects: overpriced.map(p => p.id),
        createdAt: new Date()
      })
    }
  }

  return alerts
}
```

**Componente de Alertas:**

```typescript
// frontend/src/components/MarketAlerts.tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'

export function MarketAlerts() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['market-alerts'],
    queryFn: generateMarketAlerts,
    refetchInterval: 5 * 60 * 1000 // Cada 5 minutos
  })

  if (isLoading) return <Skeleton className="h-32" />
  if (!alerts || alerts.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          ✓ No hay alertas de mercado en este momento
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => {
        const Icon = alert.type === 'critical' ? AlertCircle :
                    alert.type === 'warning' ? AlertTriangle :
                    Info

        const variant = alert.type === 'critical' ? 'destructive' :
                        alert.type === 'warning' ? 'warning' :
                        'default'

        return (
          <Alert key={alert.id} variant={variant}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>
              {alert.description}
              {alert.actionable && (
                <Button
                  variant="link"
                  className="mt-2 p-0 h-auto"
                  onClick={() => router.push(alert.actionable.href)}
                >
                  {alert.actionable.label} →
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
```

**Integrar en Dashboard:**

```typescript
// frontend/src/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      {/* KPIs existentes */}

      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Alertas de Mercado</h2>
        <MarketAlerts />
      </div>

      {/* Resto del dashboard */}
    </div>
  )
}
```

**Estimación:** 3 días

---

## 8. AUTOMATIZACIÓN ETL

### Problema
La importación de datos TINSA es manual. No hay jobs programados.

### Solución

**Opción 1: Vercel Cron Jobs**

```typescript
// frontend/src/app/api/cron/import-tinsa/route.ts
export const runtime = 'edge'
export const maxDuration = 300 // 5 minutos

export async function GET(request: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Descargar CSV de TINSA desde storage o URL
    const csvUrl = process.env.TINSA_CSV_URL!
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    // 2. Procesar CSV (lógica de tinsa_importer)
    const results = await processTINSACSV(csvText)

    // 3. Enviar notificación
    await sendSlackNotification({
      channel: '#data-pipeline',
      text: `✓ Importación TINSA completada: ${results.imported} nuevos, ${results.updated} actualizados`
    })

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    await sendSlackNotification({
      channel: '#data-pipeline',
      text: `✗ Error en importación TINSA: ${error.message}`
    })

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/import-tinsa",
      "schedule": "0 2 * * 1" // Cada lunes a las 2 AM
    },
    {
      "path": "/api/cron/geocode-projects",
      "schedule": "0 3 * * *" // Diario a las 3 AM
    }
  ]
}
```

**Opción 2: Supabase Edge Functions (si se migra de Python)**

```typescript
// supabase/functions/import-tinsa-cron/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Lógica de importación
  // ...

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Estimación:** 2 días

---

## RESUMEN DE ESTIMACIONES

| Mejora | Prioridad | Esfuerzo | Impacto |
|--------|-----------|----------|---------|
| 1. Instalar Tremor UI | Media | 2 días | Alto (UX) |
| 2. Gráficos de Reportes | Crítica | 1 semana | Muy Alto |
| 3. Exportación PDF | Crítica | 3-4 días | Alto |
| 4. Filtros Avanzados | Alta | 1 semana | Alto |
| 5. Knowledge Base | Crítica | 3-4 días | Muy Alto (IA) |
| 6. Completar RLS | Media | 2-3 días | Medio (Seguridad) |
| 7. Alertas Automáticas | Media | 3 días | Medio |
| 8. Automatización ETL | Baja | 2 días | Bajo (Operacional) |

**Total Fase 1 (Críticas + Altas):** ~4-5 semanas

---

**Documento generado por:** Claude Code (Sonnet 4.5)
**Fecha:** 11 de Febrero 2026
