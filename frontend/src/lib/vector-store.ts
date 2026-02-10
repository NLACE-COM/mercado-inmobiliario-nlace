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

        console.log('Ingesting text, length:', content.length)

        // Insert without embedding for now
        const { data, error } = await supabase
            .from('knowledge_docs')
            .insert({
                content,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString()
                },
                embedding: null  // Explicitly set to null
            })
            .select()

        if (error) {
            console.error('Supabase insert error:', error)
            throw new Error(`Failed to ingest text: ${error.message}`)
        }

        console.log('Successfully ingested, ID:', data?.[0]?.id)
        return data?.[0]
    } catch (error: any) {
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
