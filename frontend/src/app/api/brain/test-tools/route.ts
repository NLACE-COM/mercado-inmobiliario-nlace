import { NextResponse } from 'next/server'
import { tools } from '@/lib/brain-agent'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/test-tools
 * Test endpoint to verify tools are loaded
 */
export async function GET() {
    try {
        const toolNames = tools.map((t: any) => t.function.name)

        return NextResponse.json({
            success: true,
            toolCount: tools.length,
            tools: toolNames,
            hasNewTools: {
                compare_communes_detailed: toolNames.includes('compare_communes_detailed'),
                get_historical_trends: toolNames.includes('get_historical_trends'),
                get_typology_analysis: toolNames.includes('get_typology_analysis')
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
