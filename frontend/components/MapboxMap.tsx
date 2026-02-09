'use client'

import * as React from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Define the Project type roughly based on our DB schema
type Project = {
    id: string
    name: string
    commune: string
    latitude: number
    longitude: number
    avg_price_uf: number
    available_units: number
}

interface MapboxMapProps {
    projects: Project[]
}

export default function MapboxMap({ projects }: MapboxMapProps) {
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)

    // Default view state (Santiago de Chile center roughly)
    const initialViewState = {
        longitude: -70.6483,
        latitude: -33.4569,
        zoom: 10
    }

    return (
        <div className="w-full h-full rounded-md overflow-hidden border relative">
            <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                attributionControl={false}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />

                {projects.map((project) => (
                    <Marker
                        key={project.id}
                        longitude={project.longitude}
                        latitude={project.latitude}
                        anchor="bottom"
                        onClick={e => {
                            // If we let the click propagate, it might close the popup
                            e.originalEvent.stopPropagation()
                            setSelectedProject(project)
                        }}
                    >
                        <div className="cursor-pointer text-indigo-600 hover:text-indigo-800 transition-transform hover:scale-110">
                            <Building2 className="h-6 w-6 fill-current" />
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
                    >
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-sm">{selectedProject.name}</h3>
                            <p className="text-xs text-gray-500">{selectedProject.commune}</p>
                            <div className="mt-2 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Precio Prom:</span>
                                    <span className="font-medium">{selectedProject.avg_price_uf} UF</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Disp:</span>
                                    <span className="font-medium">{selectedProject.available_units} un.</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    )
}
