'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, MapPin, TrendingUp, TrendingDown, Search, Filter, Download } from 'lucide-react'

interface Project {
    id: string
    name: string
    commune: string
    developer: string | null
    total_units: number
    sold_units: number
    available_units: number
    avg_price_uf: number
    avg_price_m2_uf: number
    sales_speed_monthly: number
    months_to_sell_out: number
}

interface ProjectsTableProps {
    projects: Project[]
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [communeFilter, setCommuneFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('name')

    // Get unique communes
    const communes = Array.from(new Set(projects.map(p => p.commune))).sort()

    // Filter and sort projects
    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.commune.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCommune = communeFilter === 'all' || p.commune === communeFilter
            return matchesSearch && matchesCommune
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'price':
                    return (b.avg_price_uf || 0) - (a.avg_price_uf || 0)
                case 'velocity':
                    return (b.sales_speed_monthly || 0) - (a.sales_speed_monthly || 0)
                case 'availability':
                    return (b.available_units || 0) - (a.available_units || 0)
                default:
                    return 0
            }
        })

    const getSalesPercentage = (sold: number, total: number) => {
        if (!total) return 0
        return Math.round((sold / total) * 100)
    }

    const getVelocityBadge = (velocity: number) => {
        if (velocity > 10) return <Badge className="bg-green-500">Alta</Badge>
        if (velocity > 5) return <Badge className="bg-yellow-500">Media</Badge>
        return <Badge className="bg-red-500">Baja</Badge>
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o comuna..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={communeFilter} onValueChange={setCommuneFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por comuna" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las comunas</SelectItem>
                        {communes.map(commune => (
                            <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nombre</SelectItem>
                        <SelectItem value="price">Precio</SelectItem>
                        <SelectItem value="velocity">Velocidad</SelectItem>
                        <SelectItem value="availability">Disponibilidad</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Proyectos ({filteredProjects.length})</CardTitle>
                    <CardDescription>
                        Listado completo de proyectos inmobiliarios con métricas clave
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proyecto</TableHead>
                                    <TableHead>Comuna</TableHead>
                                    <TableHead className="text-right">Unidades</TableHead>
                                    <TableHead className="text-right">Vendidas</TableHead>
                                    <TableHead className="text-right">Precio UF</TableHead>
                                    <TableHead className="text-right">UF/m²</TableHead>
                                    <TableHead className="text-center">Velocidad</TableHead>
                                    <TableHead className="text-right">MAO</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No se encontraron proyectos
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((project) => {
                                        const salesPct = getSalesPercentage(project.sold_units, project.total_units)
                                        return (
                                            <TableRow key={project.id} className="hover:bg-muted/50 cursor-pointer">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div>{project.name}</div>
                                                            {project.developer && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {project.developer}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {project.commune}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{project.total_units}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span>{project.sold_units}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {salesPct}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {project.avg_price_uf?.toLocaleString() || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {project.avg_price_m2_uf?.toFixed(1) || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getVelocityBadge(project.sales_speed_monthly || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {project.months_to_sell_out?.toFixed(1) || '-'} meses
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
