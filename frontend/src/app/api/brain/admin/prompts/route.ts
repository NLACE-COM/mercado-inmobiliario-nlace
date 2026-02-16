import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

function parseVersion(label?: string | null): number | null {
    if (!label) return null
    const match = label.trim().match(/^v(\d+)$/i)
    if (!match) return null
    const value = Number(match[1])
    return Number.isFinite(value) ? value : null
}

/**
 * GET /api/brain/admin/prompts
 * Fetch all system prompts (admin only)
 */
export async function GET(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const supabase = getSupabaseAdmin()

        // Try to fetch prompts from database
        const { data: prompts, error } = await supabase
            .from('system_prompts')
            .select('*')
            .order('created_at', { ascending: false })

        // If table doesn't exist or query fails, return default prompt
        if (error) {
            console.error('Error fetching prompts (table may not exist):', error.message)

            // Return default prompt
            return NextResponse.json([
                {
                    id: 'default',
                    content: 'Eres un analista experto en el mercado inmobiliario chileno. Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos. Usa siempre datos concretos cuando respondas preguntas.',
                    is_active: true,
                    label: 'v1',
                    created_at: new Date().toISOString()
                }
            ])
        }

        // If no prompts exist, return default
        if (!prompts || prompts.length === 0) {
            return NextResponse.json([
                {
                    id: 'default',
                    content: 'Eres un analista experto en el mercado inmobiliario chileno. Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos. Usa siempre datos concretos cuando respondas preguntas.',
                    is_active: true,
                    label: 'v1',
                    created_at: new Date().toISOString()
                }
            ])
        }

        return NextResponse.json(prompts)
    } catch (error: any) {
        console.error('Error in GET /api/brain/admin/prompts:', error.message)

        // Return default prompt instead of error
        return NextResponse.json([
            {
                id: 'default',
                content: 'Eres un analista experto en el mercado inmobiliario chileno. Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos. Usa siempre datos concretos cuando respondas preguntas.',
                is_active: true,
                label: 'v1',
                created_at: new Date().toISOString()
            }
        ])
    }
}

/**
 * POST /api/brain/admin/prompts
 * Create a new system prompt (admin only)
 */
export async function POST(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const body = await request.json()
        const { content } = body

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Calculate next version label automatically.
        const { data: existingPrompts, error: versionReadError } = await supabase
            .from('system_prompts')
            .select('label, created_at')
            .order('created_at', { ascending: true })

        if (versionReadError) {
            console.error('Error reading prompts for versioning:', versionReadError)
            return NextResponse.json(
                { error: 'Failed to calculate prompt version.' },
                { status: 500 }
            )
        }

        const versions = (existingPrompts || [])
            .map((prompt: any) => parseVersion(prompt.label))
            .filter((value: number | null): value is number => value !== null)
        const nextVersion = versions.length > 0 ? Math.max(...versions) + 1 : (existingPrompts?.length || 0) + 1

        // Deactivate all existing prompts
        await supabase
            .from('system_prompts')
            .update({ is_active: false })
            .eq('is_active', true)

        // Insert new prompt as active
        const { data, error } = await supabase
            .from('system_prompts')
            .insert({
                content,
                label: `v${nextVersion}`,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating prompt:', error)
            return NextResponse.json(
                { error: 'Failed to create prompt. Make sure the system_prompts table exists.' },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error in POST /api/brain/admin/prompts:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create prompt' },
            { status: 500 }
        )
    }
}
