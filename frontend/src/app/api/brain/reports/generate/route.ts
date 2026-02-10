import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/brain/reports/generate
 * Generate a new report
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, report_type, parameters } = body

        if (!title || !report_type || !parameters) {
            return NextResponse.json(
                { error: 'Missing required fields: title, report_type, parameters' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Create the report with status 'generating'
        const { data: report, error } = await supabase
            .from('generated_reports')
            .insert({
                title,
                report_type,
                parameters,
                status: 'generating',
                content: null
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating report:', error)
            return NextResponse.json(
                { error: 'Failed to create report' },
                { status: 500 }
            )
        }

        // TODO: Trigger background job to actually generate the report
        // For now, we'll just mark it as completed immediately
        // In the future, you can use Vercel Cron Jobs or a queue system

        return NextResponse.json(report)
    } catch (error: any) {
        console.error('Error in POST /api/brain/reports/generate:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
