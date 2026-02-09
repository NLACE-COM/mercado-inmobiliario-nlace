import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import MapboxMap from "@/components/MapboxMap"

// Placeholder for Tremor (install pending in layout if missed)
import { BarChart3, TrendingUp, Users } from "lucide-react"

async function getKpis() {
    const supabase = createClient()

    // Aggregate data using DB queries
    const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
    const { data: projects } = await supabase.from('projects').select('id, name, commune, latitude, longitude, sales_speed_monthly, sold_units, total_units, avg_price_uf, available_units')

    const totalStock = projects?.reduce((acc, p) => acc + (p.total_units - p.sold_units), 0) || 0
    const avgSalesSpeed = projects && projects.length > 0
        ? (projects.reduce((acc, p) => acc + (p.sales_speed_monthly || 0), 0) / projects.length).toFixed(1)
        : 0
    const totalSold = projects?.reduce((acc, p) => acc + (p.sold_units || 0), 0) || 0

    return { projectCount, totalStock, avgSalesSpeed, totalSold, projects: projects || [] }
}

export default async function DashboardPage() {
    const { projects, ...kpis } = await getKpis()

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
                        <div className="text-2xl font-bold">{kpis.projectCount}</div>
                        <p className="text-xs text-muted-foreground">
                            +2 desde el último mes
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
                        <div className="text-2xl font-bold">{kpis.totalStock}</div>
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
                        <div className="text-2xl font-bold">{kpis.totalSold}</div>
                        <p className="text-xs text-muted-foreground">
                            Acumuladas históricas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Map Placeholder */}
            <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                <Card className="lg:col-span-2 xl:col-span-2 h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Mapa de Actividad</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative min-h-0">
                        <div className="absolute inset-0 rounded-b-lg overflow-hidden">
                            <MapboxMap projects={projects} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1 xl:col-span-1">
                    <CardHeader>
                        <CardTitle>Ventas por Comuna</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                            <p>Chart Component</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}

function Home(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}

function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
