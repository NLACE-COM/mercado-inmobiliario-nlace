'use client'

import { Card, Title } from '@tremor/react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ProductMixData {
    typology: string
    count: number
}

interface ProductMixChartProps {
    data: ProductMixData[]
}

const COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#8b5cf6', '#a855f7']

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm text-sm">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: payload[0].payload.fill }}
                    />
                    <span className="font-medium text-slate-900">{payload[0].name}:</span>
                    <span className="text-slate-600">{payload[0].value} proyectos</span>
                </div>
            </div>
        )
    }
    return null
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={500}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null
}

export function ProductMixChart({ data }: ProductMixChartProps) {
    // Add fill color to data
    const chartData = data.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
    }))

    const total = data.reduce((acc, curr) => acc + curr.count, 0)

    return (
        <Card className="h-[400px] flex flex-col">
            <Title>Mix de Productos</Title>
            <div className="flex-1 w-full min-h-0 relative">
                {/* Centered Total Label directly overlaid */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{total}</p>
                        <p className="text-xs text-slate-500 uppercase font-medium">Proyectos</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="typology"
                            labelLine={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
