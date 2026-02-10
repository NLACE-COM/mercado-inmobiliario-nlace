import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/admin/prompts
 * Fetch all system prompts
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin()

        // Check if table exists
        const { data: prompts, error } = await supabase
            .from('system_prompts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching prompts:', error)

            // If table doesn't exist, return default prompt from file
            const defaultPromptPath = path.join(process.cwd(), 'src', 'lib', 'default-prompt.txt')

            if (fs.existsSync(defaultPromptPath)) {
                const defaultContent = fs.readFileSync(defaultPromptPath, 'utf-8')
                return NextResponse.json([
                    {
                        id: 'default',
                        content: defaultContent,
                        is_active: true,
                        label: 'Default System Prompt',
                        created_at: new Date().toISOString()
                    }
                ])
            }

            return NextResponse.json([])
        }

        return NextResponse.json(prompts || [])
    } catch (error) {
        console.error('Error in GET /api/brain/admin/prompts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch prompts' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/brain/admin/prompts
 * Create a new system prompt
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, label } = body

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

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
                label: label || 'Custom Prompt',
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating prompt:', error)
            return NextResponse.json(
                { error: 'Failed to create prompt' },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in POST /api/brain/admin/prompts:', error)
        return NextResponse.json(
            { error: 'Failed to create prompt' },
            { status: 500 }
        )
    }
}
