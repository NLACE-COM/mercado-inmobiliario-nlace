import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import OpenAI from 'openai'
import { getHistoricalTrends, getTypologyAnalysis, compareCommunes } from '@/lib/brain-agent'

// Increase timeout for Vercel Hobby plan (max 10s usually, but let's try to be fast)
export const maxDuration = 60 // Allow up to 60 seconds (Pro plan) or try to fit in 10s (Hobby)
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/brain/reports/generate
 * Generate a new report with REAL DATA and OpenAI Analysis
 */
export async function POST(request: NextRequest) {
    // Require authentication
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        const body = await request.json()
        const { title, report_type, parameters } = body // e.g., parameters: { commune: 'SANTIAGO' }

        if (!title || !report_type || !parameters) {
            return NextResponse.json(
                { error: 'Missing required fields: title, report_type, parameters' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        // 1. Create Initial Report Entry (status: 'generating') with user_id
        const { data: initialReport, error: createError } = await supabase
            .from('generated_reports')
            .insert({
                title,
                report_type,
                parameters,
                status: 'generating',
                content: null,
                user_id: auth.user.id // Track which user created this report
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating initial report:', createError)
            return NextResponse.json({ error: 'Failed to create report entry' }, { status: 500 })
        }

        // 2. Fetch Real Data from Supabase (Projects Table)
        const polygonWkt = parameters.polygon_wkt
        const commune = parameters.commune?.trim() || ''
        const communes = parameters.communes || []

        let projects: any[] = []
        let searchLocationName = commune
        let reportSections: any[] = []

        // Handle Comparison Report explicitly if communes array is provided
        if (report_type === 'MULTI_COMMUNE_COMPARISON' || communes.length > 1) {
            console.log(`[Report Generate] Generating Multi-Commune Comparison for:`, communes)

            const comparisonResultStr = await compareCommunes({ communes })
            const comparisonData = JSON.parse(comparisonResultStr)

            reportSections.push({
                type: 'comparison_table',
                title: 'Comparativa Detallada entre Comunas',
                data: comparisonData
            })

            // Fetch projects for all communes to provide a combined table/stats if needed
            // Or just use the first one for the summary
            searchLocationName = communes.join(', ')
        }

        if (polygonWkt) {
            console.log(`[Report Generate] Searching via Polygon WKT area...`)
            searchLocationName = "Área Seleccionada"

            const { data: polygonProjects, error: polygonError } = await supabase.rpc('get_projects_in_polygon', {
                polygon_wkt: polygonWkt
            });

            if (polygonError) {
                console.error('Error in geospatial search:', polygonError)
                await updateReportStatus(supabase, initialReport.id, 'failed', `Error en búsqueda geoespacial: ${polygonError.message}`)
                return NextResponse.json({ error: 'Failed geospatial search' }, { status: 500 })
            }
            projects = polygonProjects || []

            if (projects.length > 0 && projects[0].commune) {
                searchLocationName = projects[0].commune
            }
        } else if (commune) {
            console.log(`[Report Generate] Searching projects for commune: "${commune}"`)

            let projectsQuery = supabase
                .from('projects')
                .select('id, name, developer, commune, avg_price_uf, avg_price_m2_uf, total_units, available_units, sales_speed_monthly, project_status, property_type')
                .ilike('commune', commune)

            const { data: communeProjects, error: fetchError } = await projectsQuery.limit(500)

            if (fetchError) {
                console.error('Error fetching project data:', fetchError)
                await updateReportStatus(supabase, initialReport.id, 'failed', fetchError.message)
                return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
            }
            projects = communeProjects || []

            // If single commune, fetch Trends and Typology
            try {
                const trendsStr = await getHistoricalTrends({ commune })
                const trendsData = JSON.parse(trendsStr)
                if (trendsData.trends && trendsData.trends.length > 0) {
                    reportSections.push({
                        type: 'trend_chart',
                        title: `Tendencias del Mercado en ${commune} (6 Meses)`,
                        data: trendsData.trends,
                        trend_indicators: trendsData.indicators
                    })
                }

                const typologyStr = await getTypologyAnalysis({ commune })
                const typologyData = JSON.parse(typologyStr)
                if (typologyData.typologies && typologyData.typologies.length > 0) {
                    // Convert array to Record<string, any> as expected by typology_breakdown renderer
                    const typologyRecord: Record<string, any> = {}
                    typologyData.typologies.forEach((t: any) => {
                        typologyRecord[t.typology] = t
                    })

                    reportSections.push({
                        type: 'typology_breakdown',
                        title: `Distribución por Tipología en ${commune}`,
                        data: typologyRecord
                    })
                }
            } catch (err) {
                console.error("Error fetching Level 1 extensions:", err)
                // Continue without extensions
            }
        }

        if ((!projects || projects.length === 0) && reportSections.length === 0) {
            console.log(`[Report Generate] No projects found for location: "${searchLocationName}"`)
            const notFoundMsg = polygonWkt
                ? `No se encontraron proyectos dentro del área seleccionada en el mapa.`
                : `No se encontraron proyectos para la selección de **${searchLocationName}**.`

            await updateReportStatus(supabase, initialReport.id, 'completed', null, {
                title,
                sections: [
                    {
                        type: 'analysis_text',
                        title: 'Sin Resultados',
                        content: notFoundMsg
                    }
                ]
            })
            return NextResponse.json(initialReport)
        }

        // 3. Calculate Statistics
        const stats = projects.length > 0 ? calculateStats(projects) : null

        // 4. Generate Analysis with OpenAI
        const analysisText = await generateAIAnalysis(searchLocationName, stats, reportSections)

        // 5. Structure Final Content
        const finalSections = []

        if (stats) {
            finalSections.push({
                type: 'kpi_grid',
                data: {
                    total_projects: projects.length,
                    avg_price: Math.round(stats.avgPrice),
                    avg_price_m2: Math.round(stats.avgPriceM2),
                    total_stock: stats.totalStock,
                    avg_sales_speed: stats.avgSalesSpeed.toFixed(1),
                    avg_mao: stats.monthsToSellOut.toFixed(1)
                }
            })
        }

        // Add pre-fetched Level 1 sections
        finalSections.push(...reportSections)

        finalSections.push({
            type: 'analysis_text',
            title: 'Análisis de Mercado Estratégico',
            content: analysisText
        })

        if (stats) {
            finalSections.push({
                type: 'chart_bar',
                title: 'Estado de Obra',
                data: stats.statusDistribution.map(s => ({
                    developer: s.name,
                    stock: s.value
                }))
            })
        }

        if (projects.length > 0) {
            finalSections.push({
                type: 'project_table',
                title: 'Detalle de Proyectos',
                data: projects
                    .sort((a: any, b: any) => (b.available_units || 0) - (a.available_units || 0))
                    .slice(0, 20)
                    .map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        developer: p.developer || 'S/I',
                        stock: p.available_units,
                        avg_price_uf: p.avg_price_uf,
                        sales_speed: p.sales_speed_monthly,
                        mao: p.sales_speed_monthly > 0 ? (p.available_units / p.sales_speed_monthly).toFixed(1) : '-'
                    }))
            })
        }

        const reportContent = {
            title,
            sections: finalSections
        }

        // 6. Update Report (status: 'completed')
        await updateReportStatus(supabase, initialReport.id, 'completed', null, reportContent)

        return NextResponse.json({ ...initialReport, status: 'completed', content: reportContent })

    } catch (error: any) {
        console.error('Error likely in AI generation or DB update:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error during generation' },
            { status: 500 }
        )
    }
}

// --- Helper Functions ---

async function updateReportStatus(supabase: any, id: string, status: string, errorMessage: string | null = null, content: any = null) {
    await supabase
        .from('generated_reports')
        .update({ status, error_message: errorMessage, content })
        .eq('id', id)
}

function calculateStats(projects: any[]) {
    let totalPrice = 0
    let totalPriceM2 = 0
    let totalStock = 0
    let totalSpeed = 0
    let countPrice = 0
    let countPriceM2 = 0

    const statusCount: Record<string, number> = {}

    projects.forEach(p => {
        if (p.avg_price_uf) { totalPrice += Number(p.avg_price_uf); countPrice++; }
        if (p.avg_price_m2_uf) { totalPriceM2 += Number(p.avg_price_m2_uf); countPriceM2++; }
        if (p.available_units) totalStock += Number(p.available_units);
        if (p.sales_speed_monthly) totalSpeed += Number(p.sales_speed_monthly);

        // Status Distribution
        const status = p.project_status || 'Sin Información'
        statusCount[status] = (statusCount[status] || 0) + 1
    })

    const avgPrice = countPrice > 0 ? totalPrice / countPrice : 0
    const avgPriceM2 = countPriceM2 > 0 ? totalPriceM2 / countPriceM2 : 0
    const avgSalesSpeed = projects.length > 0 ? totalSpeed / projects.length : 0
    const monthsToSellOut = avgSalesSpeed > 0 ? (totalStock / avgSalesSpeed) : 0

    // Format for Recharts/Chart.js
    const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

    return {
        avgPrice,
        avgPriceM2,
        totalStock,
        avgSalesSpeed,
        monthsToSellOut,
        statusDistribution
    }
}

async function generateAIAnalysis(commune: string, stats: any, extraSections: any[] = []) {
    try {
        let statsContext = "";
        if (stats) {
            statsContext = `
            - Precio Promedio: ${Math.round(stats.avgPrice)} UF
            - Precio Promedio UF/m²: ${Math.round(stats.avgPriceM2)} UF/m²
            - Stock Total Disponible: ${stats.totalStock} unidades
            - Velocidad de Venta Promedio: ${stats.avgSalesSpeed.toFixed(1)} unidades/mes
            - Meses para Agotar Oferta (MAO): ${stats.monthsToSellOut.toFixed(1)} meses
            - Distribución por Estado: ${JSON.stringify(stats.statusDistribution)}
            `;
        }

        let extraContext = "";
        if (extraSections.length > 0) {
            extraContext = "Datos adicionales disponibles para tu análisis:\n";
            extraSections.forEach(s => {
                if (s.type === 'comparison_table') {
                    extraContext += `- Comparativa de Comunas: ${JSON.stringify(s.data)}\n`;
                } else if (s.type === 'trend_chart') {
                    extraContext += `- Tendencias Históricas (6 meses): ${JSON.stringify(s.data)}\n`;
                } else if (s.type === 'typology_breakdown') {
                    extraContext += `- Desglose por Tipología: ${JSON.stringify(s.data)}\n`;
                }
            });
        }

        const prompt = `
        Actúa como un analista inmobiliario senior experto en el mercado chileno.
        Analiza los siguientes datos del mercado inmobiliario para ${commune}:

        ${statsContext}
        ${extraContext}

        Redacta un análisis estratégico y perspicaz (máximo 4 párrafos).
        IMPORTANTE: Empieza directamente con el contenido, NO incluyas un título de nivel 1 (ej: # Análisis...).
        
        Usa los siguientes puntos como guía:
        ## 1. Contexto General
        Evalúa el estado del mercado basándote en el MAO y los niveles de precio.
        
        ## 2. Análisis de Tendencias y Tipologías
        Si hay datos de tendencias o tipologías, analiza la evolución de precios y qué tipos de unidades están dominando el mercado.
        
        ## 3. Perspectiva Comparativa
        Si hay datos comparativos, identifica qué comunas ofrecen mejores oportunidades o mayor dinamismo.
        
        ## 4. Conclusión Estratégica
        ¿Qué recomendarías a un desarrollador o inversionista hoy en esta zona?
        
        Usa formato Markdown (negritas para destacar cifras y los títulos ## indicados). Sé profesional y directo.
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini", // Fast and cheap
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || "No se pudo generar el análisis detallado."
    } catch (e) {
        console.error("OpenAI Error:", e)
        return "Hubo un error al contactar al servicio de inteligencia artificial para el análisis narrativo. Sin embargo, los datos estadísticos son correctos."
    }
}
