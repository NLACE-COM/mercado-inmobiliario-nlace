'use client'

import { Card, Subtitle, Title } from '@tremor/react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts'

type ShareItem = {
    typology: string
    value: number
    percent: number
    color: string
}

type ShareMetric = {
    key: string
    title: string
    baseLabel: string
    baseValue: number
    items: ShareItem[]
}

type PricePoint = {
    typology: string
    avg_price_uf: number
    avg_price_m2: number
}

interface TypologyCompetitionChartProps {
    metrics: ShareMetric[]
    priceData: PricePoint[]
}

const unitsFormatter = (value: number) => Intl.NumberFormat('es-CL').format(Math.round(value))

export default function TypologyCompetitionChart({ metrics, priceData }: TypologyCompetitionChartProps) {
    const hasData = metrics.some((metric) => metric.baseValue > 0)

    if (!hasData) {
        return (
            <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <Title>Competencia Primaria (Mix Tipologías)</Title>
                <Subtitle>No hay base tipológica suficiente en el alcance actual para comparar oferta vs venta.</Subtitle>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <Title>Competencia Primaria (Mix Tipologías)</Title>
            <Subtitle>Comparación directa entre oferta y venta por tipología en el escenario filtrado</Subtitle>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
                {metrics.map((metric) => (
                    <div key={metric.key} className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-2">{metric.title}</p>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metric.items}
                                        dataKey="value"
                                        nameKey="typology"
                                        innerRadius={42}
                                        outerRadius={68}
                                        paddingAngle={1}
                                    >
                                        {metric.items.map((item) => (
                                            <Cell key={`${metric.key}-${item.typology}`} fill={item.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any, _name: any, payload: any) => [
                                            `${unitsFormatter(Number(value))} (${payload?.payload?.percent?.toFixed(1) || 0}%)`,
                                            payload?.payload?.typology || '',
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-slate-500 text-center mt-1">
                            {metric.baseLabel}: <span className="font-semibold text-slate-700">{unitsFormatter(metric.baseValue)}</span>
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={priceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="typology" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tickFormatter={unitsFormatter} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip
                            formatter={(value: any, name: any) => {
                                if (name === 'Precio Promedio UF') return [unitsFormatter(Number(value)), name]
                                return [Number(value).toFixed(1), name]
                            }}
                        />
                        <Legend />
                        <Bar
                            yAxisId="left"
                            dataKey="avg_price_uf"
                            name="Precio Promedio UF"
                            fill="#1D4ED8"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={56}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avg_price_m2"
                            name="UF/m²"
                            stroke="#DC2626"
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
