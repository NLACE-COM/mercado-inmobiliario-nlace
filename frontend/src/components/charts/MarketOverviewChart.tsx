'use client'

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

export default function MarketOverviewChart({ data }: MarketOverviewChartProps) {
    return (
        <div className="w-full h-[400px] bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Panorama del Mercado por Región</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="region"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                    />
                    <Bar dataKey="totalUnits" fill="#3b82f6" name="Total Unidades" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="soldUnits" fill="#10b981" name="Vendidas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="availableUnits" fill="#f59e0b" name="Disponibles" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
