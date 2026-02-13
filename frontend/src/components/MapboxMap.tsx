'use client'

import * as React from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Building2, MapPin, DollarSign, TrendingUp, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Project = {
    id: string
    name: string
    developer: string | null
    commune: string | null
    region: string | null
    address: string | null
    latitude: number
    longitude: number
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
}

interface MapboxMapProps {
    projects: Project[]
    highlightedProjectId?: string
    onVisibleProjectIdsChange?: (projectIds: string[]) => void
    controlsPosition?: 'top-right' | 'bottom-right'
    showLegend?: boolean
}

export default function MapboxMap({
    projects,
    highlightedProjectId,
    onVisibleProjectIdsChange,
    controlsPosition = 'top-right',
    showLegend = true,
}: MapboxMapProps) {
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
    const [mapLoaded, setMapLoaded] = React.useState(false)
    const mapRef = React.useRef<any>(null)
    const projectsSignature = React.useMemo(
        () => projects.map((project) => project.id).join('|'),
        [projects]
    )

    const emitVisibleProjectIds = React.useCallback(() => {
        if (!onVisibleProjectIdsChange || !mapRef.current) return

        const mapInstance = mapRef.current?.getMap?.() || mapRef.current
        const bounds = mapInstance?.getBounds?.()
        if (!bounds) return

        const visibleIds = projects
            .filter((project) => bounds.contains([project.longitude, project.latitude]))
            .map((project) => project.id)

        onVisibleProjectIdsChange(visibleIds)
    }, [onVisibleProjectIdsChange, projects])

    // Fit bounds to projects on load and update
    React.useEffect(() => {
        if (!mapLoaded || !mapRef.current) return

        const mapInstance = mapRef.current?.getMap?.() || mapRef.current
        if (!mapInstance) return

        if (projects.length > 0) {
            // Use reduce to avoid stack overflow with large arrays
            const bounds = projects.reduce((acc: { minLng: number, maxLng: number, minLat: number, maxLat: number }, p: Project) => ({
                minLng: Math.min(acc.minLng, p.longitude),
                maxLng: Math.max(acc.maxLng, p.longitude),
                minLat: Math.min(acc.minLat, p.latitude),
                maxLat: Math.max(acc.maxLat, p.latitude)
            }), {
                minLng: projects[0].longitude,
                maxLng: projects[0].longitude,
                minLat: projects[0].latitude,
                maxLat: projects[0].latitude
            })

            // Validate consistency coordinates
            if (bounds.minLng !== bounds.maxLng || bounds.minLat !== bounds.maxLat) {
                mapInstance.fitBounds(
                    [
                        [bounds.minLng, bounds.minLat], // Southwest
                        [bounds.maxLng, bounds.maxLat]  // Northeast
                    ],
                    { padding: 80, duration: 1000 }
                )
            } else {
                // Single point case
                mapInstance.flyTo({
                    center: [bounds.minLng, bounds.minLat],
                    zoom: 12,
                    duration: 1000
                })
            }
            const timeoutId = window.setTimeout(() => {
                emitVisibleProjectIds()
            }, 1050)
            return () => window.clearTimeout(timeoutId)
        }

        if (projects.length === 0 && onVisibleProjectIdsChange) {
            onVisibleProjectIdsChange([])
        }
    }, [mapLoaded, projectsSignature, projects, onVisibleProjectIdsChange, emitVisibleProjectIds])

    // Highlight specific project if provided overrides automatic fit
    React.useEffect(() => {
        if (highlightedProjectId && projects.length > 0) {
            const project = projects.find(p => p.id === highlightedProjectId)
            if (project && mapRef.current) {
                setSelectedProject(project)
                mapRef.current.flyTo({
                    center: [project.longitude, project.latitude],
                    zoom: 15,
                    duration: 2000
                })
            }
        }
    }, [highlightedProjectId, projects])

    const initialViewState = {
        longitude: -70.6483,
        latitude: -33.4569,
        zoom: 10
    }

    const getSellThroughRate = (sold: number | null, total: number | null) => {
        if (!sold || !total || total === 0) return 0
        return Math.round((sold / total) * 100)
    }

    const getMarkerTone = (project: Project) => {
        const sellThrough = getSellThroughRate(project.sold_units, project.total_units)
        if (sellThrough >= 80) return { color: '#0F766E' }
        if (sellThrough >= 50) return { color: '#14867F' }
        if (sellThrough >= 20) return { color: '#2C9A93' }
        return { color: '#5AAFA7' }
    }

    return (
        <div className="relative h-full w-full overflow-hidden rounded-card border border-border/80">
            <Map
                ref={mapRef}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                attributionControl={false}
                onLoad={() => {
                    setMapLoaded(true)
                    emitVisibleProjectIds()
                }}
                onMoveEnd={emitVisibleProjectIds}
            >
                <NavigationControl position={controlsPosition} />
                <FullscreenControl position={controlsPosition} />

                {projects.map((project) => (
                    <Marker
                        key={project.id}
                        longitude={project.longitude}
                        latitude={project.latitude}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation()
                            setSelectedProject(project)
                        }}
                    >
                        <div className="cursor-pointer transition-transform duration-200 hover:scale-110">
                            <div
                                className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(15,23,42,0.25)]"
                                style={{ backgroundColor: getMarkerTone(project).color }}
                                aria-label={`Proyecto ${project.name}`}
                            />
                        </div>
                    </Marker>
                ))}

                {selectedProject && (
                    <Popup
                        anchor="top"
                        longitude={selectedProject.longitude}
                        latitude={selectedProject.latitude}
                        onClose={() => setSelectedProject(null)}
                        closeOnClick={false}
                        className="z-50"
                        maxWidth="380px"
                    >
                        <div className="min-w-[260px] p-3 md:min-w-[300px]">
                            {/* Header */}
                            <div className="mb-3">
                                <h3 className="text-base font-bold text-foreground">{selectedProject.name}</h3>
                                {selectedProject.developer && (
                                    <p className="mt-1 text-xs text-muted-foreground">{selectedProject.developer}</p>
                                )}
                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{selectedProject.commune}, Región {selectedProject.region}</span>
                                </div>
                                {selectedProject.address && (
                                    <p className="mt-1 text-xs text-muted-foreground">{selectedProject.address}</p>
                                )}
                            </div>

                            {/* Status and Type */}
                            <div className="flex gap-2 mb-3">
                                {selectedProject.project_status && (
                                    <Badge variant="outline" className="text-xs">
                                        {selectedProject.project_status}
                                    </Badge>
                                )}
                                {selectedProject.property_type && (
                                    <Badge variant="secondary" className="text-xs">
                                        {selectedProject.property_type}
                                    </Badge>
                                )}
                            </div>

                            {/* Metrics Grid */}
                            <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
                                {/* Price */}
                                <div className="rounded-xl border border-info/20 bg-info/10 p-2">
                                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                                        <DollarSign className="h-3 w-3" />
                                        <span>Precio Promedio</span>
                                    </div>
                                    <div className="font-bold text-foreground">
                                        {selectedProject.avg_price_uf
                                            ? `${selectedProject.avg_price_uf.toLocaleString()} UF`
                                            : 'N/A'
                                        }
                                    </div>
                                    {selectedProject.avg_price_m2_uf && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {selectedProject.avg_price_m2_uf.toLocaleString()} UF/m²
                                        </div>
                                    )}
                                </div>

                                {/* Units */}
                                <div className="rounded-xl border border-success/25 bg-success/10 p-2">
                                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                                        <Building2 className="h-3 w-3" />
                                        <span>Unidades</span>
                                    </div>
                                    <div className="font-bold text-foreground">
                                        {selectedProject.total_units?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {selectedProject.sold_units || 0} vendidas
                                    </div>
                                </div>

                                {/* Sales Speed */}
                                {selectedProject.sales_speed_monthly && (
                                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
                                        <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>Velocidad</span>
                                        </div>
                                        <div className="font-bold text-foreground">
                                            {selectedProject.sales_speed_monthly.toFixed(1)} u/mes
                                        </div>
                                    </div>
                                )}

                                {/* Sell Through */}
                                <div className="rounded-xl border border-warning/25 bg-warning/10 p-2">
                                    <div className="mb-1 text-muted-foreground">Avance</div>
                                    <div className="font-bold text-foreground">
                                        {getSellThroughRate(selectedProject.sold_units, selectedProject.total_units)}%
                                    </div>
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                        <div
                                            className="h-1.5 rounded-full bg-warning"
                                            style={{
                                                width: `${getSellThroughRate(selectedProject.sold_units, selectedProject.total_units)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Price Range */}
                            {(selectedProject.min_price_uf || selectedProject.max_price_uf) && (
                                <div className="mb-3 border-b border-border/70 pb-3 text-xs text-muted-foreground">
                                    <span className="font-medium">Rango de precios: </span>
                                    {selectedProject.min_price_uf?.toLocaleString()} - {selectedProject.max_price_uf?.toLocaleString()} UF
                                </div>
                            )}

                            {/* Action Button */}
                            <Link href={`/dashboard/projects/${selectedProject.id}`} className="block">
                                <Button className="w-full" size="sm">
                                    <Eye className="h-3 w-3 mr-2" />
                                    Ver Detalles Completos
                                </Button>
                            </Link>
                        </div>
                    </Popup>
                )}
            </Map>

            {showLegend && (
                <div className="glass-panel absolute bottom-4 left-4 hidden p-3 text-xs sm:block">
                    <div className="mb-2 font-semibold">Tasa de Venta</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: '#0F766E' }} />
                            <span>≥ 80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: '#14867F' }} />
                            <span>50-79%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: '#2C9A93' }} />
                            <span>20-49%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: '#5AAFA7' }} />
                            <span>&lt; 20%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
