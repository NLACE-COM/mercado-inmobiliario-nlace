import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports/communes
 * Fetch all distinct communes from the propertiest/projects table
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin()

        // Get distinct communes from projects table
        // This ensures we only show communes that actually have data
        const { data: communes, error } = await supabase
            .from('projects')
            .select('commune')
            .order('commune')

        if (error) {
            console.error('Error fetching communes:', error)
            return NextResponse.json(
                { error: 'Failed to fetch communes' },
                { status: 500 }
            )
        }

        // Extract unique communes and format
        const uniqueCommunes = Array.from(new Set(communes?.map(c => c.commune)))
            .filter(Boolean)
            .sort()

        return NextResponse.json(uniqueCommunes)
    } catch (error: any) {
        console.error('Error in GET /api/brain/reports/communes:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
