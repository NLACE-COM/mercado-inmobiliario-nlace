import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/env
 * Debug endpoint - ULTRA SIMPLE
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    })
}
