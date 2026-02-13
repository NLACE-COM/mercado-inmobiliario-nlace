'use client'

import { useEffect, useMemo, useState } from 'react'
import { Grid, Card, Text, BadgeDelta, Title } from '@tremor/react'
import { Filter, Sparkles, Wand2, BarChart3 } from 'lucide-react'
import MapboxMap from '@/components/MapboxMap'
import MarketOverviewChart from '@/components/charts/MarketOverviewChart'
import { ProductMixChart } from '@/components/charts/ProductMixChart'
import { PriceRangeChart } from '@/components/charts/PriceRangeChart'
import ParticipationEvolutionChart from '@/components/charts/ParticipationEvolutionChart'
import TypologyCompetitionChart from '@/components/charts/TypologyCompetitionChart'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import MarkdownRenderer from '@/components/shared/MarkdownRenderer'
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
    stock?: number | null
    total_units?: number | null
    current_price_uf?: number | null
    price_per_m2_uf?: number | null
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
}

type SelectOption = {
    value: string
    label: string
}

type GeneratedSnapshot = {
    kpis: {
        projectCount: number
        totalStock: number
        avgSalesSpeed: number
        totalSold: number
        scopeDelta: number
        deltaType: string
    }
    regionData: Array<{ region: string; projects: number; totalUnits: number; soldUnits: number; availableUnits: number }>
    mixData: Array<{ typology: string; count: number }>
    priceRangeData: Array<{ range: string; oferta: number; vendidas: number }>
    evolutionData: {
        offerSeries: any[]
        salesSeries: any[]
    }
    typologyCompetition: {
        metrics: Array<{
            key: string
            title: string
            baseLabel: string
            baseValue: number
            items: Array<{
                typology: string
                value: number
                percent: number
                color: string
            }>
        }>
        priceData: Array<{
            typology: string
            avg_price_uf: number
            avg_price_m2: number
        }>
    }
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
}

const PRICE_RANGES = [
    { key: '1000-2000', label: '1.000 - 2.000 UF', min: 1000, max: 2000 },
    { key: '2000-3000', label: '2.000 - 3.000 UF', min: 2000, max: 3000 },
    { key: '3000-4000', label: '3.000 - 4.000 UF', min: 3000, max: 4000 },
    { key: '4000-5000', label: '4.000 - 5.000 UF', min: 4000, max: 5000 },
    { key: '5000-7000', label: '5.000 - 7.000 UF', min: 5000, max: 7000 },
    { key: '7000+', label: '7.000+ UF', min: 7000, max: Number.MAX_SAFE_INTEGER },
]

const getEvolutionRangeKey = (priceValue: number) => {
    if (priceValue < 2000) return 'r1000_2000'
    if (priceValue < 3000) return 'r2000_3000'
    if (priceValue < 4000) return 'r3000_4000'
    if (priceValue < 5000) return 'r4000_5000'
    if (priceValue < 7000) return 'r5000_7000'
    return 'r7000_plus'
}

const TYPOLOGY_COLORS = ['#0EA5E9', '#B91C1C', '#FBBF24', '#1E3A8A', '#64748B', '#8B5CF6']

const QUARTER_TO_PERIOD: Record<string, string> = {
    q1: '1P',
    q2: '1P',
    q3: '2P',
    q4: '2P',
}

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
    const [hasGenerated, setHasGenerated] = useState(false)
    const [generatedAt, setGeneratedAt] = useState<string | null>(null)
    const [generatedSnapshot, setGeneratedSnapshot] = useState<GeneratedSnapshot | null>(null)
    const [aiAnalysis, setAiAnalysis] = useState<string>('')
    const [analysisLoading, setAnalysisLoading] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    useEffect(() => {
        setVisibleProjectIds(null)
    }, [filters])

    useEffect(() => {
        setHasGenerated(false)
    }, [filters, visibleProjectIds])

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
    const analysisProjects = useMemo(() => mapScopedProjects, [mapScopedProjects])

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

    const evolutionData = useMemo(() => {
        type Bucket = {
            period: string
            totalOffer: number
            totalSales: number
            offerByRange: Record<string, number>
            salesByRange: Record<string, number>
        }

        const buckets = new Map<string, Bucket>()

        const fallbackPeriod =
            filters.year !== 'all'
                ? `${filters.year}-${filters.semester !== 'all' ? filters.semester : 'ACT'}`
                : 'ACTUAL'

        analysisProjects.forEach((project) => {
            const period = project.year ? `${project.year}-${project.period || 'NA'}` : fallbackPeriod
            if (!buckets.has(period)) {
                buckets.set(period, {
                    period,
                    totalOffer: 0,
                    totalSales: 0,
                    offerByRange: {
                        r1000_2000: 0,
                        r2000_3000: 0,
                        r3000_4000: 0,
                        r4000_5000: 0,
                        r5000_7000: 0,
                        r7000_plus: 0,
                    },
                    salesByRange: {
                        r1000_2000: 0,
                        r2000_3000: 0,
                        r3000_4000: 0,
                        r4000_5000: 0,
                        r5000_7000: 0,
                        r7000_plus: 0,
                    },
                })
            }

            const bucket = buckets.get(period)!
            const price =
                Number(project.avg_price_uf ?? project.min_price_uf ?? project.max_price_uf ?? 0)
            const offer = project.available_units || 0
            const sales = project.sold_units || 0

            bucket.totalOffer += offer
            bucket.totalSales += sales

            const key = getEvolutionRangeKey(price)
            bucket.offerByRange[key] += offer
            bucket.salesByRange[key] += sales
        })

        const sorted = Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period))

        const toParticipation = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0)

        const offerSeries = sorted.map((bucket) => ({
            period: bucket.period,
            total_units: bucket.totalOffer,
            r1000_2000: toParticipation(bucket.offerByRange.r1000_2000, bucket.totalOffer),
            r2000_3000: toParticipation(bucket.offerByRange.r2000_3000, bucket.totalOffer),
            r3000_4000: toParticipation(bucket.offerByRange.r3000_4000, bucket.totalOffer),
            r4000_5000: toParticipation(bucket.offerByRange.r4000_5000, bucket.totalOffer),
            r5000_7000: toParticipation(bucket.offerByRange.r5000_7000, bucket.totalOffer),
            r7000_plus: toParticipation(bucket.offerByRange.r7000_plus, bucket.totalOffer),
        }))

        const salesSeries = sorted.map((bucket) => ({
            period: bucket.period,
            total_units: bucket.totalSales,
            r1000_2000: toParticipation(bucket.salesByRange.r1000_2000, bucket.totalSales),
            r2000_3000: toParticipation(bucket.salesByRange.r2000_3000, bucket.totalSales),
            r3000_4000: toParticipation(bucket.salesByRange.r3000_4000, bucket.totalSales),
            r4000_5000: toParticipation(bucket.salesByRange.r4000_5000, bucket.totalSales),
            r5000_7000: toParticipation(bucket.salesByRange.r5000_7000, bucket.totalSales),
            r7000_plus: toParticipation(bucket.salesByRange.r7000_plus, bucket.totalSales),
        }))

        return { offerSeries, salesSeries }
    }, [analysisProjects, filters.year, filters.semester])

    const typologyCompetition = useMemo(() => {
        type TypologyAgg = {
            typology: string
            initial: number
            available: number
            sold: number
            monthlySales: number
            weightedPriceUf: number
            weightedPriceM2: number
            weightForPrice: number
        }

        const agg = new Map<string, TypologyAgg>()

        analysisProjects.forEach((project) => {
            const typologies = project.project_typologies || []
            if (typologies.length === 0) return

            const projectTotal = project.total_units || typologies.reduce((sum, t) => sum + (t.total_units || 0), 0) || 1
            const projectMonthlySales = project.sales_speed_monthly || 0

            typologies.forEach((t) => {
                const typology = formatTypology(t)
                if (!typology) return

                const initial = t.total_units || 0
                const available = t.stock || 0
                const sold = Math.max(initial - available, 0)
                const priceUf = t.current_price_uf || 0
                const priceM2 = t.price_per_m2_uf || 0
                const monthlySales = initial > 0 ? (projectMonthlySales * (initial / projectTotal)) : 0

                if (!agg.has(typology)) {
                    agg.set(typology, {
                        typology,
                        initial: 0,
                        available: 0,
                        sold: 0,
                        monthlySales: 0,
                        weightedPriceUf: 0,
                        weightedPriceM2: 0,
                        weightForPrice: 0,
                    })
                }

                const row = agg.get(typology)!
                row.initial += initial
                row.available += available
                row.sold += sold
                row.monthlySales += monthlySales
                if (priceUf > 0) {
                    row.weightedPriceUf += priceUf * Math.max(initial, 1)
                }
                if (priceM2 > 0) {
                    row.weightedPriceM2 += priceM2 * Math.max(initial, 1)
                }
                row.weightForPrice += Math.max(initial, 1)
            })
        })

        const top = Array.from(agg.values())
            .sort((a, b) => b.initial - a.initial)
            .slice(0, 4)

        const withColor = top.map((row, index) => ({
            ...row,
            color: TYPOLOGY_COLORS[index % TYPOLOGY_COLORS.length],
        }))

        const buildMetric = (
            key: string,
            title: string,
            baseLabel: string,
            accessor: (row: typeof withColor[number]) => number
        ) => {
            const baseValue = withColor.reduce((sum, row) => sum + accessor(row), 0)
            return {
                key,
                title,
                baseLabel,
                baseValue,
                items: withColor.map((row) => {
                    const value = accessor(row)
                    return {
                        typology: row.typology,
                        value,
                        percent: baseValue > 0 ? (value / baseValue) * 100 : 0,
                        color: row.color,
                    }
                }),
            }
        }

        const metrics = [
            buildMetric('initial', 'Stock Inicial', 'Base', (row) => row.initial),
            buildMetric('available', 'Disponible', 'Base', (row) => row.available),
            buildMetric('sold', 'Venta Acumulada', 'Base', (row) => row.sold),
            buildMetric('monthlySales', 'Venta / Mes', 'Base', (row) => row.monthlySales),
        ]

        const priceData = withColor.map((row) => ({
            typology: row.typology.replace('-', ' '),
            avg_price_uf: row.weightForPrice > 0 ? row.weightedPriceUf / row.weightForPrice : 0,
            avg_price_m2: row.weightForPrice > 0 ? row.weightedPriceM2 / row.weightForPrice : 0,
        }))

        return { metrics, priceData }
    }, [analysisProjects])

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value }
            if (key === 'region') next.commune = 'all'
            return next
        })
    }

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

    const handleGenerateCharts = async () => {
        const snapshot: GeneratedSnapshot = {
            kpis,
            regionData,
            mixData,
            priceRangeData,
            evolutionData,
            typologyCompetition,
        }

        setGeneratedSnapshot(snapshot)

        if (analysisProjects.length === 0) {
            setAiAnalysis('No hay datos en el alcance actual para generar análisis IA.')
            setAnalysisError(null)
            setHasGenerated(true)
            setGeneratedAt(new Date().toISOString())
            return
        }

        setAnalysisLoading(true)
        setAnalysisError(null)
        setHasGenerated(true)
        setGeneratedAt(new Date().toISOString())

        try {
            const response = await fetch('/api/brain/dashboard-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters,
                    scope: {
                        mode: 'viewport+filters',
                        geo: geoScopeLabel,
                        time: timeScopeLabel,
                    },
                    kpis: snapshot.kpis,
                    regionData: snapshot.regionData,
                    mixData: snapshot.mixData,
                    priceRangeData: snapshot.priceRangeData,
                    topCommunes,
                    evolutionData: snapshot.evolutionData,
                    typologyCompetition: snapshot.typologyCompetition,
                }),
            })

            if (!response.ok) {
                throw new Error('No se pudo generar análisis IA')
            }

            const data = await response.json()
            setAiAnalysis(data.analysis || 'Sin contenido de análisis.')
        } catch (error: any) {
            setAnalysisError(error.message || 'Error generando análisis IA')
        } finally {
            setAnalysisLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <Card className="h-[78vh] min-h-[680px] overflow-hidden rounded-card border-border/80 p-0">
                <div className="relative h-full">
                    <MapboxMap
                        projects={mapProjects as any[]}
                        onVisibleProjectIdsChange={setVisibleProjectIds}
                        controlsPosition="bottom-right"
                        showLegend={false}
                    />

                    <div className="absolute left-3 top-3 z-30 w-[400px] max-w-[calc(100%-24px)]">
                        <div className="glass-panel max-h-[66vh] overflow-y-auto p-4">
                            <div className="rounded-2xl border border-border/75 bg-card/85 p-3.5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Filter className="h-4 w-4 text-primary" />
                                    <p className="text-sm font-semibold text-foreground">Filtros del mapa</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Año</Label>
                                        <Select value={filters.year} onValueChange={(v) => updateFilter('year', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Semestre</Label>
                                        <Select value={filters.semester} onValueChange={(v) => updateFilter('semester', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="1P">1P</SelectItem>
                                                <SelectItem value="2P">2P</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Trimestre</Label>
                                        <Select value={filters.quarter} onValueChange={(v) => updateFilter('quarter', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="q1">Q1</SelectItem>
                                                <SelectItem value="q2">Q2</SelectItem>
                                                <SelectItem value="q3">Q3</SelectItem>
                                                <SelectItem value="q4">Q4</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Región</Label>
                                        <Select value={filters.region} onValueChange={(v) => updateFilter('region', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {regionOptions.map((region) => (
                                                    <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Comuna</Label>
                                        <Select value={filters.commune} onValueChange={(v) => updateFilter('commune', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {communeOptions.map((commune) => (
                                                    <SelectItem key={commune.value} value={commune.value}>{commune.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Producto</Label>
                                        <Select value={filters.product} onValueChange={(v) => updateFilter('product', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {productOptions.map((product) => (
                                                    <SelectItem key={product.value} value={product.value}>{product.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Tipología</Label>
                                        <Select value={filters.typology} onValueChange={(v) => updateFilter('typology', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {typologies.map((typology) => <SelectItem key={typology} value={typology}>{typology}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Ticket UF</Label>
                                        <Select value={filters.ticketRange} onValueChange={(v) => updateFilter('ticketRange', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {PRICE_RANGES.map((range) => <SelectItem key={range.key} value={range.key}>{range.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Estado propiedad</Label>
                                        <Select value={filters.propertyStatus} onValueChange={(v) => updateFilter('propertyStatus', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {statusOptions.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Tipo de Proyecto</Label>
                                        <Select value={filters.projectType} onValueChange={(v) => updateFilter('projectType', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="sin_subsidio">Sin Subsidio</SelectItem>
                                                <SelectItem value="con_subsidio">Con Subsidio</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Tipo de Subsidio</Label>
                                        <Select value={filters.subsidyType} onValueChange={(v) => updateFilter('subsidyType', v)}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
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
                            <Button className="mt-3 h-11 w-full text-sm" onClick={handleGenerateCharts}>
                                <Wand2 className="h-3.5 w-3.5 mr-2" />
                                Generar Informe
                            </Button>
                        </div>
                    </div>

                    <div className="absolute right-3 top-3 z-30 hidden w-[220px] xl:block">
                        <div className="grid grid-cols-1 gap-2">
                            <div className="glass-panel px-3 py-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-muted-foreground">Proyectos</p>
                                    <BadgeDelta deltaType={kpis.deltaType as any}>{`${Math.abs(kpis.scopeDelta)}%`}</BadgeDelta>
                                </div>
                                <p className="text-xl font-semibold">{kpis.projectCount.toLocaleString()}</p>
                            </div>
                            <div className="glass-panel px-3 py-2">
                                <p className="text-[11px] text-muted-foreground">Stock Disponible</p>
                                <p className="text-lg font-semibold">{kpis.totalStock.toLocaleString()}</p>
                            </div>
                            <div className="glass-panel px-3 py-2">
                                <p className="text-[11px] text-muted-foreground">Velocidad Venta</p>
                                <p className="text-lg font-semibold">{kpis.avgSalesSpeed} <span className="text-xs text-muted-foreground">u/mes</span></p>
                            </div>
                            <div className="glass-panel px-3 py-2">
                                <p className="text-[11px] text-muted-foreground">Ventas Totales</p>
                                <p className="text-lg font-semibold">{kpis.totalSold.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {hasGenerated && (
                        <div className="absolute bottom-3 left-3 right-3 z-30 xl:left-[420px] xl:right-[250px]">
                            <div className="glass-panel p-4 md:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-foreground">Lectura IA del escenario filtrado</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {generatedAt ? `Generado: ${new Date(generatedAt).toLocaleString('es-CL')}` : ''}
                                        </p>
                                    </div>
                                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-border/70 bg-card/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                        {geoScopeLabel}
                                    </span>
                                    <span className="rounded-full border border-border/70 bg-card/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                        {timeScopeLabel}
                                    </span>
                                </div>

                                <div className="mt-4 rounded-2xl border border-border/70 bg-background/55 p-4">
                                    {analysisLoading && (
                                        <Text className="text-sm text-muted-foreground">Generando lectura ejecutiva...</Text>
                                    )}

                                    {!analysisLoading && analysisError && (
                                        <Text className="text-sm text-red-600">{analysisError}</Text>
                                    )}

                                    {!analysisLoading && !analysisError && (
                                        <div className="text-sm leading-6 text-foreground/90">
                                            <MarkdownRenderer content={aiAnalysis || 'Sin contenido de análisis.'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 xl:hidden">
                <div className="surface-panel p-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">Proyectos</p>
                        <BadgeDelta deltaType={kpis.deltaType as any}>{`${Math.abs(kpis.scopeDelta)}%`}</BadgeDelta>
                    </div>
                    <p className="text-xl font-semibold">{kpis.projectCount.toLocaleString()}</p>
                </div>
                <div className="surface-panel p-3">
                    <p className="text-[11px] text-muted-foreground">Stock Disponible</p>
                    <p className="text-lg font-semibold">{kpis.totalStock.toLocaleString()}</p>
                </div>
                <div className="surface-panel p-3">
                    <p className="text-[11px] text-muted-foreground">Velocidad Venta</p>
                    <p className="text-lg font-semibold">{kpis.avgSalesSpeed} <span className="text-xs text-muted-foreground">u/mes</span></p>
                </div>
                <div className="surface-panel p-3">
                    <p className="text-[11px] text-muted-foreground">Ventas Totales</p>
                    <p className="text-lg font-semibold">{kpis.totalSold.toLocaleString()}</p>
                </div>
            </div>

            {!hasGenerated && (
                <Card className="rounded-card border-dashed border-border bg-card/65 p-6">
                    <div className="text-center py-3">
                        <Title className="text-lg text-foreground">Panel de Gráficos IA</Title>
                        <Text className="mt-1 text-sm text-muted-foreground">
                            Muévete por el mapa, aplica filtros y presiona <strong>Generar Informe</strong> para construir el panel analítico.
                        </Text>
                    </div>
                </Card>
            )}

            {hasGenerated && (
                <>
                    <Grid numItemsLg={2} className="gap-6">
                        <ParticipationEvolutionChart data={generatedSnapshot?.evolutionData.salesSeries || []} metricLabel="venta" />
                        <ParticipationEvolutionChart data={generatedSnapshot?.evolutionData.offerSeries || []} metricLabel="oferta" />
                    </Grid>

                    <TypologyCompetitionChart
                        metrics={generatedSnapshot?.typologyCompetition.metrics || []}
                        priceData={generatedSnapshot?.typologyCompetition.priceData || []}
                    />

                    <Card className="rounded-card border-border/80 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">Panel de soporte</p>
                        </div>
                        <Grid numItemsLg={3} className="gap-6">
                            <MarketOverviewChart data={generatedSnapshot?.regionData || []} />
                            <ProductMixChart data={generatedSnapshot?.mixData || []} />
                            <PriceRangeChart data={generatedSnapshot?.priceRangeData || []} />
                        </Grid>
                    </Card>
                </>
            )}
        </div>
    )
}
