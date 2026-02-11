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
import { Card as TremorCard, Metric, Text as TremorText, Grid, Title } from "@tremor/react"
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
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
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

import { exportReportToPDF } from '@/lib/pdf-export'
import { useState } from 'react'

import { useToast } from "@/components/ui/use-toast"

export default function ReportView({ report }: { report: any }) {
    const router = useRouter()
    const { toast } = useToast()
    const [isExporting, setIsExporting] = useState(false)

    const handleDownloadPDF = async () => {
        setIsExporting(true)
        toast({
            title: "Generando PDF",
            description: "Esto puede tardar unos segundos dependiendo del tamaño del reporte.",
        })

        try {
            await exportReportToPDF('report-container', report.title || 'reporte')
            toast({
                title: "Reporte descargado",
                description: "El archivo PDF se ha generado con éxito.",
            })
        } catch (e: any) {
            console.error(e)
            toast({
                title: "Error al exportar",
                description: e.message || "No se pudo generar el PDF por un error técnico del navegador.",
                variant: "destructive"
            })
        } finally {
            setIsExporting(false)
        }
    }

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
        <div id="report-container" className="space-y-8 pb-16 print:p-0 print:space-y-4 bg-white p-8 rounded-xl shadow-sm">
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
                    <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {isExporting ? 'Generando...' : 'Descargar PDF'}
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
                            <TremorCard key={key} className="bg-slate-50 p-6 print:break-inside-avoid">
                                <div className="flex items-center gap-2 mb-4">
                                    {section.type === 'summary' ? <Building2 className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
                                    <Title className="text-slate-900">{section.title}</Title>
                                </div>
                                <MarkdownRenderer content={section.content} />
                            </TremorCard>
                        )

                    case 'kpi_grid':
                        return (
                            <div key={key} className="space-y-6">
                                <Grid numItemsSm={2} numItemsMd={3} numItemsLg={5} className="gap-4 print:break-inside-avoid">
                                    <TremorCard decoration="top" decorationColor="blue">
                                        <TremorText>Proyectos Totales</TremorText>
                                        <Metric>{section.data.total_projects}</Metric>
                                    </TremorCard>
                                    <TremorCard decoration="top" decorationColor="emerald">
                                        <TremorText>Precio Promedio (UF)</TremorText>
                                        <Metric>{section.data.avg_price?.toLocaleString()}</Metric>
                                    </TremorCard>
                                    <TremorCard decoration="top" decorationColor="indigo">
                                        <TremorText>Vel. Venta Promedio</TremorText>
                                        <Metric>{section.data.avg_sales_speed}</Metric>
                                    </TremorCard>
                                    <TremorCard decoration="top" decorationColor="amber">
                                        <TremorText>Stock Total</TremorText>
                                        <Metric>{section.data.total_stock}</Metric>
                                    </TremorCard>
                                    <TremorCard decoration="top" decorationColor="rose">
                                        <TremorText>MAO Promedio</TremorText>
                                        <Metric>{section.data.avg_mao}</Metric>
                                    </TremorCard>
                                </Grid>
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

                    case 'comparison_table':
                        if (!section.data || section.data.length === 0) return null;
                        return (
                            <Card key={key} className="print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle>{section.title || 'Comparativa Regional'}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Comuna</TableHead>
                                                    <TableHead className="text-right">Proyectos</TableHead>
                                                    <TableHead className="text-right">Precio Prom. (UF)</TableHead>
                                                    <TableHead className="text-right">UF/m²</TableHead>
                                                    <TableHead className="text-right">Stock Total</TableHead>
                                                    <TableHead className="text-right">Vel. Venta</TableHead>
                                                    <TableHead className="text-right">MAO (meses)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {section.data.map((row: any, idx: number) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-semibold">{row.commune}</TableCell>
                                                        <TableCell className="text-right">{row.total_projects}</TableCell>
                                                        <TableCell className="text-right">{row.avg_price_uf?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">{row.avg_price_m2_uf?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">{row.total_available?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right font-bold text-green-600">{row.avg_sales_speed}</TableCell>
                                                        <TableCell className="text-right">{row.mao}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )

                    case 'trend_chart':
                        if (!section.data || section.data.length === 0) return null;
                        return (
                            <Card key={key} className="print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{section.title || 'Tendencias Históricas'}</span>
                                        {section.trend_indicators && (
                                            <div className="flex gap-4 text-sm">
                                                {section.trend_indicators.price_change_pct && (
                                                    <Badge variant={parseFloat(section.trend_indicators.price_change_pct) > 0 ? 'default' : 'secondary'}>
                                                        Precio: {parseFloat(section.trend_indicators.price_change_pct) > 0 ? '↑' : '↓'} {Math.abs(section.trend_indicators.price_change_pct)}%
                                                    </Badge>
                                                )}
                                                {section.trend_indicators.stock_change_pct && (
                                                    <Badge variant={parseFloat(section.trend_indicators.stock_change_pct) > 0 ? 'default' : 'secondary'}>
                                                        Stock: {parseFloat(section.trend_indicators.stock_change_pct) > 0 ? '↑' : '↓'} {Math.abs(section.trend_indicators.stock_change_pct)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={section.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis yAxisId="left" label={{ value: 'Precio (UF)', angle: -90, position: 'insideLeft' }} />
                                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Stock (unidades)', angle: 90, position: 'insideRight' }} />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="avg_price_uf" stroke="#3b82f6" strokeWidth={2} name="Precio Promedio (UF)" />
                                            <Line yAxisId="right" type="monotone" dataKey="total_stock" stroke="#10b981" strokeWidth={2} name="Stock Total" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )

                    case 'typology_breakdown':
                        if (!section.data || Object.keys(section.data).length === 0) return null;

                        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        const pieData = Object.entries(section.data).map(([typology, stats]: [string, any]) => ({
                            name: typology,
                            value: stats.stock,
                            percentage: stats.percentage_of_total
                        }));

                        return (
                            <Card key={key} className="print:break-inside-avoid">
                                <CardHeader>
                                    <CardTitle>{section.title || 'Análisis por Tipología'}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Pie Chart */}
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Stats Table */}
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Tipología</TableHead>
                                                        <TableHead className="text-right">Stock</TableHead>
                                                        <TableHead className="text-right">Precio (UF)</TableHead>
                                                        <TableHead className="text-right">Vel. Venta</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(section.data).map(([typology, stats]: [string, any], idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-semibold">{typology}</TableCell>
                                                            <TableCell className="text-right">{stats.stock}</TableCell>
                                                            <TableCell className="text-right">{stats.avg_price_uf?.toLocaleString()}</TableCell>
                                                            <TableCell className="text-right">{stats.avg_sales_speed || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
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

// Simple Markdown Renderer for Bold and Lists
function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    // Split by paragraphs
    const paragraphs = content.split('\n\n');

    return (
        <div className="space-y-4 text-slate-700">
            {paragraphs.map((paragraph, idx) => {
                // Check if it's a list item
                if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                    const items = paragraph.split('\n').filter(l => l.trim().length > 0);
                    return (
                        <ul key={idx} className="list-disc pl-5 space-y-1">
                            {items.map((item, i) => (
                                <li key={i}>
                                    <FormattedText text={item.replace(/^[-*] /, '')} />
                                </li>
                            ))}
                        </ul>
                    );
                }

                // Handle Headers
                if (paragraph.trim().startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-bold mt-4 mb-2"><FormattedText text={paragraph.replace(/^### /, '')} /></h3>
                }

                return (
                    <p key={idx} className="leading-relaxed">
                        <FormattedText text={paragraph} />
                    </p>
                )
            })}
        </div>
    );
}

// Helper to render bold text
function FormattedText({ text }: { text: string }) {
    if (!text) return null;

    // Split by double asterisks for bold
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
}
