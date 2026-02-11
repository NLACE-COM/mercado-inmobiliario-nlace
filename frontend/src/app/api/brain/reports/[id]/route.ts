import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports/[id]
 * Fetch a single report by ID (only if owned by the authenticated user)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Require authentication
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        const { id } = await params
        const supabase = getSupabaseAdmin()

        const { data: report, error } = await supabase
            .from('generated_reports')
            .select('*')
            .eq('id', id)
            .eq('user_id', auth.user.id) // Ensure user owns this report
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
