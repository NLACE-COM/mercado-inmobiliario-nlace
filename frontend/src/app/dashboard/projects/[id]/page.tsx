import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Building2, MapPin, DollarSign, TrendingUp, Users, ArrowLeft, Map as MapIcon
} from 'lucide-react'
import Link from 'next/link'

async function getProject(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return data
}

type Props = {
    params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: Props) {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
        notFound()
    }

    const sellThroughRate = project.total_units > 0
        ? ((project.sold_units || 0) / project.total_units) * 100
        : 0

    const hasCoordinates = project.latitude && project.longitude

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="surface-panel enter-fade-up flex items-center justify-between p-5 md:p-6">
                <div className="space-y-1">
                    <Link href="/dashboard/projects">
                        <Button variant="ghost" size="sm" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Proyectos
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{project.commune}, Región {project.region}</span>
                    </div>
                </div>
                {hasCoordinates && (
                    <Link href={`/dashboard/map?project=${project.id}`}>
                        <Button>
                            <MapIcon className="h-4 w-4 mr-2" />
                            Ver en Mapa
                        </Button>
                    </Link>
                )}
            </div>

            {/* Main Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="enter-fade-up [animation-delay:40ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Unidades</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.total_units?.toLocaleString() || '-'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {project.sold_units || 0} vendidas, {project.available_units || 0} disponibles
                        </p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:80ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Precio Promedio</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.avg_price_uf ? `${project.avg_price_uf.toLocaleString()} UF` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {project.avg_price_m2_uf ? `${project.avg_price_m2_uf.toLocaleString()} UF/m²` : 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:120ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad de Venta</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.sales_speed_monthly ? `${project.sales_speed_monthly.toFixed(1)}` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">unidades/mes</p>
                    </CardContent>
                </Card>

                <Card className="enter-fade-up [animation-delay:160ms]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Venta</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sellThroughRate.toFixed(1)}%</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted">
                            <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${sellThroughRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Project Information */}
                <Card className="enter-fade-up [animation-delay:200ms]">
                    <CardHeader>
                        <CardTitle>Información del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Desarrollador</p>
                                <p className="text-sm font-semibold">{project.developer || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tipo de Propiedad</p>
                                <p className="text-sm font-semibold">{project.property_type || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                                <Badge className="mt-1">
                                    {project.project_status || 'N/A'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                                <p className="text-sm font-semibold">{project.category || '-'}</p>
                            </div>
                        </div>

                        {project.address && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                                <p className="text-sm font-semibold">{project.address}</p>
                            </div>
                        )}

                        {project.floors && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pisos</p>
                                <p className="text-sm font-semibold">{project.floors}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pricing Details */}
                <Card className="enter-fade-up [animation-delay:240ms]">
                    <CardHeader>
                        <CardTitle>Detalles de Precios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Precio Mínimo</p>
                                <p className="text-sm font-semibold">
                                    {project.min_price_uf ? `${project.min_price_uf.toLocaleString()} UF` : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Precio Máximo</p>
                                <p className="text-sm font-semibold">
                                    {project.max_price_uf ? `${project.max_price_uf.toLocaleString()} UF` : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Precio Promedio</p>
                                <p className="text-sm font-semibold">
                                    {project.avg_price_uf ? `${project.avg_price_uf.toLocaleString()} UF` : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Precio por m²</p>
                                <p className="text-sm font-semibold">
                                    {project.avg_price_m2_uf ? `${project.avg_price_m2_uf.toLocaleString()} UF/m²` : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Metrics */}
                <Card className="enter-fade-up [animation-delay:280ms]">
                    <CardHeader>
                        <CardTitle>Métricas de Venta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unidades Totales</p>
                                <p className="text-sm font-semibold">{project.total_units?.toLocaleString() || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unidades Vendidas</p>
                                <p className="text-sm font-semibold text-success">
                                    {project.sold_units?.toLocaleString() || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unidades Disponibles</p>
                                <p className="text-sm font-semibold text-warning">
                                    {project.available_units?.toLocaleString() || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Velocidad de Venta</p>
                                <p className="text-sm font-semibold">
                                    {project.sales_speed_monthly ? `${project.sales_speed_monthly.toFixed(1)} u/mes` : '-'}
                                </p>
                            </div>
                            {project.months_to_sell_out && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Meses para Agotar</p>
                                    <p className="text-sm font-semibold">
                                        {project.months_to_sell_out.toFixed(1)} meses
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                {hasCoordinates && (
                    <Card className="enter-fade-up [animation-delay:320ms]">
                        <CardHeader>
                            <CardTitle>Ubicación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Comuna</p>
                                    <p className="text-sm font-semibold">{project.commune}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Región</p>
                                    <p className="text-sm font-semibold">Región {project.region}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Latitud</p>
                                    <p className="text-sm font-mono">{project.latitude.toFixed(6)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Longitud</p>
                                    <p className="text-sm font-mono">{project.longitude.toFixed(6)}</p>
                                </div>
                            </div>
                            <Link href={`/dashboard/map?project=${project.id}`} className="block">
                                <Button className="w-full">
                                    <MapIcon className="h-4 w-4 mr-2" />
                                    Ver en Mapa Interactivo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
