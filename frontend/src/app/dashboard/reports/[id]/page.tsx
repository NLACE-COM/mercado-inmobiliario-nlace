import { notFound } from 'next/navigation'
import ReportView from '@/components/reports/ReportView'

export const dynamic = 'force-dynamic'

async function getReport(id: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const fetchUrl = (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost'))
            ? `${apiUrl}/brain/reports/${id}`
            : `/api/brain/reports/${id}`;

        const res = await fetch(fetchUrl, {
            cache: 'no-store'
        })
        if (res.status === 404) return null
        if (!res.ok) throw new Error('Failed to fetch report')
        return res.json()
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
