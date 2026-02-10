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
        console.log('[Knowledge GET] Starting...')
        const supabase = getSupabaseAdmin()
        console.log('[Knowledge GET] Supabase client created')

        const { data: items, error } = await supabase
            .from('knowledge_docs')
            .select('id, content, metadata, created_at')
            .limit(100)

        console.log('[Knowledge GET] Query result:', {
            itemsCount: items?.length,
            hasError: !!error,
            errorMessage: error?.message
        })

        if (error) {
            console.error('[Knowledge GET] Error fetching knowledge:', error)
            return NextResponse.json([])
        }

        console.log('[Knowledge GET] Returning items:', items?.length)
        return NextResponse.json(items || [])
    } catch (error: any) {
        console.error('[Knowledge GET] Exception:', error.message)
        return NextResponse.json([])
    }
}

/**
 * POST /api/brain/admin/knowledge
 * Add a new knowledge item (text or file)
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || ''

        // Handle multipart/form-data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const file = formData.get('file') as File
            const metadataStr = formData.get('metadata') as string

            if (!file) {
                return NextResponse.json(
                    { error: 'No file provided' },
                    { status: 400 }
                )
            }

            // Read file content
            const content = await file.text()
            const metadata = metadataStr ? JSON.parse(metadataStr) : {}

            // Add filename to metadata
            metadata.filename = file.name
            metadata.type = file.type
            metadata.size = file.size

            // Ingest into vector store
            await ingestText(content, metadata)

            return NextResponse.json({
                success: true,
                message: 'File uploaded successfully'
            })
        }

        // Handle JSON (text content)
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
    } catch (error: any) {
        console.error('Error in POST /api/brain/admin/knowledge:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to add knowledge item' },
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
    } catch (error: any) {
        console.error('Error in DELETE /api/brain/admin/knowledge:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete knowledge item' },
            { status: 500 }
        )
    }
}
