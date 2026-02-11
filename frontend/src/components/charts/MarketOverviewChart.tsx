'use client'

import { BarChart, Card, Title, Subtitle } from '@tremor/react'

interface MarketData {
    region: string
    projects: number
    totalUnits: number
    soldUnits: number
    availableUnits: number
}

interface MarketOverviewChartProps {
    data: MarketData[]
}

export default function MarketOverviewChart({ data }: MarketOverviewChartProps) {
    const chartData = data.map(item => ({
        region: item.region,
        "Total Unidades": item.totalUnits,
        "Vendidas": item.soldUnits,
        "Disponibles": item.availableUnits,
    }))

    return (
        <Card className="p-6">
            <Title>Panorama del Mercado por Región</Title>
            <Subtitle>
                Distribución de inventario y ventas en las principales zonas
            </Subtitle>
            <BarChart
                className="mt-6 h-[400px]"
                data={chartData}
                index="region"
                categories={["Total Unidades", "Vendidas", "Disponibles"]}
                colors={["blue", "emerald", "amber"]}
                valueFormatter={(number: number) =>
                    Intl.NumberFormat("es-CL").format(number).toString()
                }
                yAxisWidth={48}
            />
        </Card>
    )
}
