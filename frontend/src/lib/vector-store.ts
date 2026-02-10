import { getSupabaseAdmin } from './supabase-server'

/**
 * Simplified vector store without LangChain
 * Uses Supabase directly for knowledge base operations
 */

/**
 * Ingest text into the knowledge base
 */
export async function ingestText(content: string, metadata: Record<string, any> = {}) {
    try {
        const supabase = getSupabaseAdmin()

        // For now, just store the text directly
        // In the future, you can add OpenAI embeddings here
        const { error } = await supabase
            .from('knowledge_docs')
            .insert({
                content,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString()
                }
            })

        if (error) {
            throw new Error(`Failed to ingest text: ${error.message}`)
        }
    } catch (error) {
        console.error('Error ingesting text:', error)
        throw error
    }
}

/**
 * Search knowledge base (simple text search for now)
 */
export async function searchKnowledge(query: string, limit: number = 5) {
    try {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('knowledge_docs')
            .select('*')
            .textSearch('content', query)
            .limit(limit)

        if (error) {
            console.error('Error searching knowledge:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in searchKnowledge:', error)
        return []
    }
}
