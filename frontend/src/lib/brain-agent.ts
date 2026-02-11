import { getSupabaseAdmin } from './supabase-server'
import { searchKnowledge } from './vector-store'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Agent with Tools calling capabilities using OpenAI SDK
 */

// --- Tool Definitions ---

export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
    },
    {
        type: "function",
        function: {
            name: "compare_regions",
            description: "Compare market statistics across multiple regions/comunas. Returns side-by-side comparison of prices, stock, and sales metrics.",
            parameters: {
                type: "object",
                properties: {
                    regions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of region/comuna names to compare (e.g., ['RM', 'V', 'VIII'] or ['Santiago', 'Ñuñoa', 'Las Condes'])"
                    }
                },
                required: ["regions"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_top_sales",
            description: "Get the top 10 projects with the highest sales speed. Returns projects ranked by monthly sales velocity.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_market_summary",
            description: "Get a comprehensive market summary with global totals and regional breakdown. Returns executive summary of the entire market.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "compare_communes_detailed",
            description: "Compare detailed market statistics across multiple communes side-by-side. Returns comparative metrics for pricing, stock, and sales performance.",
            parameters: {
                type: "object",
                properties: {
                    communes: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of commune names to compare (e.g., ['Santiago', 'Ñuñoa', 'Las Condes']). Minimum 2, maximum 5 communes."
                    }
                },
                required: ["communes"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_historical_trends",
            description: "Get historical market trends for a specific commune over the last 6 months. Returns time series data showing evolution of prices, stock, and sales speed.",
            parameters: {
                type: "object",
                properties: {
                    commune: {
                        type: "string",
                        description: "The name of the commune to analyze historical trends for"
                    },
                    months: {
                        type: "number",
                        description: "Number of months to look back (default: 6, max: 12)"
                    }
                },
                required: ["commune"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_typology_analysis",
            description: "Analyze market by unit typology (1D, 2D, 3D, etc.) for a specific commune. Returns breakdown of stock, pricing, and sales speed by number of bedrooms.",
            parameters: {
                type: "object",
                properties: {
                    commune: {
                        type: "string",
                        description: "The name of the commune to analyze typologies for"
                    }
                },
                required: ["commune"]
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

async function compareRegions({ regions }: { regions: string[] }) {
    console.log(`[AI Agent] Comparing regions:`, regions);
    try {
        const supabase = getSupabaseAdmin();
        const comparison: any[] = [];

        for (const region of regions) {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, total_units, sold_units, available_units, avg_price_uf, sales_speed_monthly')
                .ilike('commune', `%${region.trim()}%`)
                .limit(500);

            if (error) throw error;

            if (data && data.length > 0) {
                const totalProjects = data.length;
                const totalUnits = data.reduce((sum, p) => sum + (p.total_units || 0), 0);
                const totalSold = data.reduce((sum, p) => sum + (p.sold_units || 0), 0);
                const totalAvailable = data.reduce((sum, p) => sum + (p.available_units || 0), 0);

                const validPrices = data.filter(p => p.avg_price_uf).map(p => p.avg_price_uf);
                const avgPrice = validPrices.length > 0
                    ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
                    : 0;

                const sellThrough = totalUnits > 0 ? ((totalSold / totalUnits) * 100).toFixed(1) : '0.0';

                comparison.push({
                    region,
                    total_projects: totalProjects,
                    total_units: totalUnits,
                    total_sold: totalSold,
                    total_available: totalAvailable,
                    avg_price_uf: avgPrice,
                    sell_through_pct: sellThrough
                });
            } else {
                comparison.push({
                    region,
                    error: 'No data found for this region'
                });
            }
        }

        return JSON.stringify(comparison, null, 2);
    } catch (e: any) {
        return `Error comparing regions: ${e.message}`;
    }
}

async function getTopSales() {
    console.log(`[AI Agent] Fetching top sales projects`);
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('projects')
            .select('id, name, developer, commune, available_units, total_units, sold_units, sales_speed_monthly, avg_price_uf')
            .not('sales_speed_monthly', 'is', null)
            .order('sales_speed_monthly', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) return "No projects with sales data found.";

        const topProjects = data.map(p => {
            const sellThrough = p.total_units > 0
                ? ((p.sold_units || 0) / p.total_units * 100).toFixed(1)
                : '0.0';

            return {
                name: p.name,
                developer: p.developer,
                commune: p.commune,
                sales_speed_monthly: p.sales_speed_monthly,
                available_units: p.available_units,
                sell_through_pct: sellThrough,
                avg_price_uf: p.avg_price_uf
            };
        });

        return JSON.stringify(topProjects, null, 2);
    } catch (e: any) {
        return `Error fetching top sales: ${e.message}`;
    }
}

async function getMarketSummary() {
    console.log(`[AI Agent] Generating market summary`);
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('projects')
            .select('commune, total_units, sold_units, available_units, avg_price_uf')
            .limit(5000);

        if (error) throw error;
        if (!data || data.length === 0) return "No market data available.";

        // Global totals
        const totalProjects = data.length;
        const totalUnits = data.reduce((sum, p) => sum + (p.total_units || 0), 0);
        const totalSold = data.reduce((sum, p) => sum + (p.sold_units || 0), 0);
        const totalAvailable = data.reduce((sum, p) => sum + (p.available_units || 0), 0);

        const validPrices = data.filter(p => p.avg_price_uf).map(p => p.avg_price_uf);
        const avgPrice = validPrices.length > 0
            ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
            : 0;

        // Group by region
        const regionStats: Record<string, any> = {};
        data.forEach(p => {
            const region = p.commune || 'Unknown';
            if (!regionStats[region]) {
                regionStats[region] = {
                    projects: 0,
                    total_units: 0,
                    sold_units: 0,
                    available_units: 0
                };
            }
            regionStats[region].projects += 1;
            regionStats[region].total_units += p.total_units || 0;
            regionStats[region].sold_units += p.sold_units || 0;
            regionStats[region].available_units += p.available_units || 0;
        });

        // Top 5 regions by project count
        const topRegions = Object.entries(regionStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.projects - a.projects)
            .slice(0, 5);

        return JSON.stringify({
            global: {
                total_projects: totalProjects,
                total_units: totalUnits,
                total_sold: totalSold,
                total_available: totalAvailable,
                avg_price_uf: avgPrice,
                sell_through_pct: totalUnits > 0 ? ((totalSold / totalUnits) * 100).toFixed(1) : '0.0'
            },
            top_5_regions: topRegions
        }, null, 2);
    } catch (e: any) {
        return `Error generating market summary: ${e.message}`;
    }
}

export async function compareCommunes({ communes }: { communes: string[] }) {
    console.log(`[AI Agent] Comparing communes:`, communes);
    try {
        const supabase = getSupabaseAdmin();
        const comparison: any[] = [];

        for (const commune of communes) {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, total_units, sold_units, available_units, avg_price_uf, avg_price_m2_uf, sales_speed_monthly')
                .ilike('commune', `%${commune.trim()}%`)
                .limit(500);

            if (error) throw error;

            if (data && data.length > 0) {
                const totalProjects = data.length;
                const totalUnits = data.reduce((sum, p) => sum + (p.total_units || 0), 0);
                const totalSold = data.reduce((sum, p) => sum + (p.sold_units || 0), 0);
                const totalAvailable = data.reduce((sum, p) => sum + (p.available_units || 0), 0);

                const validPrices = data.filter(p => p.avg_price_uf).map(p => p.avg_price_uf);
                const avgPrice = validPrices.length > 0
                    ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
                    : 0;

                const validPricesM2 = data.filter(p => p.avg_price_m2_uf).map(p => p.avg_price_m2_uf);
                const avgPriceM2 = validPricesM2.length > 0
                    ? Math.round(validPricesM2.reduce((a, b) => a + b, 0) / validPricesM2.length)
                    : 0;

                const validSpeeds = data.filter(p => p.sales_speed_monthly).map(p => p.sales_speed_monthly);
                const avgSalesSpeed = validSpeeds.length > 0
                    ? (validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length).toFixed(1)
                    : '0.0';

                const sellThrough = totalUnits > 0 ? ((totalSold / totalUnits) * 100).toFixed(1) : '0.0';
                const mao = parseFloat(avgSalesSpeed) > 0 ? (totalAvailable / parseFloat(avgSalesSpeed)).toFixed(1) : '-';

                comparison.push({
                    commune,
                    total_projects: totalProjects,
                    total_units: totalUnits,
                    total_sold: totalSold,
                    total_available: totalAvailable,
                    avg_price_uf: avgPrice,
                    avg_price_m2_uf: avgPriceM2,
                    avg_sales_speed: avgSalesSpeed,
                    sell_through_pct: sellThrough,
                    mao: mao
                });
            } else {
                comparison.push({
                    commune,
                    error: 'No data found for this commune'
                });
            }
        }

        return JSON.stringify(comparison, null, 2);
    } catch (e: any) {
        return `Error comparing communes: ${e.message}`;
    }
}

export async function getHistoricalTrends({ commune, months = 6 }: { commune: string, months?: number }) {
    console.log(`[AI Agent] Fetching historical trends for ${commune}, last ${months} months`);
    try {
        const supabase = getSupabaseAdmin();

        // Limit months to max 12
        const limitMonths = Math.min(months, 12);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - limitMonths);

        // 1. Get project IDs for the commune - using wildcards and trimmed name
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id')
            .ilike('commune', `%${commune.trim()}%`);

        if (projectsError) throw projectsError;

        const projectIds = projects?.map(p => p.id) || [];

        if (projectIds.length === 0) {
            return JSON.stringify({
                message: "No projects found for this commune to fetch historical data.",
                commune
            });
        }

        // 2. Query history only for those projects
        const { data, error } = await supabase
            .from('project_metrics_history')
            .select('recorded_at, project_id, price_avg_uf, stock, sales_monthly')
            .in('project_id', projectIds)
            .gte('recorded_at', startDate.toISOString().split('T')[0])
            .lte('recorded_at', endDate.toISOString().split('T')[0])
            .order('recorded_at', { ascending: true });

        if (error) {
            console.error(`[AI Agent] Database error in getHistoricalTrends:`, error);
            throw error;
        }

        if (!data || data.length === 0) {
            return JSON.stringify({
                message: "No historical data available for this commune. Historical metrics may not have been backfilled yet.",
                commune,
                months_requested: limitMonths
            });
        }

        // Group by month and calculate averages
        const monthlyData: Record<string, any> = {};

        data.forEach(record => {
            const month = record.recorded_at.substring(0, 7); // YYYY-MM format

            if (!monthlyData[month]) {
                monthlyData[month] = {
                    prices: [],
                    stock: [],
                    speeds: []
                };
            }

            if (record.price_avg_uf) monthlyData[month].prices.push(record.price_avg_uf);
            if (record.stock) monthlyData[month].stock.push(record.stock);
            if (record.sales_monthly) monthlyData[month].speeds.push(record.sales_monthly);
        });

        // Calculate monthly averages
        const trends = Object.entries(monthlyData).map(([month, values]: [string, any]) => {
            const avgPrice = values.prices.length > 0
                ? Math.round(values.prices.reduce((a: number, b: number) => a + b, 0) / values.prices.length)
                : null;

            const totalStock = values.stock.length > 0
                ? values.stock.reduce((a: number, b: number) => a + b, 0)
                : null;

            const avgSpeed = values.speeds.length > 0
                ? (values.speeds.reduce((a: number, b: number) => a + b, 0) / values.speeds.length).toFixed(1)
                : null;

            return {
                month,
                avg_price_uf: avgPrice,
                total_stock: totalStock,
                avg_sales_speed: avgSpeed
            };
        }).sort((a, b) => a.month.localeCompare(b.month));

        // Calculate trend indicators
        let priceChange = null;
        let stockChange = null;

        if (trends.length >= 2) {
            const firstMonth = trends[0];
            const lastMonth = trends[trends.length - 1];

            if (firstMonth.avg_price_uf && lastMonth.avg_price_uf) {
                priceChange = (((lastMonth.avg_price_uf - firstMonth.avg_price_uf) / firstMonth.avg_price_uf) * 100).toFixed(1);
            }

            if (firstMonth.total_stock && lastMonth.total_stock) {
                stockChange = (((lastMonth.total_stock - firstMonth.total_stock) / firstMonth.total_stock) * 100).toFixed(1);
            }
        }

        return JSON.stringify({
            commune,
            period: `${trends[0]?.month} to ${trends[trends.length - 1]?.month}`,
            trends,
            indicators: {
                price_change_pct: priceChange,
                stock_change_pct: stockChange
            }
        }, null, 2);
    } catch (e: any) {
        return `Error fetching historical trends: ${e.message}`;
    }
}

export async function getTypologyAnalysis({ commune }: { commune: string }) {
    console.log(`[AI Agent] Analyzing typologies for ${commune}`);
    try {
        const supabase = getSupabaseAdmin();

        // Query projects with their typologies using a proper relational filter
        const { data, error } = await supabase
            .from('project_typologies')
            .select(`
                bedrooms,
                bathrooms,
                surface_total,
                current_price_uf,
                project_id,
                projects!inner (
                    commune,
                    available_units,
                    sales_speed_monthly
                )
            `)
            .ilike('projects.commune', `%${commune.trim()}%`); // ilike with wildcards is more robust

        if (error) {
            console.error(`[AI Agent] Database error in getTypologyAnalysis:`, error);
            throw error;
        }

        if (!data || data.length === 0) {
            return JSON.stringify({
                message: "No typology data available for this commune. Typologies may not have been backfilled yet.",
                commune
            });
        }

        // Group by bedrooms (typology)
        const typologyStats: Record<string, any> = {};

        data.forEach((record: any) => {
            const bedrooms = record.bedrooms || 0;
            const typologyKey = `${bedrooms}D`;

            if (!typologyStats[typologyKey]) {
                typologyStats[typologyKey] = {
                    count: 0,
                    total_stock: 0,
                    prices: [],
                    speeds: [],
                    surfaces: []
                };
            }

            typologyStats[typologyKey].count += 1;

            if (record.projects?.available_units) {
                typologyStats[typologyKey].total_stock += record.projects.available_units;
            }

            if (record.current_price_uf) {
                typologyStats[typologyKey].prices.push(record.current_price_uf);
            }

            if (record.projects?.sales_speed_monthly) {
                typologyStats[typologyKey].speeds.push(record.projects.sales_speed_monthly);
            }

            if (record.surface_total) {
                typologyStats[typologyKey].surfaces.push(record.surface_total);
            }
        });

        // Calculate averages and percentages
        const totalStock = Object.values(typologyStats).reduce((sum: number, t: any) => sum + t.total_stock, 0);

        const analysis = Object.entries(typologyStats).map(([typology, stats]: [string, any]) => {
            const avgPrice = stats.prices.length > 0
                ? Math.round(stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length)
                : null;

            const avgSpeed = stats.speeds.length > 0
                ? (stats.speeds.reduce((a: number, b: number) => a + b, 0) / stats.speeds.length).toFixed(1)
                : null;

            const avgSurface = stats.surfaces.length > 0
                ? Math.round(stats.surfaces.reduce((a: number, b: number) => a + b, 0) / stats.surfaces.length)
                : null;

            const percentage = totalStock > 0 ? ((stats.total_stock / totalStock) * 100).toFixed(1) : '0.0';

            return {
                typology,
                units_count: stats.count,
                stock: stats.total_stock,
                avg_price_uf: avgPrice,
                avg_surface_m2: avgSurface,
                avg_sales_speed: avgSpeed,
                percentage_of_total: percentage
            };
        }).sort((a, b) => b.stock - a.stock); // Sort by stock descending

        return JSON.stringify({
            commune,
            total_stock: totalStock,
            typologies: analysis
        }, null, 2);
    } catch (e: any) {
        return `Error analyzing typologies: ${e.message}`;
    }
}

// --- Main Agent Function ---


export async function queryBrainWithRAG(question: string, conversationHistory: any[] = []) {
    try {
        // 1. Search knowledge base for relevant context (RAG)
        console.log('[AI Agent] Searching knowledge base for context...')
        const relevantDocs = await searchKnowledge(question, 3)
        const sources: any[] = []

        let ragContext = ''
        if (relevantDocs && relevantDocs.length > 0) {
            console.log(`[AI Agent] Found ${relevantDocs.length} relevant documents`)
            ragContext = '\n\nCONTEXTO HISTÓRICO RELEVANTE:\n'
            relevantDocs.forEach((doc: any, idx: number) => {
                const topic = doc.metadata?.topic || doc.metadata?.filename || 'Documento'
                ragContext += `- ${doc.content.substring(0, 500)}... (Fuente: ${topic})\n`
                sources.push({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                })
            })
        } else {
            console.log('[AI Agent] No relevant documents found in knowledge base')
        }

        // 2. Prepare messages with RAG context
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `Eres el "Analista IA" de NLACE, un experto en el mercado inmobiliario chileno.
                Tu objetivo es ayudar a desarrolladores e inversores con datos precisos.
                
                TIENES ACCESO A DATOS EN TIEMPO REAL DE LA BASE DE DATOS 'projects'.
                
                HERRAMIENTAS DISPONIBLES:
                - 'get_market_stats': Estadísticas de una comuna específica o mercado general
                - 'search_projects': Buscar proyectos con filtros específicos
                - 'compare_regions': Comparar regiones amplias (RM, V, VIII)
                - 'compare_communes_detailed': Comparar múltiples comunas lado a lado (NUEVA - USA ESTA para comparaciones detalladas)
                - 'get_top_sales': Top 10 proyectos con mayor velocidad de venta
                - 'get_market_summary': Resumen ejecutivo del mercado completo
                - 'get_historical_trends': Tendencias históricas de una comuna (últimos 6 meses) (NUEVA)
                - 'get_typology_analysis': Análisis por tipología (1D, 2D, 3D) de una comuna (NUEVA)
                
                CUÁNDO USAR CADA HERRAMIENTA:
                - Si preguntan por comparar comunas: USA 'compare_communes_detailed'
                - Si preguntan por tendencias o evolución: USA 'get_historical_trends'
                - Si preguntan por tipologías o tipos de unidades: USA 'get_typology_analysis'
                - Si preguntan por precios/stock de una comuna: USA 'get_market_stats'
                ${ragContext}
                IMPORTANTE:
                - Responde siempre en español.
                - Usa formato Markdown (negritas, listas, títulos de nivel ## para secciones) para que se vea bien en el chat.
                - Sé conciso y profesional.
                - Si la herramienta devuelve datos, úsalos explícitamente en tu respuesta (cita números exactos).
                - Si tienes contexto histórico relevante arriba, úsalo para enriquecer tu respuesta.
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
                // TypeScript guard: ensure it's a function call
                if (toolCall.type !== 'function') continue;

                const fnName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = "";

                console.log(`[AI Agent] Executing ${fnName} with args:`, args);

                if (fnName === "get_market_stats") {
                    result = await getMarketStats(args.comuna);
                } else if (fnName === "search_projects") {
                    result = await searchProjects(args);
                } else if (fnName === "compare_regions") {
                    result = await compareRegions(args);
                } else if (fnName === "get_top_sales") {
                    result = await getTopSales();
                } else if (fnName === "get_market_summary") {
                    result = await getMarketSummary();
                } else if (fnName === "compare_communes_detailed") {
                    result = await compareCommunes(args);
                } else if (fnName === "get_historical_trends") {
                    result = await getHistoricalTrends(args);
                } else if (fnName === "get_typology_analysis") {
                    result = await getTypologyAnalysis(args);
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
                sources: sources // Return RAG sources
            };
        }

        // No tool called, just return text
        return {
            answer: message.content || "No tengo una respuesta para eso.",
            sources: sources // Return RAG sources
        };

    } catch (error: any) {
        console.error("[AI Agent] Error:", error);
        return {
            answer: "Lo siento, tuve un problema interno al procesar tu solicitud. Por favor intenta de nuevo.",
            sources: []
        };
    }
}
