import Link from 'next/link'
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import CreateReportDialog from '@/components/reports/CreateReportDialog'

export const dynamic = 'force-dynamic'

import { getSupabaseAdmin } from '@/lib/supabase-server'

async function getReports() {
    try {
        const supabase = getSupabaseAdmin()

        const { data: reports, error } = await supabase
            .from('generated_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error('Error fetching reports:', error)
            return []
        }

        return reports || []
    } catch (e) {
        console.error("Error fetching reports", e)
        return []
    }
}

export default async function ReportsPage() {
    const reports = await getReports()

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-success" />
            case 'generating': return <Clock className="h-4 w-4 animate-pulse text-info" />
            case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />
            default: return <Clock className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="surface-panel enter-fade-up flex items-center justify-between p-5 md:p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes Generados</h1>
                    <p className="text-muted-foreground">
                        Historial de análisis y benchmarks de mercado.
                    </p>
                </div>
                <CreateReportDialog />
            </div>

            <div className="enter-fade-up [animation-delay:80ms]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No hay reportes generados. Crea uno nuevo para comenzar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report: any) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {report.report_type === 'COMMUNE_MARKET' ? 'Mercado Comunal' : 'Benchmark'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(report.status)}
                                            <span className="capitalize">{report.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/reports/${report.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
