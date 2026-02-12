'use client'

import { Card, Title, Subtitle } from '@tremor/react'
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

type EvolutionRow = {
    period: string
    total_units: number
    r1000_2000: number
    r2000_3000: number
    r3000_4000: number
    r4000_5000: number
    r5000_7000: number
    r7000_plus: number
}

interface ParticipationEvolutionChartProps {
    data: EvolutionRow[]
    metricLabel: 'oferta' | 'venta'
}

const RANGES = [
    { key: 'r1000_2000', label: '1.000 - 2.000', color: '#5B8FF9' },
    { key: 'r2000_3000', label: '2.001 - 3.000', color: '#F6BD16' },
    { key: 'r3000_4000', label: '3.001 - 4.000', color: '#61DDAA' },
    { key: 'r4000_5000', label: '4.001 - 5.000', color: '#9E9E9E' },
    { key: 'r5000_7000', label: '5.001 - 7.000', color: '#6F5EF9' },
    { key: 'r7000_plus', label: '> 7.000', color: '#1F2937' },
]

const percentFormatter = (value: number) => `${Math.round(value)}%`
const unitsFormatter = (value: number) => Intl.NumberFormat('es-CL').format(value)

export default function ParticipationEvolutionChart({ data, metricLabel }: ParticipationEvolutionChartProps) {
    return (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <Title>{`Participación % (${metricLabel.toUpperCase()}) por Rango UF`}</Title>
            <Subtitle>
                Evolución temporal de la composición del mercado dentro del alcance filtrado
            </Subtitle>
            <div className="mt-5 h-[430px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis
                            yAxisId="left"
                            domain={[0, 100]}
                            tickFormatter={percentFormatter}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={unitsFormatter}
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                            formatter={(value: any, name: string) => {
                                if (name === 'total_units') return [unitsFormatter(value), 'Total unidades']
                                return [`${Number(value).toFixed(1)}%`, name]
                            }}
                            labelFormatter={(label) => `Período: ${label}`}
                        />
                        <Legend
                            formatter={(value) => (
                                <span className="text-xs text-slate-600">{value}</span>
                            )}
                        />

                        {RANGES.map((range) => (
                            <Bar
                                key={range.key}
                                yAxisId="left"
                                dataKey={range.key}
                                name={range.label}
                                stackId="participation"
                                fill={range.color}
                                maxBarSize={36}
                            />
                        ))}

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="total_units"
                            name="total_units"
                            stroke="#DC2626"
                            strokeDasharray="4 4"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}

