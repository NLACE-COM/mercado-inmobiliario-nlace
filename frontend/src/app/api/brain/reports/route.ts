import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports
 * Fetch all generated reports
 */
export async function GET() {
    try {
        console.log('[Reports GET] Starting...')
        const supabase = getSupabaseAdmin()

        const { data: reports, error } = await supabase
            .from('generated_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        console.log('[Reports GET] Query result:', {
            reportsCount: reports?.length,
            hasError: !!error,
            errorMessage: error?.message,
            errorCode: error?.code
        })

        if (error) {
            console.error('[Reports GET] Error fetching reports:', error)
            return NextResponse.json(
                { error: 'Failed to fetch reports' },
                { status: 500 }
            )
        }

        console.log('[Reports GET] Returning reports:', reports?.length)
        return NextResponse.json(reports || [])
    } catch (error: any) {
        console.error('Error in GET /api/brain/reports:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
