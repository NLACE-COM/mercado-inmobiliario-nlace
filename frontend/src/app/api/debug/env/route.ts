import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/env
 * Debug endpoint to check environment variables
 */
export async function GET() {
    return NextResponse.json({
        env: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_KEY: !!process.env.SUPABASE_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV
        },
        urls: {
            supabase_url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'missing'
        }
    })
}
