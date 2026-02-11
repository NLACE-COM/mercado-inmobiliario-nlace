'use client'

import { useQuery } from '@tanstack/react-query'
import { Callout, Card, Text } from '@tremor/react'
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
            {alerts.map((alert) => (
                <Callout
                    key={alert.id}
                    title={alert.title}
                    icon={alert.type === 'critical' ? AlertCircle : alert.type === 'warning' ? AlertTriangle : Info}
                    color={alert.type === 'critical' ? 'rose' : alert.type === 'warning' ? 'amber' : 'blue'}
                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <div className="mt-2 flex flex-col gap-2">
                        <Text>{alert.description}</Text>
                        {alert.actionable && (
                            <Link
                                href={alert.actionable.href}
                                className="text-sm font-medium flex items-center gap-1 hover:underline"
                            >
                                {alert.actionable.label} <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                </Callout>
            ))}
        </div>
    )
}
