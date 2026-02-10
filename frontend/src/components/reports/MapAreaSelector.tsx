import React, { useCallback, useRef, useEffect } from 'react';
import Map, { NavigationControl, MapRef } from 'react-map-gl/mapbox';
import DrawControl from './DrawControl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

interface MapAreaSelectorProps {
    onPolygonChange: (wkt: string | null) => void;
}

export default function MapAreaSelector({ onPolygonChange }: MapAreaSelectorProps) {
    const mapRef = useRef<MapRef>(null);

    // Force resize to fix "cut map" issue in Modals
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        }, 200); // 200ms delay to ensure modal animation is done

        return () => clearTimeout(timeout);
    }, []);

    const onUpdate = useCallback((e: any) => {
        const features = e.features;
        if (features && features.length > 0) {
            const polygon = features[0];
            if (polygon.geometry.type === 'Polygon') {
                const coords = polygon.geometry.coordinates[0];
                const wkt = `POLYGON((${coords.map((c: any) => `${c[0]} ${c[1]}`).join(', ')}))`
                onPolygonChange(wkt);
            }
        } else {
            onPolygonChange(null);
        }
    }, [onPolygonChange]);

    const onDelete = useCallback(() => {
        onPolygonChange(null);
    }, [onPolygonChange]);

    return (
        <div className="h-[400px] w-full rounded-md border border-slate-200 overflow-hidden relative shadow-inner bg-slate-50">
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: -70.6483,
                    latitude: -33.4489,
                    zoom: 12
                }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                reuseMaps
            >
                <DrawControl
                    position="top-left"
                    displayControlsDefault={false}
                    controls={{
                        polygon: true,
                        trash: true
                    }}
                    defaultMode="draw_polygon"
                    onCreate={onUpdate}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
                <NavigationControl position="bottom-right" />
            </Map>
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded shadow text-[10px] text-slate-500 max-w-[150px]">
                Usa la herramienta de polígono para dibujar el área de interés en el mapa.
            </div>
        </div>
    );
}
