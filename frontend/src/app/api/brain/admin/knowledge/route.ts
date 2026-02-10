import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/brain/admin/knowledge
 * Fetch all knowledge base items - ULTRA SAFE VERSION
 */
export async function GET() {
    try {
        console.log('Knowledge route called')

        // Return empty array for now
        return NextResponse.json([])
    } catch (error: any) {
        console.error('Error in knowledge route:', error)
        return NextResponse.json([])
    }
}

/**
 * POST /api/brain/admin/knowledge
 * Add a new knowledge item
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Adding knowledge items is temporarily disabled' },
        { status: 503 }
    )
}

/**
 * DELETE /api/brain/admin/knowledge
 * Delete a knowledge item
 */
export async function DELETE() {
    return NextResponse.json(
        { error: 'Deleting knowledge items is temporarily disabled' },
        { status: 503 }
    )
}
