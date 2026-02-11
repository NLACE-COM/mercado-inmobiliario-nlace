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
        if (change === undefined || change === 0) return 'text-gray-500'
        return change > 0 ? 'text-green-600' : 'text-red-600'
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatValue(value)}
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {Math.abs(change).toFixed(1)}%
                            </span>
                            {changeLabel && (
                                <span className="text-gray-500 ml-1">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                        <div className="text-blue-600">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
