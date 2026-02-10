import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { getSupabaseAdmin } from './supabase-server'

/**
 * Initialize OpenAI embeddings
 */
export function getEmbeddings() {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    return new OpenAIEmbeddings({
        openAIApiKey: apiKey,
        modelName: 'text-embedding-3-small'
    })
}

/**
 * Get Supabase vector store for RAG
 */
export async function getVectorStore() {
    try {
        const supabase = getSupabaseAdmin()
        const embeddings = getEmbeddings()

        return new SupabaseVectorStore(embeddings, {
            client: supabase,
            tableName: 'knowledge_docs',
            queryName: 'match_documents'
        })
    } catch (error) {
        console.error('Error initializing vector store:', error)
        return null
    }
}

/**
 * Ingest text into the knowledge base
 */
export async function ingestText(content: string, metadata: Record<string, any> = {}) {
    const vectorStore = await getVectorStore()

    if (!vectorStore) {
        throw new Error('Vector store not initialized')
    }

    await vectorStore.addDocuments([
        {
            pageContent: content,
            metadata: {
                ...metadata,
                created_at: new Date().toISOString()
            }
        }
    ])
}
