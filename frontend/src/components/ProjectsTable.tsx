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
    zona: string | null
    subsidy_type: string | null
    construction_status: string | null
}

interface ProjectsTableProps {
    projects: Project[]
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
    const [search, setSearch] = useState('')
    const [regionFilter, setRegionFilter] = useState<string>('all')
    const [zonaFilter, setZonaFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    // Get unique options
    const regions = Array.from(new Set(projects.map(p => p.region).filter((r): r is string => !!r)))
    const zonas = Array.from(new Set(projects.map(p => p.zona).filter((z): z is string => !!z)))
    const statuses = Array.from(new Set(projects.map(p => p.project_status).filter((s): s is string => !!s)))
    const types = Array.from(new Set(projects.map(p => p.property_type).filter((t): t is string => !!t)))

    // Filter projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name?.toLowerCase().includes(search.toLowerCase()) ||
            project.developer?.toLowerCase().includes(search.toLowerCase()) ||
            project.commune?.toLowerCase().includes(search.toLowerCase())

        const matchesRegion = regionFilter === 'all' || project.region === regionFilter
        const matchesZona = zonaFilter === 'all' || project.zona === zonaFilter
        const matchesStatus = statusFilter === 'all' || project.project_status === statusFilter
        const matchesType = typeFilter === 'all' || project.property_type === typeFilter

        return matchesSearch && matchesRegion && matchesZona && matchesStatus && matchesType
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

    const hasProjects = filteredProjects.length > 0
    const startItem = hasProjects ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
    const endItem = hasProjects ? Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length) : 0

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="surface-panel p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    <div className="flex flex-wrap gap-3 mt-3">
                        <select
                            value={regionFilter}
                            onChange={(e) => {
                                setRegionFilter(e.target.value)
                                setCurrentPage(1) // Reset to first page on filter
                            }}
                            className="h-10 flex-1 min-w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Todas las regiones</option>
                            {regions.sort().map(region => (
                                <option key={region} value={region}>
                                    Región {region}
                                </option>
                            ))}
                        </select>

                        <select
                            value={zonaFilter}
                            onChange={(e) => {
                                setZonaFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 flex-1 min-w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Todas las zonas</option>
                            {zonas.sort().map(zona => (
                                <option key={zona} value={zona}>
                                    {zona}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 flex-1 min-w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Todos los estados</option>
                            {statuses.sort().map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 flex-1 min-w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Todos los tipos</option>
                            {types.sort().map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/70 p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium">
                    Mostrando {startItem} - {endItem} de {filteredProjects.length} proyectos
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
                                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
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
