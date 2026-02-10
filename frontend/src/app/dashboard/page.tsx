import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import MapboxMap from "@/components/MapboxMap"
import MarketOverviewChart from "@/components/charts/MarketOverviewChart"
import { TrendingUp, Users, Building2, Home } from "lucide-react"

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
            regionData: []
        }
    }

    const validProjects = (projects || []) as DashboardProject[]

    // Use the real count from DB, or fallback to array length
    const projectCount = countQuery.count || validProjects.length

    // Calculate stats based on the fetched chunk (up to 10k)
    const totalStock = validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.available_units || 0), 0)
    const totalSold = validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.sold_units || 0), 0)

    const avgSalesSpeed = validProjects.length > 0
        ? (validProjects.reduce((acc: number, p: DashboardProject) => acc + (p.sales_speed_monthly || 0), 0) / validProjects.length).toFixed(1)
        : '0.0'

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

    // Filter projects with coordinates for map
    const mapProjects = validProjects.filter(p => p.latitude && p.longitude)

    return {
        projectCount,
        totalStock,
        avgSalesSpeed,
        totalSold,
        projects: mapProjects,
        regionData
    }
}

export default async function DashboardPage() {
    const { projects, regionData, ...kpis } = await getDashboardData()

    return (
        <div className="grid gap-4 md:gap-8">
            {/* KPI Cards Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Proyectos Totales
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.projectCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            En seguimiento activo
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stock Disponible
                        </CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalStock.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Unidades en venta
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Velocidad Venta
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.avgSalesSpeed}</div>
                        <p className="text-xs text-muted-foreground">
                            Unidades / mes (promedio)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ventas Totales
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalSold.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Acumuladas históricas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Map */}
            <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                <Card className="lg:col-span-2 xl:col-span-2 h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Mapa de Actividad</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative min-h-0 rounded-b-lg overflow-hidden">
                        <MapboxMap projects={projects as any[]} />
                    </CardContent>
                </Card>
                <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-4">
                    <MarketOverviewChart data={regionData} />
                </div>
            </div>
        </div>
    )
}
