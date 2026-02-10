import { getSupabaseAdmin } from './supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Agent with Tools calling capabilities using OpenAI SDK
 */

// --- Tool Definitions ---

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "get_market_stats",
            description: "Get market statistics for a specific comuna or general market overview. Returns average prices, stock, and sales speed.",
            parameters: {
                type: "object",
                properties: {
                    comuna: {
                        type: "string",
                        description: "The name of the comuna (municipality) to filter by (e.g., 'Santiago', 'Ñuñoa', 'Las Condes'). If omitted, returns general stats."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_projects",
            description: "Search for specific real estate projects matching criteria.",
            parameters: {
                type: "object",
                properties: {
                    comuna: { type: "string" },
                    min_price_uf: { type: "number" },
                    max_price_uf: { type: "number" },
                    limit: { type: "number", default: 5 }
                }
            }
        }
    }
];

// --- Tool Implementations ---

async function getMarketStats(comuna?: string) {
    console.log(`[AI Agent] Fetching stats for comuna: ${comuna || 'Global'}`);
    try {
        const supabase = getSupabaseAdmin();

        let query = supabase.from('projects').select('avg_price_uf, available_units, sales_speed_monthly, project_status, commune');

        if (comuna) {
            // Trim and use ilike for better matching
            query = query.ilike('commune', `%${comuna.trim()}%`);
        } else {
            query = query.limit(1000); // Limit global query for performance
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) return "No data found for the specified criteria.";

        // Calculate aggregates in memory (for now, ideal would be DB RPC)
        const totalProjects = data.length;
        // Filter out nulls for calculations
        const validPrices = data.filter(p => p.avg_price_uf).map(p => p.avg_price_uf);
        const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;

        const totalStock = data.reduce((acc, curr) => acc + (curr.available_units || 0), 0);

        const validSpeeds = data.filter(p => p.sales_speed_monthly).map(p => p.sales_speed_monthly);
        const avgSpeed = validSpeeds.length > 0 ? validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length : 0;

        // Group by status
        const statusCount: Record<string, number> = {};
        data.forEach(p => {
            const s = p.project_status || 'Unknown';
            statusCount[s] = (statusCount[s] || 0) + 1;
        });

        // Get unique communes found
        const foundCommunes = Array.from(new Set(data.map(p => p.commune).filter(Boolean)));

        return JSON.stringify({
            location: comuna || "All Market (Sample)",
            found_communes: foundCommunes.slice(0, 5), // List top 5 found
            total_projects: totalProjects,
            average_price_uf: Math.round(avgPrice),
            total_stock_units: totalStock,
            avg_sales_speed: avgSpeed.toFixed(1),
            status_distribution: statusCount
        }, null, 2);

    } catch (e: any) {
        return `Error fetching stats: ${e.message}`;
    }
}

async function searchProjects({ comuna, min_price_uf, max_price_uf, limit = 5 }: any) {
    try {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('projects').select('id, name, developer, commune, avg_price_uf, project_status, available_units').limit(limit);

        if (comuna) query = query.ilike('commune', `%${comuna.trim()}%`);
        if (min_price_uf) query = query.gte('avg_price_uf', min_price_uf);
        if (max_price_uf) query = query.lte('avg_price_uf', max_price_uf);

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) return "No projects found.";

        return JSON.stringify(data, null, 2);
    } catch (e: any) {
        return `Error searching projects: ${e.message}`;
    }
}

// --- Main Agent Function ---

export async function queryBrainWithRAG(question: string, conversationHistory: any[] = []) {
    try {
        // 1. Prepare messages
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `Eres el "Analista IA" de NLACE, un experto en el mercado inmobiliario chileno.
                Tu objetivo es ayudar a desarrolladores e inversores con datos precisos.
                
                TIENES ACCESO A DATOS EN TIEMPO REAL DE LA BASE DE DATOS 'projects'.
                - Si te preguntan por precios, stock, o tendencias, DEBES usar la herramienta 'get_market_stats'.
                - Si te preguntan por proyectos específicos, usa 'search_projects'.
                - Si te preguntan algo general (ej. "¿Cómo está el mercado?"), usa 'get_market_stats' sin parámetros.
                
                IMPORTANTE:
                - Responde siempre en español.
                - Usa formato Markdown (negritas, listas) para que se vea bien en el chat.
                - Sé conciso y profesional.
                - Si la herramienta devuelve datos, úsalos explícitamente en tu respuesta (cita números exactos).
                - NO inventes datos. Si la herramienta no devuelve nada, dilo.`
            },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content
            })),
            { role: "user", content: question }
        ];

        // 2. First Call to OpenAI (Check if tool is needed)
        const runner = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
            temperature: 0.7,
        });

        const message = runner.choices[0].message;

        // 3. Handle Tool Calls
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log("[AI Agent] Tool calls detected:", message.tool_calls.length);

            // Append assistant's "thought" (tool call request)
            messages.push(message);

            // Execute each tool
            for (const toolCall of message.tool_calls) {
                const fnName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = "";

                console.log(`[AI Agent] Executing ${fnName} with args:`, args);

                if (fnName === "get_market_stats") {
                    result = await getMarketStats(args.comuna);
                } else if (fnName === "search_projects") {
                    result = await searchProjects(args);
                } else {
                    result = "Error: Tool not found";
                }

                console.log(`[AI Agent] Tool result preview:`, result.slice(0, 100));

                // Append tool result
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: result
                });
            }

            // 4. Second Call to OpenAI (Generate final answer with data)
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
            });

            return {
                answer: finalResponse.choices[0].message.content || "Lo siento, no pude generar una respuesta final con los datos.",
                sources: [] // We could populate this if we had RAG docs
            };
        }

        // No tool called, just return text
        return {
            answer: message.content || "No tengo una respuesta para eso.",
            sources: []
        };

    } catch (error: any) {
        console.error("[AI Agent] Error:", error);
        return {
            answer: "Lo siento, tuve un problema interno al procesar tu solicitud. Por favor intenta de nuevo.",
            sources: []
        };
    }
}
