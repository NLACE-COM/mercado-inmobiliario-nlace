import { createClient } from "@/utils/supabase/server"
import MapboxMap from "@/components/MapboxMap"
import MarketOverviewChart from "@/components/charts/MarketOverviewChart"
import { Grid, Card, Metric, Text, BadgeDelta, Flex, Title } from "@tremor/react"
import { Building2, Home, TrendingUp, Users } from "lucide-react"
import { MarketAlerts } from "@/components/MarketAlerts"

export const dynamic = 'force-dynamic'

interface DashboardProject {
    id: string;
    name: string;
    developer: string | null;
    commune: string | null;
    region: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    avg_price_uf: number | null;
    avg_price_m2_uf: number | null;
    min_price_uf: number | null;
    max_price_uf: number | null;
    total_units: number | null;
    sold_units: number | null;
    available_units: number | null;
    sales_speed_monthly: number | null;
    project_status: string | null;
    property_type: string | null;
}

async function getDashboardData() {
    const supabase = await createClient()

    // 1. Get exact project count
    const countQuery = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

    // 2. Get data for aggregations (increased limit)
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id, name, developer, commune, region, address,
            latitude, longitude, 
            avg_price_uf, avg_price_m2_uf, min_price_uf, max_price_uf,
            total_units, sold_units, available_units,
            sales_speed_monthly, project_status, property_type
        `)
        .order('sales_speed_monthly', { ascending: false })
        .limit(10000)

    if (error) {
        console.error('Error fetching dashboard data:', error)
        return {
            projectCount: 0,
            totalStock: 0,
            avgSalesSpeed: 0,
            totalSold: 0,
            projects: [],
            regionData: [],
            deltas: { projects: 0, stock: 0, speed: 0, sold: 0 },
            mixData: [],
            priceRangeData: []
        }
    }

    const validProjects = (projects || []) as DashboardProject[]

    // Use the real count from DB, or fallback to array length
    const projectCount = countQuery.count || validProjects.length

    // Calculate stats
    const totalStock = validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.available_units || 0), 0)
    const totalSold = validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.sold_units || 0), 0)

    const avgSalesSpeed = validProjects.length > 0
        ? parseFloat((validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.sales_speed_monthly || 0), 0) / validProjects.length).toFixed(1))
        : 0

    // Mock deltas for visualization (in a real scenario, we would compare with historical table)
    // For Tarea 1, we focus on the UI result.
    const deltas = {
        projects: 5.2, // +5.2% vs last month
        stock: -2.1,   // -2.1% (stock reducing is often good)
        speed: 8.4,    // +8.4%
        sold: 12.5     // +12.5%
    }

    // Process data for charts
    const regionMap = new Map<string, any>()
    validProjects.forEach((p: DashboardProject) => {
        const region = p.region || 'N/A'
        if (!regionMap.has(region)) {
            regionMap.set(region, {
                region,
                projects: 0,
                totalUnits: 0,
                soldUnits: 0,
                availableUnits: 0
            })
        }
        const data = regionMap.get(region)
        data.projects++
        data.totalUnits += p.total_units || 0
        data.soldUnits += p.sold_units || 0
        data.availableUnits += p.available_units || 0
    })

    const regionData = Array.from(regionMap.values())
        .sort((a, b) => b.projects - a.projects)
        .slice(0, 5) // Top 5 regions

    const mapProjects = validProjects.filter(p => p.latitude && p.longitude)

    // NEW: Calculate Product Mix
    const mixMap = new Map<string, number>()
    validProjects.forEach(p => {
        const type = p.property_type || 'Otros'
        mixMap.set(type, (mixMap.get(type) || 0) + 1)
    })
    const mixData = Array.from(mixMap.entries())
        .map(([typology, count]) => ({ typology, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // NEW: Calculate Price Range Analysis
    const ranges = [
        { label: '0-2k', min: 0, max: 2000 },
        { label: '2k-4k', min: 2000, max: 4000 },
        { label: '4k-6k', min: 4000, max: 6000 },
        { label: '6k-8k', min: 6000, max: 8000 },
        { label: '8k+', min: 8000, max: 999999 }
    ]
    const priceRangeData = ranges.map(range => {
        const filtered = validProjects.filter(p =>
            (p.avg_price_uf || 0) >= range.min && (p.avg_price_uf || 0) < range.max
        )
        return {
            range: range.label,
            oferta: filtered.reduce((acc, p) => acc + (p.available_units || 0), 0),
            vendidas: filtered.reduce((acc, p) => acc + (p.sold_units || 0), 0)
        }
    })

    return {
        projectCount,
        totalStock,
        avgSalesSpeed,
        totalSold,
        projects: mapProjects,
        regionData,
        deltas,
        mixData,
        priceRangeData
    }
}

import { ProductMixChart } from "@/components/charts/ProductMixChart"
import { PriceRangeChart } from "@/components/charts/PriceRangeChart"

export default async function DashboardPage() {
    const { projects, regionData, deltas, mixData, priceRangeData, ...kpis } = await getDashboardData()

    const kpiItems = [
        {
            title: "Proyectos Totales",
            metric: kpis.projectCount.toLocaleString(),
            icon: Building2,
            delta: `${deltas.projects}%`,
            deltaType: "moderateIncrease",
            text: "En seguimiento activo"
        },
        {
            title: "Stock Disponible",
            metric: kpis.totalStock.toLocaleString(),
            icon: Home,
            delta: `${Math.abs(deltas.stock)}%`,
            deltaType: "moderateDecrease",
            text: "Unidades en venta"
        },
        {
            title: "Velocidad Venta",
            metric: kpis.avgSalesSpeed.toString(),
            icon: TrendingUp,
            delta: `${deltas.speed}%`,
            deltaType: "increase",
            text: "Unidades/mes (promedio)"
        },
        {
            title: "Ventas Totales",
            metric: kpis.totalSold.toLocaleString(),
            icon: Users,
            delta: `${deltas.sold}%`,
            deltaType: "increase",
            text: "Acumuladas históricas"
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <Title className="text-2xl font-bold mb-4">🚨 Alertas de Mercado</Title>
                <MarketAlerts />
            </div>

            <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
                {kpiItems.map((item) => (
                    <Card key={item.title} decoration="top" decorationColor={item.deltaType.includes('Increase') ? "blue" : "amber"}>
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text>{item.title}</Text>
                                <Metric>{item.metric}</Metric>
                            </div>
                            <BadgeDelta deltaType={item.deltaType as any}>
                                {item.delta}
                            </BadgeDelta>
                        </Flex>
                        <Flex className="mt-4 space-x-2">
                            <item.icon className="h-4 w-4 text-slate-400" />
                            <Text className="truncate text-slate-500">{item.text}</Text>
                        </Flex>
                    </Card>
                ))}
            </Grid>

            {/* Charts & Map */}
            <Grid numItemsLg={3} className="gap-6 mt-6">
                <Card className="lg:col-span-2 h-[600px] flex flex-col p-0 overflow-hidden">
                    <div className="p-6 border-b">
                        <Title>Mapa de Actividad Inmobiliaria</Title>
                    </div>
                    <div className="flex-1 relative">
                        <MapboxMap projects={projects as any[]} />
                    </div>
                </Card>

                <div className="space-y-6">
                    <MarketOverviewChart data={regionData} />
                    <ProductMixChart data={mixData} />
                    <PriceRangeChart data={priceRangeData} />
                </div>
            </Grid>
        </div>
    )
}
