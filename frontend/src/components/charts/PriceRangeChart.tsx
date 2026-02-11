'use client'

import { Card, Title } from '@tremor/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PriceRangeData {
    range: string
    oferta: number
    vendidas: number
}

interface PriceRangeChartProps {
    data: PriceRangeData[]
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
                            {entry.name === 'oferta' ? 'Oferta' : 'Vendidas'}:
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

export function PriceRangeChart({ data }: PriceRangeChartProps) {
    return (
        <Card>
            <Title>Participación por Rango de Precio</Title>
            <div className="mt-6 h-72 w-full">
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
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-slate-500 text-sm font-medium ml-1 capitalize">{value}</span>}
                        />
                        <Bar
                            dataKey="oferta"
                            name="oferta"
                            stackId="a"
                            fill="#3b82f6" // blue-500
                            radius={[0, 0, 4, 4]} // Bottom radius for the bottom stack
                            maxBarSize={50}
                        />
                        <Bar
                            dataKey="vendidas"
                            name="vendidas"
                            stackId="a"
                            fill="#10b981" // emerald-500
                            radius={[4, 4, 0, 0]} // Top radius for the top stack
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
