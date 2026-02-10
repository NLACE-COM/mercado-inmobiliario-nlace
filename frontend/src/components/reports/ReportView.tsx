'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ArrowLeft, Download, Building2, TrendingUp, DollarSign, Loader2, FileText, BarChart3, ScatterChart as ScatterIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    Legend
} from 'recharts'

function exportToCsv(report: any) {
    const tableSection = report.content?.sections?.find((s: any) => s.type === 'project_table')
    if (!tableSection || !tableSection.data) return

    const header = ["Proyecto", "Inmobiliaria", "Unidades", "Vendidas", "% Venta", "Vel. Venta", "MAO", "Stock", "Precio Promedio"]
    const rows = tableSection.data.map((row: any) => [
        row.name,
        row.developer,
        row.total_units,
        row.sold_units,
        row.percent_sold,
        row.sales_speed,
        row.mao,
        row.stock,
        row.avg_price_uf
    ])

    const csvContent = "data:text/csv;charset=utf-8,"
        + header.join(",") + "\n"
        + rows.map((e: any[]) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${report.title || "reporte"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export default function ReportView({ report }: { report: any }) {
    const router = useRouter()

    useEffect(() => {
        if (report.status === 'generating') {
            const interval = setInterval(() => {
                router.refresh()
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [report.status, router])

    if (report.status === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <h2 className="text-xl font-semibold">Generando reporte con IA...</h2>
                <p className="text-muted-foreground">Analizando datos de mercado y redactando conclusiones.</p>
            </div>
        )
    }

    if (report.status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                <h2 className="text-xl font-semibold text-red-500">Error en la generación</h2>
                <p className="text-muted-foreground max-w-md">{report.error_message || "Ocurrió un error inesperado."}</p>
                <Link href="/dashboard/reports">
                    <Button variant="outline">Volver al listado</Button>
                </Link>
            </div>
        )
    }

    const { content } = report
    if (!content) return <div>Reporte vacío</div>

    return (
        <div className="space-y-8 pb-16 print:p-0 print:space-y-4">
            {/* Header / Actions */}
            <div className="flex justify-between items-center print:hidden">
                <Link href="/dashboard/reports">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportToCsv(report)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block border-b pb-4 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">Mercado Inmobiliario: {report.parameters.commune}</h1>
                <p className="text-slate-500">Generado el {new Date(report.created_at).toLocaleDateString()}</p>
            </div>

            {/* Report Title */}
            <div className="space-y-2 print:hidden">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
                    <Badge>{report.report_type}</Badge>
                </div>
                <p className="text-muted-foreground">
                    Generado el {new Date(report.created_at).toLocaleString()}
                </p>
            </div>

            {/* SECTIONS RENDERER */}
            {content.sections?.map((section: any, idx: number) => {
                const key = `${section.type}-${idx}`

                switch (section.type) {
                    case 'summary':
                    case 'analysis_text': // Handle both text types similarly
                        return (
                            <Card key={key} className="bg-slate-50 border-none shadow-none print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {section.type === 'summary' ? <Building2 className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                        {section.content}
                                    </p>
                                </CardContent>
                            </Card>
                        )

                    case 'kpi_grid':
                        return (
                            <div key={key} className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 print:break-inside-avoid">
                                    <KpiCard title="Proyectos Totales" value={section.data.total_projects} icon={Building2} />
                                    <KpiCard title="Precio Promedio (UF)" value={section.data.avg_price?.toLocaleString()} icon={DollarSign} />
                                    <KpiCard title="Vel. Venta Promedio" value={section.data.avg_sales_speed} icon={TrendingUp} />
                                    <KpiCard title="Stock Total" value={section.data.total_stock} icon={BarChart3} />
                                    <KpiCard title="MAO Promedio" value={section.data.avg_mao} icon={ScatterIcon} />
                                </div>
                                {section.data.total_projects === 0 && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800 text-sm">
                                        No se encontraron proyectos activos para los criterios seleccionados. Verifica que la comuna sea correcta o intenta con otra.
                                    </div>
                                )}
                            </div>
                        )

                    case 'chart_scatter':
                        if (section.data.length === 0) return null;
                        return (
                            <Card key={key} className="print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle>{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[400px] w-full min-h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" dataKey="avg_price_uf" name="Precio" unit=" UF" label={{ value: 'Precio (UF)', position: 'bottom', offset: 20 }} />
                                            <YAxis type="number" dataKey="sales_speed" name="Velocidad" unit=" un/m" label={{ value: 'Velocidad (un/mes)', angle: -90, position: 'insideLeft', offset: -10 }} />
                                            <ZAxis type="number" dataKey="stock" range={[100, 1000]} name="Stock" />
                                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={CustomTooltip} />
                                            <Legend verticalAlign="top" height={36} />
                                            <Scatter name="Proyectos" data={section.data} fill="#3b82f6" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )

                    case 'chart_bar':
                        if (section.data.length === 0) return null;
                        return (
                            <Card key={key} className="print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle>{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[400px] w-full min-h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={section.data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="developer" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <RechartsTooltip />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="stock" fill="#10b981" name="Stock Disponible (Unidades)" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )

                    case 'project_table':
                        return (
                            <Card key={key} className="print:break-before-page">
                                <CardHeader>
                                    <CardTitle>{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Proyecto</TableHead>
                                                    <TableHead>Inmobiliaria</TableHead>
                                                    <TableHead className="text-right">Stock</TableHead>
                                                    <TableHead className="text-right">Precio Prom.</TableHead>
                                                    <TableHead className="text-right">Vel. Venta</TableHead>
                                                    <TableHead className="text-right">MAO</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {section.data.map((row: any) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">{row.name}</TableCell>
                                                        <TableCell>{row.developer}</TableCell>
                                                        <TableCell className="text-right">{row.stock}</TableCell>
                                                        <TableCell className="text-right">{row.avg_price_uf?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right font-bold text-blue-600">
                                                            {row.sales_speed}
                                                        </TableCell>
                                                        <TableCell className="text-right">{row.mao}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )

                    default:
                        return null
                }
            })}
        </div>
    )
}

function KpiCard({ title, value, icon: Icon }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border rounded shadow-lg">
                <p className="font-bold">{data.name}</p>
                <p className="text-sm text-gray-600">{data.developer}</p>
                <div className="mt-2 text-sm">
                    <p>Precio: {data.avg_price_uf} UF</p>
                    <p>Velocidad: {data.sales_speed} un/mes</p>
                    <p>Stock: {data.stock} un</p>
                </div>
            </div>
        );
    }
    return null;
};
