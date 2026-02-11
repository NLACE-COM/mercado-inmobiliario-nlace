'use client'

import { DonutChart, Card, Title } from '@tremor/react'

interface ProductMixData {
    typology: string
    count: number
}

interface ProductMixChartProps {
    data: ProductMixData[]
}

export function ProductMixChart({ data }: ProductMixChartProps) {
    return (
        <Card>
            <Title>Mix de Productos</Title>
            <DonutChart
                className="mt-6"
                data={data}
                category="count"
                index="typology"
                valueFormatter={(number: number) =>
                    `${number} proyectos`
                }
                colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
            />
        </Card>
    )
}
