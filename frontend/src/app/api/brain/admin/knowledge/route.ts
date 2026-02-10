import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { ingestText } from '@/lib/vector-store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/admin/knowledge
 * Fetch all knowledge base items
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin()

        const { data: items, error } = await supabase
            .from('knowledge_docs')
            .select('id, content, metadata')
            .limit(100)

        if (error) {
            console.error('Error fetching knowledge:', error)
            return NextResponse.json([])
        }

        return NextResponse.json(items || [])
    } catch (error) {
        console.error('Error in GET /api/brain/admin/knowledge:', error)
        return NextResponse.json([])
    }
}

/**
 * POST /api/brain/admin/knowledge
 * Add a new knowledge item
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, metadata = {} } = body

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        // Ingest into vector store
        await ingestText(content, metadata)

        return NextResponse.json({
            success: true,
            message: 'Knowledge item added successfully'
        })
    } catch (error) {
        console.error('Error in POST /api/brain/admin/knowledge:', error)
        return NextResponse.json(
            { error: 'Failed to add knowledge item' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/brain/admin/knowledge
 * Delete a knowledge item
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('knowledge_docs')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting knowledge:', error)
            return NextResponse.json(
                { error: 'Failed to delete knowledge item' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Knowledge item deleted successfully'
        })
    } catch (error) {
        console.error('Error in DELETE /api/brain/admin/knowledge:', error)
        return NextResponse.json(
            { error: 'Failed to delete knowledge item' },
            { status: 500 }
        )
    }
}
