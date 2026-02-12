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
    const mapRef = React.useRef<any>(null)

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
        if (projects.length > 0 && mapRef.current) {
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
                mapRef.current.fitBounds(
                    [
                        [bounds.minLng, bounds.minLat], // Southwest
                        [bounds.maxLng, bounds.maxLat]  // Northeast
                    ],
                    { padding: 80, duration: 1000 }
                )
            } else {
                // Single point case
                mapRef.current.flyTo({
                    center: [bounds.minLng, bounds.minLat],
                    zoom: 12,
                    duration: 1000
                })
            }
        }
        if (projects.length === 0 && onVisibleProjectIdsChange) {
            onVisibleProjectIdsChange([])
        }
    }, [projects, onVisibleProjectIdsChange])

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

    const getMarkerColor = (project: Project) => {
        const sellThrough = getSellThroughRate(project.sold_units, project.total_units)
        if (sellThrough >= 80) return 'text-green-600'
        if (sellThrough >= 50) return 'text-blue-600'
        if (sellThrough >= 20) return 'text-orange-600'
        return 'text-red-600'
    }

    return (
        <div className="w-full h-full rounded-md overflow-hidden border relative">
            <Map
                ref={mapRef}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                attributionControl={false}
                onLoad={emitVisibleProjectIds}
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
                        <div className={`cursor-pointer ${getMarkerColor(project)} hover:scale-125 transition-transform`}>
                            <Building2 className="h-6 w-6 fill-current drop-shadow-lg" />
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
                        maxWidth="400px"
                    >
                        <div className="p-3 min-w-[300px]">
                            {/* Header */}
                            <div className="mb-3">
                                <h3 className="font-bold text-base text-gray-900">{selectedProject.name}</h3>
                                {selectedProject.developer && (
                                    <p className="text-xs text-gray-600 mt-1">{selectedProject.developer}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{selectedProject.commune}, Región {selectedProject.region}</span>
                                </div>
                                {selectedProject.address && (
                                    <p className="text-xs text-gray-500 mt-1">{selectedProject.address}</p>
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
                            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                                {/* Price */}
                                <div className="bg-blue-50 p-2 rounded">
                                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                                        <DollarSign className="h-3 w-3" />
                                        <span>Precio Promedio</span>
                                    </div>
                                    <div className="font-bold text-blue-900">
                                        {selectedProject.avg_price_uf
                                            ? `${selectedProject.avg_price_uf.toLocaleString()} UF`
                                            : 'N/A'
                                        }
                                    </div>
                                    {selectedProject.avg_price_m2_uf && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            {selectedProject.avg_price_m2_uf.toLocaleString()} UF/m²
                                        </div>
                                    )}
                                </div>

                                {/* Units */}
                                <div className="bg-green-50 p-2 rounded">
                                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                                        <Building2 className="h-3 w-3" />
                                        <span>Unidades</span>
                                    </div>
                                    <div className="font-bold text-green-900">
                                        {selectedProject.total_units?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {selectedProject.sold_units || 0} vendidas
                                    </div>
                                </div>

                                {/* Sales Speed */}
                                {selectedProject.sales_speed_monthly && (
                                    <div className="bg-purple-50 p-2 rounded">
                                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>Velocidad</span>
                                        </div>
                                        <div className="font-bold text-purple-900">
                                            {selectedProject.sales_speed_monthly.toFixed(1)} u/mes
                                        </div>
                                    </div>
                                )}

                                {/* Sell Through */}
                                <div className="bg-orange-50 p-2 rounded">
                                    <div className="text-gray-600 mb-1">Avance</div>
                                    <div className="font-bold text-orange-900">
                                        {getSellThroughRate(selectedProject.sold_units, selectedProject.total_units)}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div
                                            className="bg-orange-600 h-1.5 rounded-full"
                                            style={{
                                                width: `${getSellThroughRate(selectedProject.sold_units, selectedProject.total_units)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Price Range */}
                            {(selectedProject.min_price_uf || selectedProject.max_price_uf) && (
                                <div className="text-xs text-gray-600 mb-3 pb-3 border-b">
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
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                    <div className="font-semibold mb-2">Tasa de Venta</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600 fill-current" />
                            <span>≥ 80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 fill-current" />
                            <span>50-79%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-orange-600 fill-current" />
                            <span>20-49%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-red-600 fill-current" />
                            <span>&lt; 20%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
