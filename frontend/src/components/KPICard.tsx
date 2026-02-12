'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon?: React.ReactNode
    format?: 'number' | 'currency' | 'percentage'
}

export default function KPICard({
    title,
    value,
    change,
    changeLabel,
    icon,
    format = 'number'
}: KPICardProps) {
    const formatValue = (val: string | number) => {
        if (typeof val === 'string') return val

        switch (format) {
            case 'currency':
                return `${val.toLocaleString('es-CL')} UF`
            case 'percentage':
                return `${val.toFixed(1)}%`
            default:
                return val.toLocaleString('es-CL')
        }
    }

    const getTrendIcon = () => {
        if (change === undefined || change === 0) return <Minus className="w-4 h-4" />
        return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
    }

    const getTrendColor = () => {
        if (change === undefined || change === 0) return 'text-muted-foreground'
        return change > 0 ? 'text-success' : 'text-destructive'
    }

    return (
        <div className="bg-card rounded-card shadow-soft border border-input p-6 transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <div className="font-display text-3xl font-semibold text-foreground mb-2">
                        {formatValue(value)}
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {Math.abs(change).toFixed(1)}%
                            </span>
                            {changeLabel && (
                                <span className="text-muted-foreground ml-1">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-[12px]">
                        <div className="text-primary">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
