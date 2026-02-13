import { createClient } from '@/utils/supabase/server'
import ProjectsTable from '@/components/ProjectsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, TrendingUp, DollarSign, Clock, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic' // Desactiva caché estática para ver cambios al instante

async function getProjects() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })
        .limit(10000)

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data || []
}

async function getProjectStats() {
    const supabase = await createClient()

    // 1. Obtener conteo total real
    const countQuery = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }) // Solo cuenta, no baja datos

    // 2. Obtener datos para promedios (con límite ampliado)
    const { data, error } = await supabase
        .from('projects')
        .select('total_units, sold_units, available_units, avg_price_uf, sales_speed_monthly')
        .limit(10000)

    if (error || !data) {
        return {
            totalProjects: 0,
            totalUnits: 0,
            avgPrice: 0,
            avgVelocity: 0
        }
    }

    const totalRealProjects = countQuery.count || data.length

    return {
        totalProjects: totalRealProjects,
        totalUnits: data.reduce((sum: number, p: any) => sum + (p.total_units || 0), 0),
        avgPrice: data.length > 0
            ? Math.round(data.reduce((sum: number, p: any) => sum + (p.avg_price_uf || 0), 0) / data.length)
            : 0,
        avgVelocity: data.length > 0
            ? (data.reduce((sum: number, p: any) => sum + (p.sales_speed_monthly || 0), 0) / data.length).toFixed(1)
            : '0.0'
    }
}

export default async function ProjectsPage() {
    const [projects, stats] = await Promise.all([
        getProjects(),
        getProjectStats()
    ])

    return (
        <div className="flex flex-col gap-6">
            <div className="surface-panel enter-fade-up flex items-center justify-between p-5 md:p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Proyectos Inmobiliarios</h1>
                    <p className="text-muted-foreground">
                        Gestión y análisis de proyectos en desarrollo
                    </p>
                </div>
                <Button className="h-11 px-5">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proyecto
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="enter-fade-up [animation-delay:40ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                            En seguimiento activo
                        </p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:80ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Totales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            En el mercado
                        </p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:120ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Precio Promedio</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgPrice} UF</div>
                        <p className="text-xs text-muted-foreground">
                            Por unidad
                        </p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:160ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad Promedio</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgVelocity}</div>
                        <p className="text-xs text-muted-foreground">
                            Unidades/mes
                        </p>
                    </CardContent>
                </Card>
            </div>

            <ProjectsTable projects={projects} />
        </div>
    )
}
