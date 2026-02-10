import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/admin/prompts
 * Fetch all system prompts - ULTRA SAFE VERSION
 */
export async function GET() {
    try {
        // Log environment variables
        console.log('ENV CHECK:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!(process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
            nodeEnv: process.env.NODE_ENV
        })

        // Return default prompt without trying to connect to database
        return NextResponse.json([
            {
                id: 'default',
                content: 'Eres un analista experto en el mercado inmobiliario chileno. Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos. Usa siempre datos concretos cuando respondas preguntas.',
                is_active: true,
                label: 'Default System Prompt',
                created_at: new Date().toISOString()
            }
        ])
    } catch (error: any) {
        console.error('Error in prompts route:', error)

        // Still return default prompt even if logging fails
        return NextResponse.json([
            {
                id: 'default',
                content: 'Eres un analista experto en el mercado inmobiliario chileno.',
                is_active: true,
                label: 'Default System Prompt',
                created_at: new Date().toISOString()
            }
        ])
    }
}

/**
 * POST /api/brain/admin/prompts
 * Create a new system prompt
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Creating custom prompts is temporarily disabled' },
        { status: 503 }
    )
}
