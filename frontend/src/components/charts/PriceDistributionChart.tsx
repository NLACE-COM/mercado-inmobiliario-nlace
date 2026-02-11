'use client'

import { BarChart, Card, Title, Subtitle } from '@tremor/react'

interface PriceDistributionData {
    range: string
    count: number
    percentage: number
}

interface PriceDistributionChartProps {
    data: PriceDistributionData[]
}

export default function PriceDistributionChart({ data }: PriceDistributionChartProps) {
    const chartData = data.map(item => ({
        range: item.range,
        "Cantidad de Proyectos": item.count,
    }))

    return (
        <Card className="p-6">
            <Title>Distribución de Precios</Title>
            <Subtitle>
                Análisis por rango de valor (UF) en la oferta actual
            </Subtitle>
            <BarChart
                className="mt-6 h-[400px]"
                data={chartData}
                index="range"
                categories={["Cantidad de Proyectos"]}
                colors={["indigo"]}
                valueFormatter={(number: number) =>
                    Intl.NumberFormat("es-CL").format(number).toString()
                }
                yAxisWidth={48}
            />
        </Card>
    )
}
