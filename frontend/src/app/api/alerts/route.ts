import { NextRequest, NextResponse } from 'next/server'
import { generateMarketAlerts } from '@/lib/alerts'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        const alerts = await generateMarketAlerts()
        return NextResponse.json(alerts)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
