import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/mapbox';

import type { ControlPosition } from 'react-map-gl/mapbox';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
    position?: ControlPosition;

    onCreate?: (evt: { features: object[] }) => void;
    onUpdate?: (evt: { features: object[]; action: string }) => void;
    onDelete?: (evt: { features: object[] }) => void;
};

export default function DrawControl(props: DrawControlProps) {
    useControl<MapboxDraw>(
        () => new MapboxDraw(props),
        ({ map }) => {
            map.on('draw.create', (e) => props.onCreate?.(e));
            map.on('draw.update', (e) => props.onUpdate?.(e));
            map.on('draw.delete', (e) => props.onDelete?.(e));
        },
        ({ map }) => {
            map.off('draw.create', (e) => props.onCreate?.(e));
            map.off('draw.update', (e) => props.onUpdate?.(e));
            map.off('draw.delete', (e) => props.onDelete?.(e));
        },
        {
            position: props.position
        }
    );

    return null;
}
