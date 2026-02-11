import { getSupabaseAdmin } from './supabase-server'

export interface Alert {
    id: string
    type: 'warning' | 'critical' | 'info'
    title: string
    description: string
    actionable?: {
        label: string
        href: string
    }
}

export async function generateMarketAlerts(): Promise<Alert[]> {
    const supabase = getSupabaseAdmin()

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1000)

    if (error || !projects) return []

    const alerts: Alert[] = []

    // Alerta 1: MAO alto (>24 meses)
    const highMAO = projects.filter(p => (p.months_to_sell_out || 0) > 24)
    if (highMAO.length > 0) {
        alerts.push({
            id: 'high-mao',
            type: 'warning',
            title: `${highMAO.length} proyectos con MAO >24 meses`,
            description: 'Se detecta un alto riesgo de sobresaturación en el inventario actual.',
            actionable: { label: 'Ver proyectos', href: '/dashboard/projects?mao=high' }
        })
    }

    // Alerta 2: Absorción promedio baja (<5%)
    // Absorción mensual = (ventas del mes / stock disponible) * 100
    const totalSalesSpeed = projects.reduce((acc, p) => acc + (p.sales_speed_monthly || 0), 0)
    const totalStock = projects.reduce((acc, p) => acc + (p.available_units || 0), 0)
    const avgAbsorption = totalStock > 0 ? (totalSalesSpeed / totalStock) * 100 : 0

    if (avgAbsorption > 0 && avgAbsorption < 5) {
        alerts.push({
            id: 'low-absorption',
            type: 'critical',
            title: 'Absorción bajo 5% - Mercado en contracción',
            description: `La velocidad de absorción actual (${avgAbsorption.toFixed(1)}%) está por debajo de los niveles saludables (8-12%).`
        })
    }

    // Alerta 3: Stock alto + ventas bajas (Estancamiento)
    const stagnant = projects.filter(p =>
        (p.total_units || 0) > 0 &&
        (p.available_units / p.total_units) > 0.7 &&
        (p.sales_speed_monthly || 0) < 0.5
    )
    if (stagnant.length > 0) {
        alerts.push({
            id: 'stagnant-projects',
            type: 'warning',
            title: `${stagnant.length} proyectos estancados`,
            description: 'Proyectos con más del 70% de stock disponible y menos de 0.5 ventas promedio mensual.'
        })
    }

    return alerts
}
