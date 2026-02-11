'use client'

import { Card, Title, Subtitle } from '@tremor/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PriceDistributionData {
    range: string
    count: number
    percentage: number
}

interface PriceDistributionChartProps {
    data: PriceDistributionData[]
}

const valueFormatter = (number: number) =>
    Intl.NumberFormat("es-CL").format(number).toString()

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm text-sm">
                <p className="font-semibold text-slate-900 mb-2">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-slate-500">Proyectos:</span>
                    <span className="font-medium text-slate-900">
                        {valueFormatter(payload[0].value)}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">
                        ({payload[0].payload.percentage}%)
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export default function PriceDistributionChart({ data }: PriceDistributionChartProps) {
    return (
        <Card className="p-6">
            <Title>Distribución de Precios</Title>
            <Subtitle>
                Análisis por rango de valor (UF) en la oferta actual
            </Subtitle>
            <div className="mt-6 h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="range"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={valueFormatter}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar
                            dataKey="count"
                            name="Cantidad de Proyectos"
                            fill="#6366f1" // indigo-500
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
