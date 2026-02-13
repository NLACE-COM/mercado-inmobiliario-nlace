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
        <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-inner">
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
            <div className="glass-panel absolute right-3 top-3 max-w-[160px] p-2 text-[10px] text-muted-foreground">
                Usa la herramienta de polígono para dibujar el área de interés en el mapa.
            </div>
        </div>
    );
}
