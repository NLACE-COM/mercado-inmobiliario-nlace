'use client'

import { Card, Title, Subtitle } from '@tremor/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

const valueFormatter = (number: number) =>
    Intl.NumberFormat("es-CL").format(number).toString()

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm text-sm">
                <p className="font-semibold text-slate-900 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-500 capitalize">
                            {entry.name === 'totalUnits' ? 'Total' :
                                entry.name === 'soldUnits' ? 'Vendidas' : 'Disponibles'}:
                        </span>
                        <span className="font-medium text-slate-900">
                            {valueFormatter(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function MarketOverviewChart({ data }: MarketOverviewChartProps) {
    return (
        <Card className="p-6">
            <Title>Panorama del Mercado por Región</Title>
            <Subtitle>
                Distribución de inventario y ventas en las principales zonas
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
                            dataKey="region"
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
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => {
                                const labels: Record<string, string> = {
                                    totalUnits: 'Total Unidades',
                                    soldUnits: 'Vendidas',
                                    availableUnits: 'Disponibles'
                                }
                                return <span className="text-slate-500 text-sm font-medium ml-1">{labels[value]}</span>
                            }}
                        />
                        <Bar
                            dataKey="totalUnits"
                            name="totalUnits"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                        <Bar
                            dataKey="soldUnits"
                            name="soldUnits"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                        <Bar
                            dataKey="availableUnits"
                            name="availableUnits"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
