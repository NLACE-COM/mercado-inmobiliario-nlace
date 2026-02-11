'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@tremor/react'
import { AlertTriangle, AlertCircle, Info, ArrowUpRight } from 'lucide-react'
import { Alert } from '@/lib/alerts'
import Link from 'next/link'

async function fetchAlerts(): Promise<Alert[]> {
    const res = await fetch('/api/alerts')
    if (!res.ok) throw new Error('Failed to fetch alerts')
    return res.json()
}

export function MarketAlerts() {
    const { data: alerts, isLoading, error } = useQuery({
        queryKey: ['market-alerts'],
        queryFn: fetchAlerts,
        refetchInterval: 60 * 1000 // Refresh every minute
    })

    if (isLoading) return <div className="h-20 w-full animate-pulse bg-slate-100 rounded-lg"></div>
    if (error) return <Text className="text-red-500">Error cargando alertas</Text>

    if (!alerts || alerts.length === 0) {
        return (
            <Card className="p-4 border-dashed border-2 flex items-center justify-center bg-slate-50/50">
                <Text className="text-slate-500">✓ No se detectan anomalías críticas en el mercado</Text>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {alerts.map((alert) => {
                const Icon = alert.type === 'critical' ? AlertCircle : alert.type === 'warning' ? AlertTriangle : Info
                const colorClass = alert.type === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                        'bg-blue-50 border-blue-200 text-blue-900'
                const iconColor = alert.type === 'critical' ? 'text-rose-600' :
                    alert.type === 'warning' ? 'text-amber-600' :
                        'text-blue-600'

                return (
                    <div
                        key={alert.id}
                        className={`p-4 rounded-md border ${colorClass} animate-in fade-in slide-in-from-top-2 duration-300`}
                    >
                        <div className="flex gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{alert.title}</h4>
                                <div className="mt-1 text-sm opacity-90">
                                    {alert.description}
                                </div>
                                {alert.actionable && (
                                    <Link
                                        href={alert.actionable.href}
                                        className="mt-2 text-sm font-medium flex items-center gap-1 hover:underline w-fit"
                                    >
                                        {alert.actionable.label} <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
