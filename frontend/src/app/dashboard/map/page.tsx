import { createClient } from '@/utils/supabase/server'
import MapboxMap from '@/components/MapboxMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, TrendingUp } from 'lucide-react'

async function getProjects() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select(`
            id, name, developer, commune, region, address,
            latitude, longitude, 
            avg_price_uf, avg_price_m2_uf, min_price_uf, max_price_uf,
            total_units, sold_units, available_units,
            sales_speed_monthly, project_status, property_type
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data || []
}

type Props = {
    searchParams: Promise<{ project?: string }>
}

export default async function MapPage({
    searchParams
}: Props) {
    const projects = await getProjects() as any[]
    const { project: projectId } = await searchParams

    const stats = {
        totalProjects: projects.length,
        totalUnits: projects.reduce((sum: number, p) => sum + (p.total_units || 0), 0),
        avgPrice: projects.length > 0
            ? Math.round(projects.reduce((sum: number, p) => sum + (p.avg_price_uf || 0), 0) / projects.length)
            : 0
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mapa de Proyectos</h1>
                    <p className="text-muted-foreground">Visualización geográfica de proyectos inmobiliarios</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proyectos Mapeados</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">En la Región Metropolitana</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unidades Totales</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Disponibles en el mercado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgPrice} UF</div>
                        <p className="text-xs text-muted-foreground">Por unidad</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 min-h-[600px]">
                <CardContent className="p-0 h-full">
                    <MapboxMap projects={projects} highlightedProjectId={projectId} />
                </CardContent>
            </Card>
        </div>
    )
}
