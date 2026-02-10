'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import KPICard from '@/components/KPICard'
import MarketOverviewChart from '@/components/charts/MarketOverviewChart'
import PriceDistributionChart from '@/components/charts/PriceDistributionChart'
import { Building2, TrendingUp, DollarSign, Package } from 'lucide-react'

interface DashboardStats {
    totalProjects: number
    totalUnits: number
    soldUnits: number
    availableUnits: number
    avgPrice: number
    avgPriceM2: number
    sellThroughRate: number
}

interface RegionData {
    region: string
    projects: number
    totalUnits: number
    soldUnits: number
    availableUnits: number
}

interface PriceRange {
    range: string
    count: number
    percentage: number
}

interface RawProject {
    region: string | null
    total_units: number | null
    sold_units: number | null
    available_units: number | null
    avg_price_uf: number | null
    avg_price_m2_uf: number | null
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [regionData, setRegionData] = useState<RegionData[]>([])
    const [priceDistribution, setPriceDistribution] = useState<PriceRange[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const supabase = createClient()

            // Fetch all projects
            const { data: projects, error } = await supabase
                .from('projects')
                .select('region, total_units, sold_units, available_units, avg_price_uf, avg_price_m2_uf')

            if (error) throw error

            if (projects) {
                const typedProjects = projects as RawProject[]
                // Calculate overall stats
                const totalProjects = typedProjects.length
                const totalUnits = typedProjects.reduce((sum: number, p: RawProject) => sum + (p.total_units || 0), 0)
                const soldUnits = typedProjects.reduce((sum: number, p: RawProject) => sum + (p.sold_units || 0), 0)
                const availableUnits = typedProjects.reduce((sum: number, p: RawProject) => sum + (p.available_units || 0), 0)

                const pricesWithValues = typedProjects.filter((p: RawProject) => p.avg_price_uf)
                const avgPrice = pricesWithValues.length > 0
                    ? pricesWithValues.reduce((sum: number, p: RawProject) => sum + (p.avg_price_uf || 0), 0) / pricesWithValues.length
                    : 0

                const pricesM2WithValues = typedProjects.filter((p: RawProject) => p.avg_price_m2_uf)
                const avgPriceM2 = pricesM2WithValues.length > 0
                    ? pricesM2WithValues.reduce((sum: number, p: RawProject) => sum + (p.avg_price_m2_uf || 0), 0) / pricesM2WithValues.length
                    : 0

                const sellThroughRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0

                setStats({
                    totalProjects,
                    totalUnits,
                    soldUnits,
                    availableUnits,
                    avgPrice,
                    avgPriceM2,
                    sellThroughRate
                })

                // Group by region
                const regionMap = new Map<string, RegionData>()
                typedProjects.forEach((p: RawProject) => {
                    const region = p.region || 'N/A'
                    if (!regionMap.has(region)) {
                        regionMap.set(region, {
                            region,
                            projects: 0,
                            totalUnits: 0,
                            soldUnits: 0,
                            availableUnits: 0
                        })
                    }
                    const data = regionMap.get(region)!
                    data.projects++
                    data.totalUnits += p.total_units || 0
                    data.soldUnits += p.sold_units || 0
                    data.availableUnits += p.available_units || 0
                })

                const regionDataArray = Array.from(regionMap.values())
                    .sort((a, b) => b.projects - a.projects)
                    .slice(0, 8) // Top 8 regions

                setRegionData(regionDataArray)

                // Price distribution
                const priceRanges = [
                    { range: '< 1,000 UF', min: 0, max: 1000 },
                    { range: '1,000 - 2,000 UF', min: 1000, max: 2000 },
                    { range: '2,000 - 3,000 UF', min: 2000, max: 3000 },
                    { range: '3,000 - 5,000 UF', min: 3000, max: 5000 },
                    { range: '5,000 - 10,000 UF', min: 5000, max: 10000 },
                    { range: '> 10,000 UF', min: 10000, max: Infinity }
                ]

                const distribution = priceRanges.map(range => {
                    const count = typedProjects.filter((p: RawProject) => {
                        const price = p.avg_price_uf || 0
                        return price >= range.min && price < range.max
                    }).length
                    return {
                        range: range.range,
                        count,
                        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0
                    }
                }).filter(d => d.count > 0)

                setPriceDistribution(distribution)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard del Mercado Inmobiliario</h1>
                    <p className="text-gray-600">Análisis en tiempo real del mercado inmobiliario chileno</p>
                </div>

                {/* KPIs */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <KPICard
                            title="Total de Proyectos"
                            value={stats.totalProjects}
                            icon={<Building2 className="w-6 h-6" />}
                        />
                        <KPICard
                            title="Total de Unidades"
                            value={stats.totalUnits}
                            icon={<Package className="w-6 h-6" />}
                        />
                        <KPICard
                            title="Precio Promedio"
                            value={stats.avgPrice}
                            format="currency"
                            icon={<DollarSign className="w-6 h-6" />}
                        />
                        <KPICard
                            title="Tasa de Venta"
                            value={stats.sellThroughRate}
                            format="percentage"
                            icon={<TrendingUp className="w-6 h-6" />}
                        />
                    </div>
                )}

                {/* Secondary KPIs */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <KPICard
                            title="Unidades Vendidas"
                            value={stats.soldUnits}
                        />
                        <KPICard
                            title="Unidades Disponibles"
                            value={stats.availableUnits}
                        />
                        <KPICard
                            title="Precio Promedio por m²"
                            value={stats.avgPriceM2}
                            format="currency"
                        />
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <MarketOverviewChart data={regionData} />
                    <PriceDistributionChart data={priceDistribution} />
                </div>

                {/* Top Regions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Regiones por Número de Proyectos</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Región
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proyectos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Unidades
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendidas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Disponibles
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tasa de Venta
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {regionData.map((region) => {
                                    const sellThrough = region.totalUnits > 0
                                        ? (region.soldUnits / region.totalUnits) * 100
                                        : 0

                                    return (
                                        <tr key={region.region} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Región {region.region}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {region.projects.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {region.totalUnits.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                {region.soldUnits.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                                {region.availableUnits.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${sellThrough}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{sellThrough.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
