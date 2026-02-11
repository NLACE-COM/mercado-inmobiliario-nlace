import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/reports/communes
 * Fetch all distinct communes from the projects table efficienty
 */
export async function GET(request: NextRequest) {
    // Require authentication
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        const supabase = getSupabaseAdmin()

        // 1. Try to use RPC (Function) for efficiency
        const { data: rpcCommunes, error: rpcError } = await supabase.rpc('get_project_communes')

        if (!rpcError && rpcCommunes) {
            // Success with RPC
            const cleanCommunes = rpcCommunes
                .map((c: any) => c.commune?.toUpperCase().trim())
                .filter(Boolean)
                .sort()

            return NextResponse.json(Array.from(new Set(cleanCommunes)))
        }

        // 2. Fallback to raw query (less efficient but works without function)
        console.warn('RPC get_project_communes not found or failed, falling back to raw query:', rpcError?.message)

        // Limit to prevent timeouts if table is huge
        const { data: rawProjects, error: rawError } = await supabase
            .from('projects')
            .select('commune')
            .limit(5000) // Safety limit

        if (rawError) {
            console.error('Error fetching communes (fallback):', rawError)
            return NextResponse.json(
                { error: 'Failed to fetch communes' },
                { status: 500 }
            )
        }

        // Process in memory
        const uniqueCommunes = Array.from(new Set(
            rawProjects
                ?.map(p => p.commune?.toUpperCase().trim())
                .filter(Boolean)
        )).sort()

        return NextResponse.json(uniqueCommunes)

    } catch (error: any) {
        console.error('Error in GET /api/brain/reports/communes:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
