import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports
 * Fetch all generated reports for the authenticated user
 */
export async function GET(request: NextRequest) {
    // Require authentication
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        console.log('[Reports GET] Starting for user:', auth.user.id)
        const supabase = getSupabaseAdmin()

        const { data: reports, error } = await supabase
            .from('generated_reports')
            .select('*')
            .eq('user_id', auth.user.id) // Filter by user_id
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
