import { getSupabaseAdmin } from './supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Vector store with real embeddings
 * Uses OpenAI embeddings API and Supabase pgvector for semantic search
 */

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        })
        return response.data[0].embedding
    } catch (error: any) {
        console.error('Error generating embedding:', error)
        throw new Error(`Failed to generate embedding: ${error.message}`)
    }
}

/**
 * Ingest text into the knowledge base with real embeddings
 */
export async function ingestText(content: string, metadata: Record<string, any> = {}) {
    try {
        const supabase = getSupabaseAdmin()

        console.log('Ingesting text, length:', content.length)

        // Generate embedding using OpenAI
        console.log('Generating embedding...')
        const embedding = await generateEmbedding(content)
        console.log('Embedding generated, dimensions:', embedding.length)

        // Insert with real embedding
        const { data, error } = await supabase
            .from('knowledge_docs')
            .insert({
                content,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString()
                },
                embedding: embedding  // Store real vector
            })
            .select()

        if (error) {
            console.error('Supabase insert error:', error)
            throw new Error(`Failed to ingest text: ${error.message}`)
        }

        console.log('Successfully ingested with embedding, ID:', data?.[0]?.id)
        return data?.[0]
    } catch (error: any) {
        console.error('Error ingesting text:', error)
        throw error
    }
}

/**
 * Search knowledge base using vector similarity
 */
export async function searchKnowledge(query: string, limit: number = 5) {
    try {
        const supabase = getSupabaseAdmin()

        // Generate embedding for the query
        console.log('Generating query embedding...')
        const queryEmbedding = await generateEmbedding(query)

        // Use the match_documents RPC function for vector similarity search
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7,  // Minimum similarity threshold (0-1)
            match_count: limit
        })

        if (error) {
            console.error('Error in vector search:', error)
            // Fallback to text search if vector search fails
            console.log('Falling back to text search...')
            const { data: textData, error: textError } = await supabase
                .from('knowledge_docs')
                .select('*')
                .textSearch('content', query)
                .limit(limit)

            if (textError) {
                console.error('Error in fallback text search:', textError)
                return []
            }

            return textData || []
        }

        console.log(`Found ${data?.length || 0} relevant documents`)
        return data || []
    } catch (error) {
        console.error('Error in searchKnowledge:', error)
        return []
    }
}
