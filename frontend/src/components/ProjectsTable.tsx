'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Eye } from 'lucide-react'

interface Project {
    id: string
    name: string
    developer: string | null
    commune: string | null
    region: string | null
    total_units: number | null
    sold_units: number | null
    available_units: number | null
    avg_price_uf: number | null
    sales_speed_monthly: number | null
    project_status: string | null
    property_type: string | null
}

interface ProjectsTableProps {
    projects: Project[]
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
    const [search, setSearch] = useState('')
    const [regionFilter, setRegionFilter] = useState<string>('all')

    // Get unique regions
    const regions = Array.from(new Set(projects.map(p => p.region).filter((r): r is string => !!r)))

    // Filter projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name?.toLowerCase().includes(search.toLowerCase()) ||
            project.developer?.toLowerCase().includes(search.toLowerCase()) ||
            project.commune?.toLowerCase().includes(search.toLowerCase())

        const matchesRegion = regionFilter === 'all' || project.region === regionFilter

        return matchesSearch && matchesRegion
    })

    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 50

    // Filter projects logic... (unchanged, but logic needs to be before pagination)

    // Pagination logic
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const getStatusBadge = (status: string | null) => {
        if (!status) return null

        const statusVariants: Record<string, 'success' | 'secondary' | 'info' | 'warning'> = {
            'EN VENTA': 'success',
            'VENDIDO': 'secondary',
            'EN CONSTRUCCION': 'info',
            'TERMINADO': 'warning',
        }

        return (
            <Badge variant={statusVariants[status] || 'secondary'}>
                {status}
            </Badge>
        )
    }

    const getSellThroughRate = (sold: number | null, total: number | null) => {
        if (!sold || !total || total === 0) return 0
        return Math.round((sold / total) * 100)
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, desarrollador o comuna..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1) // Reset to first page on search
                        }}
                        className="pl-10"
                    />
                </div>
                <select
                    value={regionFilter}
                    onChange={(e) => {
                        setRegionFilter(e.target.value)
                        setCurrentPage(1) // Reset to first page on filter
                    }}
                    className="h-10 rounded-[12px] border border-input bg-background px-4 py-2 text-sm text-foreground transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                >
                    <option value="all">Todas las regiones</option>
                    {regions.sort().map(region => (
                        <option key={region} value={region}>
                            Región {region}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results count */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} de {filteredProjects.length} proyectos
                    {filteredProjects.length !== projects.length && ` (filtrados de ${projects.length} totales)`}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <span className="flex items-center px-2">
                        Página {currentPage} de {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-card border bg-card shadow-soft">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Desarrollador</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead className="text-right">Unidades</TableHead>
                            <TableHead className="text-right">Precio Prom.</TableHead>
                            <TableHead className="text-right">Velocidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No se encontraron proyectos
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProjects.map((project) => {
                                const sellThrough = getSellThroughRate(project.sold_units, project.total_units)

                                return (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div className="font-semibold text-foreground">{project.name}</div>
                                                {project.property_type && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {project.property_type}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {project.developer || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                <span>{project.commune || '-'}</span>
                                                {project.region && (
                                                    <span className="text-muted-foreground">({project.region})</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">
                                                    {project.total_units?.toLocaleString() || '-'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {project.sold_units || 0} vendidas
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full"
                                                        style={{ width: `${sellThrough}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-sm font-medium">
                                                {project.avg_price_uf
                                                    ? `${project.avg_price_uf.toLocaleString()} UF`
                                                    : '-'
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-sm">
                                                {project.sales_speed_monthly
                                                    ? `${project.sales_speed_monthly.toFixed(1)} u/mes`
                                                    : '-'
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(project.project_status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination controls at bottom too */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <span className="flex items-center px-2 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    )
}
