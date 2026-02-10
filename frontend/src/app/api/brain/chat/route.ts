import { NextRequest, NextResponse } from 'next/server'
import { queryBrainWithRAG } from '@/lib/brain-agent'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for AI responses

/**
 * POST /api/brain/chat
 * Chat with the AI brain
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { question, conversation_history = [] } = body

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            )
        }

        // Check for required environment variables
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        // Query the AI agent
        const result = await queryBrainWithRAG(question, conversation_history)

        return NextResponse.json({
            answer: result.answer,
            sources: result.sources || [],
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Error in POST /api/brain/chat:', error)

        return NextResponse.json(
            {
                error: 'Failed to process question',
                details: error.message
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/brain/chat
 * Health check for the brain service
 */
export async function GET() {
    try {
        const hasOpenAI = !!process.env.OPENAI_API_KEY
        const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

        return NextResponse.json({
            status: 'healthy',
            services: {
                openai: hasOpenAI ? 'configured' : 'missing',
                supabase: hasSupabase ? 'configured' : 'missing'
            },
            ready: hasOpenAI && hasSupabase
        })
    } catch (error) {
        return NextResponse.json(
            { status: 'unhealthy', error: String(error) },
            { status: 500 }
        )
    }
}
