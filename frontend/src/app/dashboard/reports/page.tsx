'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Download, FileText, TrendingUp, Building2 } from 'lucide-react'
import KPICard from '@/components/KPICard'

interface ReportData {
    generatedAt: string
    period: string
    summary: {
        totalProjects: number
        totalUnits: number
        soldUnits: number
        avgPrice: number
        topRegion: string
        topDeveloper: string
    }
    topProjects: Array<{
        name: string
        developer: string
        commune: string
        totalUnits: number
        soldUnits: number
        avgPrice: number
        salesSpeed: number
    }>
    regionalBreakdown: Array<{
        region: string
        projects: number
        avgPrice: number
        sellThrough: number
    }>
}

export default function ReportsPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        generateReport()
    }, [])

    const generateReport = async () => {
        try {
            const supabase = createClient()

            // Fetch all projects
            const { data: projects, error } = await supabase
                .from('projects')
                .select('*')

            if (error) throw error

            if (projects) {
                // Calculate summary
                const totalProjects = projects.length
                const totalUnits = projects.reduce((sum, p) => sum + (p.total_units || 0), 0)
                const soldUnits = projects.reduce((sum, p) => sum + (p.sold_units || 0), 0)

                const pricesWithValues = projects.filter(p => p.avg_price_uf)
                const avgPrice = pricesWithValues.length > 0
                    ? pricesWithValues.reduce((sum, p) => sum + (p.avg_price_uf || 0), 0) / pricesWithValues.length
                    : 0

                // Top region
                const regionCounts = projects.reduce((acc, p) => {
                    const region = p.region || 'N/A'
                    acc[region] = (acc[region] || 0) + 1
                    return acc
                }, {} as Record<string, number>)
                const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

                // Top developer
                const developerCounts = projects.reduce((acc, p) => {
                    const dev = p.developer || 'N/A'
                    acc[dev] = (acc[dev] || 0) + 1
                    return acc
                }, {} as Record<string, number>)
                const topDeveloper = Object.entries(developerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

                // Top projects by sales speed
                const topProjects = projects
                    .filter(p => p.sales_speed_monthly)
                    .sort((a, b) => (b.sales_speed_monthly || 0) - (a.sales_speed_monthly || 0))
                    .slice(0, 10)
                    .map(p => ({
                        name: p.name,
                        developer: p.developer || 'N/A',
                        commune: p.commune || 'N/A',
                        totalUnits: p.total_units || 0,
                        soldUnits: p.sold_units || 0,
                        avgPrice: p.avg_price_uf || 0,
                        salesSpeed: p.sales_speed_monthly || 0
                    }))

                // Regional breakdown
                const regionMap = new Map<string, { projects: number; totalPrice: number; priceCount: number; totalUnits: number; soldUnits: number }>()
                projects.forEach(p => {
                    const region = p.region || 'N/A'
                    if (!regionMap.has(region)) {
                        regionMap.set(region, { projects: 0, totalPrice: 0, priceCount: 0, totalUnits: 0, soldUnits: 0 })
                    }
                    const data = regionMap.get(region)!
                    data.projects++
                    if (p.avg_price_uf) {
                        data.totalPrice += p.avg_price_uf
                        data.priceCount++
                    }
                    data.totalUnits += p.total_units || 0
                    data.soldUnits += p.sold_units || 0
                })

                const regionalBreakdown = Array.from(regionMap.entries())
                    .map(([region, data]) => ({
                        region,
                        projects: data.projects,
                        avgPrice: data.priceCount > 0 ? data.totalPrice / data.priceCount : 0,
                        sellThrough: data.totalUnits > 0 ? (data.soldUnits / data.totalUnits) * 100 : 0
                    }))
                    .sort((a, b) => b.projects - a.projects)

                setReportData({
                    generatedAt: new Date().toISOString(),
                    period: 'Actual',
                    summary: {
                        totalProjects,
                        totalUnits,
                        soldUnits,
                        avgPrice,
                        topRegion,
                        topDeveloper
                    },
                    topProjects,
                    regionalBreakdown
                })
            }

            setLoading(false)
        } catch (error) {
            console.error('Error generating report:', error)
            setLoading(false)
        }
    }

    const exportReport = () => {
        if (!reportData) return

        const reportText = `
REPORTE EJECUTIVO DEL MERCADO INMOBILIARIO
Generado: ${new Date(reportData.generatedAt).toLocaleString('es-CL')}
Período: ${reportData.period}

═══════════════════════════════════════════════════════════

RESUMEN EJECUTIVO

Total de Proyectos: ${reportData.summary.totalProjects.toLocaleString()}
Total de Unidades: ${reportData.summary.totalUnits.toLocaleString()}
Unidades Vendidas: ${reportData.summary.soldUnits.toLocaleString()}
Precio Promedio: ${reportData.summary.avgPrice.toLocaleString()} UF
Región Líder: ${reportData.summary.topRegion}
Desarrollador Líder: ${reportData.summary.topDeveloper}

═══════════════════════════════════════════════════════════

TOP 10 PROYECTOS POR VELOCIDAD DE VENTA

${reportData.topProjects.map((p, i) => `
${i + 1}. ${p.name}
   Desarrollador: ${p.developer}
   Ubicación: ${p.commune}
   Velocidad: ${p.salesSpeed.toFixed(1)} unidades/mes
   Avance: ${p.soldUnits}/${p.totalUnits} unidades (${((p.soldUnits / p.totalUnits) * 100).toFixed(1)}%)
   Precio: ${p.avgPrice.toLocaleString()} UF
`).join('\n')}

═══════════════════════════════════════════════════════════

DESGLOSE REGIONAL

${reportData.regionalBreakdown.map(r => `
Región ${r.region}:
  - Proyectos: ${r.projects.toLocaleString()}
  - Precio Promedio: ${r.avgPrice.toLocaleString()} UF
  - Tasa de Venta: ${r.sellThrough.toFixed(1)}%
`).join('\n')}

═══════════════════════════════════════════════════════════

Fin del Reporte
    `.trim()

        const blob = new Blob([reportText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte-mercado-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Generando reporte...</p>
                </div>
            </div>
        )
    }

    if (!reportData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">No se pudo generar el reporte</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reporte Ejecutivo</h1>
                        <p className="text-gray-600">
                            Generado el {new Date(reportData.generatedAt).toLocaleDateString('es-CL')} a las{' '}
                            {new Date(reportData.generatedAt).toLocaleTimeString('es-CL')}
                        </p>
                    </div>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KPICard
                        title="Total de Proyectos"
                        value={reportData.summary.totalProjects}
                        icon={<Building2 className="w-6 h-6" />}
                    />
                    <KPICard
                        title="Total de Unidades"
                        value={reportData.summary.totalUnits}
                        icon={<FileText className="w-6 h-6" />}
                    />
                    <KPICard
                        title="Precio Promedio"
                        value={reportData.summary.avgPrice}
                        format="currency"
                        icon={<TrendingUp className="w-6 h-6" />}
                    />
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Insights Clave</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Región Líder</p>
                            <p className="text-2xl font-bold text-blue-900">Región {reportData.summary.topRegion}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Desarrollador Líder</p>
                            <p className="text-2xl font-bold text-green-900">{reportData.summary.topDeveloper}</p>
                        </div>
                    </div>
                </div>

                {/* Top Projects */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Top 10 Proyectos por Velocidad de Venta</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desarrollador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comuna</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Velocidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.topProjects.map((project, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.developer}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.commune}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                            {project.salesSpeed.toFixed(1)} u/mes
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {project.soldUnits}/{project.totalUnits} ({((project.soldUnits / project.totalUnits) * 100).toFixed(1)}%)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {project.avgPrice.toLocaleString()} UF
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Desglose Regional</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Región</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyectos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Venta</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.regionalBreakdown.map((region) => (
                                    <tr key={region.region} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            Región {region.region}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {region.projects.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {region.avgPrice.toLocaleString()} UF
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${region.sellThrough}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{region.sellThrough.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
