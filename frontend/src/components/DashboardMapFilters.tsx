'use client'

import { useEffect, useMemo, useState } from 'react'
import { Grid, Card, Metric, Text, BadgeDelta, Flex, Title } from '@tremor/react'
import { Building2, Home, TrendingUp, Users, RotateCcw, Filter, Sparkles } from 'lucide-react'
import MapboxMap from '@/components/MapboxMap'
import MarketOverviewChart from '@/components/charts/MarketOverviewChart'
import { ProductMixChart } from '@/components/charts/ProductMixChart'
import { PriceRangeChart } from '@/components/charts/PriceRangeChart'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type ProjectTypology = {
    bedrooms: number | null
    bathrooms: number | null
    typology_code: string | null
}

type DashboardProject = {
    id: string
    name: string
    developer: string | null
    commune: string | null
    region: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    avg_price_uf: number | null
    avg_price_m2_uf: number | null
    min_price_uf: number | null
    max_price_uf: number | null
    total_units: number | null
    sold_units: number | null
    available_units: number | null
    sales_speed_monthly: number | null
    project_status: string | null
    property_type: string | null
    year: number | null
    period: string | null
    category: string | null
    subsidy_type: string | null
    construction_status: string | null
    project_typologies?: ProjectTypology[] | null
}

type FilterState = {
    year: string
    semester: string
    quarter: string
    region: string
    commune: string
    product: string
    typology: string
    ticketRange: string
    propertyStatus: string
    projectType: string
    subsidyType: string
    absorptionRange: string
    maoRange: string
}

type SelectOption = {
    value: string
    label: string
}

const DEFAULT_FILTERS: FilterState = {
    year: 'all',
    semester: 'all',
    quarter: 'all',
    region: 'all',
    commune: 'all',
    product: 'all',
    typology: 'all',
    ticketRange: 'all',
    propertyStatus: 'all',
    projectType: 'all',
    subsidyType: 'all',
    absorptionRange: 'all',
    maoRange: 'all',
}

const PRICE_RANGES = [
    { key: '1000-2000', label: '1.000 - 2.000 UF', min: 1000, max: 2000 },
    { key: '2000-3000', label: '2.000 - 3.000 UF', min: 2000, max: 3000 },
    { key: '3000-4000', label: '3.000 - 4.000 UF', min: 3000, max: 4000 },
    { key: '4000-5000', label: '4.000 - 5.000 UF', min: 4000, max: 5000 },
    { key: '5000-7000', label: '5.000 - 7.000 UF', min: 5000, max: 7000 },
    { key: '7000+', label: '7.000+ UF', min: 7000, max: Number.MAX_SAFE_INTEGER },
]

const QUARTER_TO_PERIOD: Record<string, string> = {
    q1: '1P',
    q2: '1P',
    q3: '2P',
    q4: '2P',
}

const ABSORPTION_RANGES = [
    { key: '0-20', label: '0% - 20%', min: 0, max: 20 },
    { key: '20-40', label: '20% - 40%', min: 20, max: 40 },
    { key: '40-60', label: '40% - 60%', min: 40, max: 60 },
    { key: '60-80', label: '60% - 80%', min: 60, max: 80 },
    { key: '80-100', label: '80% - 100%', min: 80, max: 101 },
]

const MAO_RANGES = [
    { key: '0-6', label: '0 - 6 meses', min: 0, max: 6 },
    { key: '6-12', label: '6 - 12 meses', min: 6, max: 12 },
    { key: '12-24', label: '12 - 24 meses', min: 12, max: 24 },
    { key: '24+', label: '24+ meses', min: 24, max: Number.MAX_SAFE_INTEGER },
]

const normalize = (value?: string | null) =>
    (value || '')
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()

const toTitleCase = (value: string) =>
    value
        .trim()
        .toLocaleLowerCase('es-CL')
        .replace(/(^|\s|-)\S/g, (char) => char.toLocaleUpperCase('es-CL'))

const buildUniqueOptions = (
    values: Array<string | null | undefined>,
    labelFormatter?: (value: string) => string
): SelectOption[] => {
    const map = new Map<string, string>()

    values.forEach((raw) => {
        if (!raw) return
        const key = normalize(raw)
        if (!key) return
        if (!map.has(key)) {
            map.set(key, labelFormatter ? labelFormatter(raw) : raw.trim())
        }
    })

    return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es-CL'))
}

const formatTypology = (t: ProjectTypology) => {
    if (t.typology_code) return t.typology_code.toUpperCase().replace(/\s+/g, '')
    if (typeof t.bedrooms === 'number' && typeof t.bathrooms === 'number') {
        return `${t.bedrooms}D-${t.bathrooms}B`
    }
    return null
}

const projectMatchesTypology = (project: DashboardProject, selectedTypology: string) => {
    const typologies = project.project_typologies || []
    return typologies.some((t) => formatTypology(t) === selectedTypology)
}

const projectMatchesTicket = (project: DashboardProject, ticketRange: string) => {
    const range = PRICE_RANGES.find((r) => r.key === ticketRange)
    if (!range) return true
    const price = project.avg_price_uf || 0
    return price >= range.min && price < range.max
}

const getAbsorptionPct = (project: DashboardProject) => {
    const total = project.total_units || 0
    const sold = project.sold_units || 0
    if (total <= 0) return 0
    return (sold / total) * 100
}

const getMao = (project: DashboardProject) => {
    const speed = project.sales_speed_monthly || 0
    const stock = project.available_units || 0
    if (speed > 0) return stock / speed
    return Number.MAX_SAFE_INTEGER
}

const inRange = (
    value: number,
    ranges: Array<{ key: string; min: number; max: number }>,
    selected: string
) => {
    const range = ranges.find((r) => r.key === selected)
    if (!range) return true
    return value >= range.min && value < range.max
}

const isSubsidized = (project: DashboardProject) => {
    const subsidy = normalize(project.subsidy_type)
    const category = normalize(project.category)
    if (!subsidy && !category) return false
    if (subsidy.includes('sin subsidio') || category.includes('sin subsidio')) return false
    return true
}

interface DashboardMapFiltersProps {
    projects: DashboardProject[]
}

export default function DashboardMapFilters({ projects }: DashboardMapFiltersProps) {
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
    const [visibleProjectIds, setVisibleProjectIds] = useState<string[] | null>(null)
    const [useViewportOnly, setUseViewportOnly] = useState(true)
    const [aiAnalysis, setAiAnalysis] = useState<string>('')
    const [analysisLoading, setAnalysisLoading] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    useEffect(() => {
        setVisibleProjectIds(null)
    }, [filters])

    const years = useMemo(() => {
        return Array.from(new Set(projects.map((p) => p.year).filter((y): y is number => typeof y === 'number')))
            .sort((a, b) => b - a)
    }, [projects])

    const regionOptions = useMemo(() => {
        return buildUniqueOptions(projects.map((p) => p.region))
    }, [projects])

    const communeOptions = useMemo(() => {
        const scoped = filters.region === 'all'
            ? projects
            : projects.filter((p) => normalize(p.region) === filters.region)

        return buildUniqueOptions(scoped.map((p) => p.commune))
    }, [projects, filters.region])

    const productOptions = useMemo(() => {
        return buildUniqueOptions(
            projects.map((p) => p.property_type),
            (value) => toTitleCase(value)
        )
    }, [projects])

    const typologies = useMemo(() => {
        const allTypologies = new Set<string>()
        projects.forEach((project) => {
            const list = project.project_typologies || []
            list.forEach((t) => {
                const value = formatTypology(t)
                if (value) allTypologies.add(value)
            })
        })
        return Array.from(allTypologies).sort((a, b) => a.localeCompare(b))
    }, [projects])

    const statusOptions = useMemo(() => {
        return buildUniqueOptions([
            ...projects.map((p) => p.project_status),
            ...projects.map((p) => p.construction_status),
        ])
    }, [projects])

    const subsidyTypeOptions = useMemo(() => {
        return buildUniqueOptions(projects.map((p) => p.subsidy_type))
    }, [projects])

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            if (filters.year !== 'all' && project.year !== Number(filters.year)) return false

            if (filters.semester !== 'all' && normalize(project.period) !== normalize(filters.semester)) return false

            if (filters.quarter !== 'all') {
                const inferredPeriod = QUARTER_TO_PERIOD[filters.quarter]
                if (!inferredPeriod || normalize(project.period) !== normalize(inferredPeriod)) return false
            }

            if (filters.region !== 'all' && normalize(project.region) !== filters.region) return false
            if (filters.commune !== 'all' && normalize(project.commune) !== filters.commune) return false
            if (filters.product !== 'all' && normalize(project.property_type) !== filters.product) return false

            if (filters.typology !== 'all' && !projectMatchesTypology(project, filters.typology)) return false

            if (filters.ticketRange !== 'all' && !projectMatchesTicket(project, filters.ticketRange)) return false
            if (filters.absorptionRange !== 'all' && !inRange(getAbsorptionPct(project), ABSORPTION_RANGES, filters.absorptionRange)) return false
            if (filters.maoRange !== 'all' && !inRange(getMao(project), MAO_RANGES, filters.maoRange)) return false

            if (filters.propertyStatus !== 'all') {
                const statusA = normalize(project.project_status)
                const statusB = normalize(project.construction_status)
                if (statusA !== filters.propertyStatus && statusB !== filters.propertyStatus) return false
            }

            if (filters.projectType === 'sin_subsidio' && isSubsidized(project)) return false
            if (filters.projectType === 'con_subsidio' && !isSubsidized(project)) return false

            if (filters.subsidyType !== 'all' && normalize(project.subsidy_type) !== filters.subsidyType) return false

            return true
        })
    }, [projects, filters])

    const mapProjects = useMemo(() => filteredProjects.filter((p) => p.latitude && p.longitude), [filteredProjects])
    const mapScopedProjects = useMemo(() => {
        if (visibleProjectIds === null) return filteredProjects
        const visibleSet = new Set(visibleProjectIds)
        return filteredProjects.filter((project) => visibleSet.has(project.id))
    }, [filteredProjects, visibleProjectIds])
    const analysisProjects = useMemo(
        () => (useViewportOnly ? mapScopedProjects : filteredProjects),
        [useViewportOnly, mapScopedProjects, filteredProjects]
    )

    const kpis = useMemo(() => {
        const totalStock = analysisProjects.reduce((acc, p) => acc + (p.available_units || 0), 0)
        const totalSold = analysisProjects.reduce((acc, p) => acc + (p.sold_units || 0), 0)

        const speedValues = analysisProjects.map((p) => p.sales_speed_monthly || 0)
        const avgSalesSpeed = speedValues.length > 0
            ? Number((speedValues.reduce((acc, value) => acc + value, 0) / speedValues.length).toFixed(1))
            : 0

        const baseline = projects.length || 1
        const scopeDelta = Number((((analysisProjects.length - projects.length) / baseline) * 100).toFixed(1))
        const deltaType = scopeDelta >= 0 ? 'moderateIncrease' : 'moderateDecrease'

        return {
            projectCount: analysisProjects.length,
            totalStock,
            avgSalesSpeed,
            totalSold,
            scopeDelta,
            deltaType,
        }
    }, [analysisProjects, projects.length])

    const regionData = useMemo(() => {
        const regionMap = new Map<string, { region: string; projects: number; totalUnits: number; soldUnits: number; availableUnits: number }>()

        analysisProjects.forEach((p) => {
            const region = p.region || 'Sin Región'
            if (!regionMap.has(region)) {
                regionMap.set(region, {
                    region,
                    projects: 0,
                    totalUnits: 0,
                    soldUnits: 0,
                    availableUnits: 0,
                })
            }

            const row = regionMap.get(region)!
            row.projects += 1
            row.totalUnits += p.total_units || 0
            row.soldUnits += p.sold_units || 0
            row.availableUnits += p.available_units || 0
        })

        return Array.from(regionMap.values()).sort((a, b) => b.projects - a.projects).slice(0, 5)
    }, [analysisProjects])

    const mixData = useMemo(() => {
        const mixMap = new Map<string, number>()
        analysisProjects.forEach((p) => {
            const type = p.property_type || 'Otros'
            mixMap.set(type, (mixMap.get(type) || 0) + 1)
        })

        return Array.from(mixMap.entries())
            .map(([typology, count]) => ({ typology, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
    }, [analysisProjects])

    const priceRangeData = useMemo(() => {
        return PRICE_RANGES.map((range) => {
            const scoped = analysisProjects.filter((p) => {
                const price = p.avg_price_uf || 0
                return price >= range.min && price < range.max
            })

            return {
                range: range.label,
                oferta: scoped.reduce((acc, p) => acc + (p.available_units || 0), 0),
                vendidas: scoped.reduce((acc, p) => acc + (p.sold_units || 0), 0),
            }
        })
    }, [analysisProjects])

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value }
            if (key === 'region') next.commune = 'all'
            return next
        })
    }

    const resetFilters = () => setFilters(DEFAULT_FILTERS)

    const geoScopeLabel = useMemo(() => {
        if (filters.commune !== 'all') {
            const selected = communeOptions.find((c) => c.value === filters.commune)
            return `Comuna: ${selected?.label || 'Seleccionada'}`
        }
        if (filters.region !== 'all') {
            const selected = regionOptions.find((r) => r.value === filters.region)
            return `Región: ${selected?.label || 'Seleccionada'}`
        }
        return 'Cobertura nacional'
    }, [filters.region, filters.commune, regionOptions, communeOptions])

    const timeScopeLabel = useMemo(() => {
        const year = filters.year !== 'all' ? `Año ${filters.year}` : 'Todos los años'
        const semester = filters.semester !== 'all' ? ` · ${filters.semester}` : ''
        const quarter = filters.quarter !== 'all' ? ` · ${filters.quarter.toUpperCase()}` : ''
        return `${year}${semester}${quarter}`
    }, [filters.year, filters.semester, filters.quarter])

    const topCommunes = useMemo(() => {
        const map = new Map<string, number>()
        analysisProjects.forEach((p) => {
            const commune = p.commune || 'Sin comuna'
            map.set(commune, (map.get(commune) || 0) + (p.available_units || 0))
        })
        return Array.from(map.entries())
            .map(([commune, stock]) => ({ commune, stock }))
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 5)
    }, [analysisProjects])

    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(async () => {
            if (analysisProjects.length === 0) {
                setAiAnalysis('No hay datos en el alcance actual para generar análisis IA.')
                setAnalysisError(null)
                return
            }

            setAnalysisLoading(true)
            setAnalysisError(null)
            try {
                const response = await fetch('/api/brain/dashboard-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filters,
                        scope: {
                            mode: useViewportOnly ? 'viewport+filters' : 'filters-only',
                            geo: geoScopeLabel,
                            time: timeScopeLabel,
                        },
                        kpis,
                        regionData,
                        mixData,
                        priceRangeData,
                        topCommunes,
                    }),
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error('No se pudo generar análisis IA')
                }

                const data = await response.json()
                setAiAnalysis(data.analysis || 'Sin contenido de análisis.')
            } catch (error: any) {
                if (error.name === 'AbortError') return
                setAnalysisError(error.message || 'Error generando análisis IA')
            } finally {
                setAnalysisLoading(false)
            }
        }, 900)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [
        filters,
        useViewportOnly,
        geoScopeLabel,
        timeScopeLabel,
        kpis,
        regionData,
        mixData,
        priceRangeData,
        topCommunes,
        analysisProjects.length,
    ])

    return (
        <div className="space-y-6">
            <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
                <Card decoration="top" decorationColor="blue">
                    <Flex alignItems="start">
                        <div className="truncate">
                            <Text>Proyectos Filtrados</Text>
                            <Metric>{kpis.projectCount.toLocaleString()}</Metric>
                        </div>
                        <BadgeDelta deltaType={kpis.deltaType as any}>
                            {`${Math.abs(kpis.scopeDelta)}%`}
                        </BadgeDelta>
                    </Flex>
                    <Flex className="mt-4 space-x-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <Text className="truncate text-slate-500">{useViewportOnly ? 'Viewport + filtros' : 'Solo filtros'}</Text>
                    </Flex>
                </Card>

                <Card decoration="top" decorationColor="amber">
                    <Flex alignItems="start">
                        <div className="truncate">
                            <Text>Stock Disponible</Text>
                            <Metric>{kpis.totalStock.toLocaleString()}</Metric>
                        </div>
                        <BadgeDelta deltaType="moderateDecrease">filtro activo</BadgeDelta>
                    </Flex>
                    <Flex className="mt-4 space-x-2">
                        <Home className="h-4 w-4 text-slate-400" />
                        <Text className="truncate text-slate-500">Unidades en venta</Text>
                    </Flex>
                </Card>

                <Card decoration="top" decorationColor="blue">
                    <Flex alignItems="start">
                        <div className="truncate">
                            <Text>Velocidad Venta</Text>
                            <Metric>{kpis.avgSalesSpeed}</Metric>
                        </div>
                        <BadgeDelta deltaType="increase">u/mes</BadgeDelta>
                    </Flex>
                    <Flex className="mt-4 space-x-2">
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                        <Text className="truncate text-slate-500">Promedio ponderado</Text>
                    </Flex>
                </Card>

                <Card decoration="top" decorationColor="blue">
                    <Flex alignItems="start">
                        <div className="truncate">
                            <Text>Ventas Totales</Text>
                            <Metric>{kpis.totalSold.toLocaleString()}</Metric>
                        </div>
                        <BadgeDelta deltaType="increase">histórico</BadgeDelta>
                    </Flex>
                    <Flex className="mt-4 space-x-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <Text className="truncate text-slate-500">Unidades vendidas</Text>
                    </Flex>
                </Card>
            </Grid>

            <Card className="p-5">
                <Flex alignItems="start">
                    <div>
                        <Title className="text-lg">Análisis IA Automático</Title>
                        <Text className="text-xs text-slate-500 mt-1">
                            Se actualiza automáticamente con filtros, tiempo y alcance geográfico.
                        </Text>
                    </div>
                    <Sparkles className="h-5 w-5 text-blue-500" />
                </Flex>

                <div className="mt-4 rounded-lg border bg-slate-50/70 p-4">
                    {analysisLoading && (
                        <Text className="text-sm text-slate-500">Generando lectura ejecutiva...</Text>
                    )}

                    {!analysisLoading && analysisError && (
                        <Text className="text-sm text-red-600">{analysisError}</Text>
                    )}

                    {!analysisLoading && !analysisError && (
                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {aiAnalysis || 'Ajusta filtros para generar insights.'}
                        </div>
                    )}
                </div>
            </Card>

            <div className="space-y-6 mt-6">
                <Card className="h-[740px] flex flex-col p-0 overflow-hidden">
                    <div className="p-6 border-b">
                        <Title>Mapa de Actividad Inmobiliaria</Title>
                        <Text className="text-xs text-slate-500 mt-1">
                            {geoScopeLabel} · {timeScopeLabel}
                        </Text>
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute z-20 left-3 right-3 top-3 rounded-xl border bg-white/95 backdrop-blur-sm shadow-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-slate-600" />
                                    <p className="font-semibold text-slate-800 text-sm">Filtros sobre el mapa</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="inline-flex rounded-md border bg-muted/30 p-1">
                                        <button
                                            type="button"
                                            className={`px-2.5 py-1 text-xs rounded ${useViewportOnly ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                                            onClick={() => setUseViewportOnly(true)}
                                        >
                                            Viewport + filtros
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-2.5 py-1 text-xs rounded ${!useViewportOnly ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                                            onClick={() => setUseViewportOnly(false)}
                                        >
                                            Solo filtros
                                        </button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={resetFilters}>
                                        <RotateCcw className="h-3 w-3 mr-2" />
                                        Limpiar
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Absorción</Label>
                                    <Select value={filters.absorptionRange} onValueChange={(v) => updateFilter('absorptionRange', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {ABSORPTION_RANGES.map((range) => (
                                                <SelectItem key={range.key} value={range.key}>{range.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Meses para Agotar</Label>
                                    <Select value={filters.maoRange} onValueChange={(v) => updateFilter('maoRange', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {MAO_RANGES.map((range) => (
                                                <SelectItem key={range.key} value={range.key}>{range.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Año</Label>
                                    <Select value={filters.year} onValueChange={(v) => updateFilter('year', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Semestre</Label>
                                    <Select value={filters.semester} onValueChange={(v) => updateFilter('semester', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="1P">1P</SelectItem>
                                            <SelectItem value="2P">2P</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Trimestre</Label>
                                    <Select value={filters.quarter} onValueChange={(v) => updateFilter('quarter', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="q1">Q1</SelectItem>
                                            <SelectItem value="q2">Q2</SelectItem>
                                            <SelectItem value="q3">Q3</SelectItem>
                                            <SelectItem value="q4">Q4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Región</Label>
                                    <Select value={filters.region} onValueChange={(v) => updateFilter('region', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {regionOptions.map((region) => (
                                                <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Comuna</Label>
                                    <Select value={filters.commune} onValueChange={(v) => updateFilter('commune', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {communeOptions.map((commune) => (
                                                <SelectItem key={commune.value} value={commune.value}>{commune.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Producto</Label>
                                    <Select value={filters.product} onValueChange={(v) => updateFilter('product', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {productOptions.map((product) => (
                                                <SelectItem key={product.value} value={product.value}>{product.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Tipología</Label>
                                    <Select value={filters.typology} onValueChange={(v) => updateFilter('typology', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {typologies.map((typology) => <SelectItem key={typology} value={typology}>{typology}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Ticket UF</Label>
                                    <Select value={filters.ticketRange} onValueChange={(v) => updateFilter('ticketRange', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {PRICE_RANGES.map((range) => <SelectItem key={range.key} value={range.key}>{range.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Estado propiedad</Label>
                                    <Select value={filters.propertyStatus} onValueChange={(v) => updateFilter('propertyStatus', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo de Proyecto</Label>
                                    <Select value={filters.projectType} onValueChange={(v) => updateFilter('projectType', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="sin_subsidio">Sin Subsidio</SelectItem>
                                            <SelectItem value="con_subsidio">Con Subsidio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo de Subsidio</Label>
                                    <Select value={filters.subsidyType} onValueChange={(v) => updateFilter('subsidyType', v)}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {subsidyTypeOptions.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <MapboxMap
                            projects={mapProjects as any[]}
                            onVisibleProjectIdsChange={setVisibleProjectIds}
                        />
                    </div>
                </Card>

                <Grid numItemsLg={3} className="gap-6">
                    <MarketOverviewChart data={regionData} />
                    <ProductMixChart data={mixData} />
                    <PriceRangeChart data={priceRangeData} />
                </Grid>
            </div>
        </div>
    )
}
