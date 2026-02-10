import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports/[id]
 * Fetch a single report by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = getSupabaseAdmin()

        const { data: report, error } = await supabase
            .from('generated_reports')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching report:', error)

            if (error.code === 'PGRST116') {
                // Not found
                return NextResponse.json(
                    { error: 'Report not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(
                { error: 'Failed to fetch report' },
                { status: 500 }
            )
        }

        return NextResponse.json(report)
    } catch (error: any) {
        console.error('Error in GET /api/brain/reports/[id]:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
