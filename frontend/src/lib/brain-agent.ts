import { ChatOpenAI } from 'openai'
import { getSupabaseAdmin } from './supabase-server'

/**
 * Simple AI agent without LangChain - uses OpenAI directly
 */

interface Tool {
    name: string
    description: string
    parameters: any
    execute: (params: any) => Promise<string>
}

// Tool: Search projects
const searchProjectsTool: Tool = {
    name: 'search_projects',
    description: 'Search real estate projects by location, price range, bedrooms, etc.',
    parameters: {
        type: 'object',
        properties: {
            comuna: { type: 'string', description: 'Comuna/city to filter by' },
            min_price: { type: 'number', description: 'Minimum price in UF' },
            max_price: { type: 'number', description: 'Maximum price in UF' },
            bedrooms: { type: 'number', description: 'Number of bedrooms' },
            limit: { type: 'number', description: 'Maximum number of results', default: 10 }
        }
    },
    execute: async ({ comuna, min_price, max_price, bedrooms, limit = 10 }) => {
        try {
            const supabase = getSupabaseAdmin()
            let query = supabase
                .from('projects')
                .select('name, comuna, price_uf, bedrooms, bathrooms, total_area, developer')
                .limit(limit)

            if (comuna) query = query.ilike('comuna', `%${comuna}%`)
            if (min_price) query = query.gte('price_uf', min_price)
            if (max_price) query = query.lte('price_uf', max_price)
            if (bedrooms) query = query.eq('bedrooms', bedrooms)

            const { data, error } = await query

            if (error || !data || data.length === 0) {
                return 'No projects found matching the criteria.'
            }

            return JSON.stringify(data, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
}

// Tool: Get statistics
const getStatsTool: Tool = {
    name: 'get_market_stats',
    description: 'Get market statistics like average prices, total projects, etc.',
    parameters: {
        type: 'object',
        properties: {
            comuna: { type: 'string', description: 'Filter stats by comuna' }
        }
    },
    execute: async ({ comuna }) => {
        try {
            const supabase = getSupabaseAdmin()
            let query = supabase.from('projects').select('price_uf, total_area, comuna')

            if (comuna) query = query.ilike('comuna', `%${comuna}%`)

            const { data, error } = await query

            if (error || !data) return 'Unable to fetch statistics'

            const prices = data.map(p => p.price_uf).filter(Boolean)
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

            return JSON.stringify({
                total_projects: data.length,
                average_price_uf: Math.round(avgPrice),
                min_price_uf: Math.min(...prices),
                max_price_uf: Math.max(...prices),
                comunas: [...new Set(data.map(p => p.comuna))]
            }, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
}

// Tool: Get project details
const getProjectDetailsTool: Tool = {
    name: 'get_project_details',
    description: 'Get detailed information about a specific project by name',
    parameters: {
        type: 'object',
        properties: {
            project_name: { type: 'string', description: 'Name of the project to search for' }
        },
        required: ['project_name']
    },
    execute: async ({ project_name }) => {
        try {
            const supabase = getSupabaseAdmin()
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .ilike('name', `%${project_name}%`)
                .limit(1)
                .single()

            if (error || !data) return `Project "${project_name}" not found`

            return JSON.stringify(data, null, 2)
        } catch (error) {
            return `Error: ${error}`
        }
    }
}

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

        if (data?.content) return data.content
    } catch (error) {
        console.error('Error fetching system prompt:', error)
    }

    return `Eres un analista experto en el mercado inmobiliario chileno. 
Tienes acceso a herramientas para buscar proyectos, obtener estadísticas y detalles específicos.
Usa siempre datos concretos cuando respondas preguntas.`
}

/**
 * Query the AI brain with function calling
 */
export async function queryBrainWithRAG(question: string, conversationHistory: any[] = []) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY not configured')
        }

        const systemPrompt = await getSystemPrompt()

        // Prepare messages
        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: question }
        ]

        // Call OpenAI with function calling
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                functions: tools.map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                })),
                temperature: 0.7
            })
        })

        const data = await response.json()
        const message = data.choices[0].message

        // Check if function call is needed
        if (message.function_call) {
            const tool = tools.find(t => t.name === message.function_call.name)
            if (tool) {
                const params = JSON.parse(message.function_call.arguments)
                const result = await tool.execute(params)

                // Call again with function result
                const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            ...messages,
                            message,
                            { role: 'function', name: tool.name, content: result }
                        ],
                        temperature: 0.7
                    })
                })

                const secondData = await secondResponse.json()
                return {
                    answer: secondData.choices[0].message.content,
                    sources: []
                }
            }
        }

        return {
            answer: message.content,
            sources: []
        }
    } catch (error) {
        console.error('Error in queryBrainWithRAG:', error)
        throw error
    }
}
