import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { getVectorStore } from './vector-store'
import { getSupabaseAdmin } from './supabase-server'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * Tool: Search projects by filters
 */
const searchProjectsTool = new DynamicStructuredTool({
    name: 'search_projects',
    description: 'Search real estate projects by location, price range, bedrooms, etc.',
    schema: z.object({
        comuna: z.string().optional().describe('Comuna/city to filter by'),
        min_price: z.number().optional().describe('Minimum price in UF'),
        max_price: z.number().optional().describe('Maximum price in UF'),
        bedrooms: z.number().optional().describe('Number of bedrooms'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    func: async ({ comuna, min_price, max_price, bedrooms, limit = 10 }) => {
        try {
            const supabase = getSupabaseAdmin()
            let query = supabase
                .from('projects')
                .select('name, comuna, price_uf, bedrooms, bathrooms, total_area, developer')
                .limit(limit)

            if (comuna) {
                query = query.ilike('comuna', `%${comuna}%`)
            }
            if (min_price) {
                query = query.gte('price_uf', min_price)
            }
            if (max_price) {
                query = query.lte('price_uf', max_price)
            }
            if (bedrooms) {
                query = query.eq('bedrooms', bedrooms)
            }

            const { data, error } = await query

            if (error) {
                return `Error searching projects: ${error.message}`
            }

            if (!data || data.length === 0) {
                return 'No projects found matching the criteria.'
            }

            return JSON.stringify(data, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
})

/**
 * Tool: Get project statistics
 */
const getStatsTool = new DynamicStructuredTool({
    name: 'get_market_stats',
    description: 'Get market statistics like average prices, total projects, etc.',
    schema: z.object({
        comuna: z.string().optional().describe('Filter stats by comuna')
    }),
    func: async ({ comuna }) => {
        try {
            const supabase = getSupabaseAdmin()
            let query = supabase
                .from('projects')
                .select('price_uf, total_area, comuna')

            if (comuna) {
                query = query.ilike('comuna', `%${comuna}%`)
            }

            const { data, error } = await query

            if (error || !data) {
                return 'Unable to fetch statistics'
            }

            const prices = data.map(p => p.price_uf).filter(Boolean)
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            return JSON.stringify({
                total_projects: data.length,
                average_price_uf: Math.round(avgPrice),
                min_price_uf: minPrice,
                max_price_uf: maxPrice,
                comunas: [...new Set(data.map(p => p.comuna))]
            }, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
})

/**
 * Tool: Get specific project details
 */
const getProjectDetailsTool = new DynamicStructuredTool({
    name: 'get_project_details',
    description: 'Get detailed information about a specific project by name',
    schema: z.object({
        project_name: z.string().describe('Name of the project to search for')
    }),
    func: async ({ project_name }) => {
        try {
            const supabase = getSupabaseAdmin()
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .ilike('name', `%${project_name}%`)
                .limit(1)
                .single()

            if (error || !data) {
                return `Project "${project_name}" not found`
            }

            return JSON.stringify(data, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
})

const tools = [searchProjectsTool, getStatsTool, getProjectDetailsTool]

/**
 * Get the active system prompt
 */
async function getSystemPrompt(): Promise<string> {
    try {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
            .from('system_prompts')
            .select('content')
            .eq('is_active', true)
            .single()

        if (data?.content) {
            return data.content
        }
    } catch (error) {
        console.error('Error fetching system prompt:', error)
    }

    // Fallback to default
    return `Eres un analista experto en el mercado inmobiliario chileno. 
Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos.
Usa siempre datos concretos cuando respondas preguntas.`
}

/**
 * Create and execute the AI agent
 */
export async function queryBrainWithRAG(question: string, conversationHistory: any[] = []) {
    try {
        // Initialize LLM
        const llm = new ChatOpenAI({
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        })

        // Get system prompt
        const systemPrompt = await getSystemPrompt()

        // Create prompt template
        const prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt],
            new MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
            new MessagesPlaceholder('agent_scratchpad')
        ])

        // Create agent
        const agent = await createOpenAIFunctionsAgent({
            llm,
            tools,
            prompt
        })

        // Create executor
        const executor = new AgentExecutor({
            agent,
            tools,
            verbose: true,
            maxIterations: 3
        })

        // Execute
        const result = await executor.invoke({
            input: question,
            chat_history: conversationHistory
        })

        return {
            answer: result.output,
            sources: []
        }
    } catch (error) {
        console.error('Error in queryBrainWithRAG:', error)
        throw error
    }
}
