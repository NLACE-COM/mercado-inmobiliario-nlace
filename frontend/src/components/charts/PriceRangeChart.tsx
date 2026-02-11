'use client'

import { BarChart, Card, Title } from '@tremor/react'

interface PriceRangeData {
    range: string
    oferta: number
    vendidas: number
}

interface PriceRangeChartProps {
    data: PriceRangeData[]
}

export function PriceRangeChart({ data }: PriceRangeChartProps) {
    return (
        <Card>
            <Title>Participación por Rango de Precio</Title>
            <BarChart
                className="mt-6 h-72"
                data={data}
                index="range"
                categories={['oferta', 'vendidas']}
                colors={['blue', 'emerald']}
                stack={true}
                valueFormatter={(number: number) =>
                    Intl.NumberFormat("es-CL").format(number).toString()
                }
            />
        </Card>
    )
}
