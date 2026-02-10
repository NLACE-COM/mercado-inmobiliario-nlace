import { notFound } from 'next/navigation'
import ReportView from '@/components/reports/ReportView'

export const dynamic = 'force-dynamic'

import { getSupabaseAdmin } from '@/lib/supabase-server'

async function getReport(id: string) {
    try {
        const supabase = getSupabaseAdmin()

        const { data: report, error } = await supabase
            .from('generated_reports')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching report:', error)
            return null
        }

        return report
    } catch (e) {
        console.error(e)
        return null
    }
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const report = await getReport(id)

    if (!report) {
        notFound()
    }

    return <ReportView report={report} />
}
